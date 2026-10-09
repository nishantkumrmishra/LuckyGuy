const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');

class TaskDownloader extends EventEmitter {
  constructor(task) {
    super();
    this.task = task; // { id, url, destinationPath, chunkCount, ... }
    this.status = 'QUEUED';
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.speedBytesPerSec = 0;
    this.etaSeconds = 0;
    this.activeChunks = 0;
    this.isPaused = false;
    this.isCanceled = false;
    this.chunkRequests = [];
    this.partFiles = [];
  }

  async start() {
    this.status = 'DOWNLOADING';
    this.emit('update', this.snapshot());

    try {
      // Ensure target directory exists
      const targetDir = path.dirname(this.task.destinationPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 1. Probe total size and range support
      const probe = await this.probeUrl(this.task.url);
      this.totalBytes = probe.contentLength || 0;
      const supportsRange = probe.acceptRanges && this.totalBytes > 1024 * 1024;
      const effectiveChunks = supportsRange ? Math.min(Math.max(this.task.chunkCount || 8, 1), 16) : 1;

      if (!supportsRange || effectiveChunks <= 1) {
        // Single stream download
        await this.downloadSingle(this.task.url, this.task.destinationPath);
      } else {
        // Parallel multi-chunk download
        await this.downloadMultiChunk(this.task.url, this.task.destinationPath, effectiveChunks);
      }

      if (this.isCanceled) {
        this.status = 'CANCELED';
        this.cleanPartFiles();
        this.emit('update', this.snapshot());
        return;
      }

      if (this.isPaused) {
        this.status = 'PAUSED';
        this.emit('update', this.snapshot());
        return;
      }

      this.status = 'COMPLETED';
      this.speedBytesPerSec = 0;
      this.etaSeconds = 0;
      this.emit('update', this.snapshot());
      this.emit('completed', this.snapshot());
    } catch (err) {
      if (!this.isCanceled && !this.isPaused) {
        this.status = 'ERROR';
        this.errorMessage = err.message;
        this.emit('update', this.snapshot());
        this.emit('error', err);
      }
    }
  }

  probeUrl(targetUrl) {
    return new Promise((resolve) => {
      const urlObj = new URL(targetUrl);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(urlObj, { method: 'HEAD', headers: { 'User-Agent': 'TurboLocal/1.0' } }, (res) => {
        // Handle redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.probeUrl(res.headers.location));
        }

        const len = parseInt(res.headers['content-length'] || '0', 10);
        const ranges = (res.headers['accept-ranges'] || '').toLowerCase() === 'bytes';
        resolve({ contentLength: len, acceptRanges: ranges });
      });

      req.on('error', () => {
        resolve({ contentLength: 0, acceptRanges: false });
      });

      req.end();
    });
  }

  downloadSingle(targetUrl, destinationPath) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(targetUrl);
      const client = urlObj.protocol === 'https:' ? https : http;

      let lastCalcTime = Date.now();
      let lastBytes = 0;

      const fileStream = fs.createWriteStream(destinationPath);
      const req = client.get(urlObj, { headers: { 'User-Agent': 'TurboLocal/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fileStream.close();
          return this.downloadSingle(res.headers.location, destinationPath).then(resolve).catch(reject);
        }

        if (this.totalBytes === 0 && res.headers['content-length']) {
          this.totalBytes = parseInt(res.headers['content-length'], 10);
        }

        res.on('data', (chunk) => {
          if (this.isCanceled || this.isPaused) {
            req.destroy();
            fileStream.close();
            return;
          }

          this.downloadedBytes += chunk.length;
          fileStream.write(chunk);

          const now = Date.now();
          const elapsed = now - lastCalcTime;
          if (elapsed >= 400) {
            const bytesDelta = this.downloadedBytes - lastBytes;
            this.speedBytesPerSec = Math.round((bytesDelta * 1000) / elapsed);
            lastCalcTime = now;
            lastBytes = this.downloadedBytes;

            if (this.totalBytes > 0) {
              const remaining = Math.max(0, this.totalBytes - this.downloadedBytes);
              this.etaSeconds = this.speedBytesPerSec > 0 ? Math.round(remaining / this.speedBytesPerSec) : 0;
            }

            this.emit('update', this.snapshot());
          }
        });

        res.on('end', () => {
          fileStream.end();
          resolve();
        });

        res.on('error', (e) => {
          fileStream.close();
          reject(e);
        });
      });

      req.on('error', (e) => {
        fileStream.close();
        reject(e);
      });

      this.chunkRequests.push(req);
    });
  }

  async downloadMultiChunk(targetUrl, destinationPath, chunkCount) {
    const chunkSize = Math.floor(this.totalBytes / chunkCount);
    this.activeChunks = chunkCount;
    this.partFiles = [];

    let lastCalcTime = Date.now();
    let lastBytes = 0;

    const chunkPromises = [];

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = i === chunkCount - 1 ? this.totalBytes - 1 : start + chunkSize - 1;
      const partPath = `${destinationPath}.part${i}`;
      this.partFiles.push(partPath);

      chunkPromises.push(new Promise((resolve, reject) => {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        const partStream = fs.createWriteStream(partPath);
        const req = client.get(urlObj, {
          headers: {
            'User-Agent': 'TurboLocal/1.0',
            'Range': `bytes=${start}-${end}`
          }
        }, (res) => {
          res.on('data', (chunk) => {
            if (this.isCanceled || this.isPaused) {
              req.destroy();
              partStream.close();
              return;
            }

            this.downloadedBytes += chunk.length;
            partStream.write(chunk);

            const now = Date.now();
            const elapsed = now - lastCalcTime;
            if (elapsed >= 350) {
              const bytesDelta = this.downloadedBytes - lastBytes;
              this.speedBytesPerSec = Math.round((bytesDelta * 1000) / elapsed);
              lastCalcTime = now;
              lastBytes = this.downloadedBytes;

              const remaining = Math.max(0, this.totalBytes - this.downloadedBytes);
              this.etaSeconds = this.speedBytesPerSec > 0 ? Math.round(remaining / this.speedBytesPerSec) : 0;

              this.emit('update', this.snapshot());
            }
          });

          res.on('end', () => {
            partStream.end();
            resolve();
          });

          res.on('error', reject);
        });

        req.on('error', reject);
        this.chunkRequests.push(req);
      }));
    }

    await Promise.all(chunkPromises);

    if (this.isCanceled || this.isPaused) return;

    // Merge part files into final file
    this.status = 'MERGING';
    this.emit('update', this.snapshot());

    await new Promise((resolve, reject) => {
      const outStream = fs.createWriteStream(destinationPath);
      outStream.on('error', reject);
      outStream.on('finish', resolve);
      for (const part of this.partFiles) {
        if (fs.existsSync(part)) {
          const buffer = fs.readFileSync(part);
          outStream.write(buffer);
          try { fs.unlinkSync(part); } catch (e) {}
        }
      }
      outStream.end();
    });
  }

  cleanPartFiles() {
    for (const part of this.partFiles) {
      try {
        if (fs.existsSync(part)) fs.unlinkSync(part);
      } catch (e) {}
    }
  }

  pause() {
    this.isPaused = true;
    this.chunkRequests.forEach(req => req && req.destroy && req.destroy());
    this.status = 'PAUSED';
    this.emit('update', this.snapshot());
  }

  cancel() {
    this.isCanceled = true;
    this.chunkRequests.forEach(req => req && req.destroy && req.destroy());
    this.cleanPartFiles();
    this.status = 'CANCELED';
    this.emit('update', this.snapshot());
  }

  snapshot() {
    const progress = this.totalBytes > 0 ? Math.min(1.0, this.downloadedBytes / this.totalBytes) : 0;
    return {
      ...this.task,
      status: this.status,
      downloadedBytes: this.downloadedBytes,
      totalBytes: this.totalBytes,
      speedBytesPerSec: this.speedBytesPerSec,
      etaSeconds: this.etaSeconds,
      progress,
      activeChunks: this.activeChunks,
      errorMessage: this.errorMessage || null
    };
  }
}

class DownloadManager extends EventEmitter {
  constructor() {
    this.tasks = new Map();
    this.activeDownloaders = new Map();
  }

  addTask(taskConfig) {
    const downloader = new TaskDownloader(taskConfig);
    this.tasks.set(taskConfig.id, downloader.snapshot());
    this.activeDownloaders.set(taskConfig.id, downloader);

    downloader.on('update', (snap) => {
      this.tasks.set(taskConfig.id, snap);
    });

    downloader.start();
    return downloader;
  }

  pauseTask(id) {
    const d = this.activeDownloaders.get(id);
    if (d) d.pause();
  }

  resumeTask(id) {
    const prev = this.tasks.get(id);
    if (prev) {
      prev.status = 'QUEUED';
      this.addTask(prev);
    }
  }

  cancelTask(id) {
    const d = this.activeDownloaders.get(id);
    if (d) d.cancel();
  }

  removeTask(id) {
    this.cancelTask(id);
    this.tasks.delete(id);
    this.activeDownloaders.delete(id);
  }

  pauseAll() {
    for (const d of this.activeDownloaders.values()) {
      if (d && !d.isPaused && !d.isCanceled) d.pause();
    }
  }

  resumeAll() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'PAUSED') this.resumeTask(id);
    }
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

module.exports = {
  DownloadManager,
  TaskDownloader
};
