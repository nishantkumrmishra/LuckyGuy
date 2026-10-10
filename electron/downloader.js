const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');

class TaskDownloader extends EventEmitter {
  constructor(task) {
    super();
    this.task = task; // { id, url, destinationPath, chunkCount, headers, ... }
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

  getHeaders(custom = {}) {
    const isPornhub = (this.task.url || '').includes('phncdn') ||
      (this.task.url || '').includes('pornhub') ||
      (this.task.artist || '').toLowerCase().includes('pornhub') ||
      (this.task.author || '').toLowerCase().includes('pornhub');
    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    };
    if (isPornhub) {
      baseHeaders['Referer'] = 'https://www.pornhub.org/';
      baseHeaders['Cookie'] = 'accessAgeDisclaimerPH=1; platform=pc; bs=1; hasVisited=1; age_verified=1;';
    }
    return { ...baseHeaders, ...(this.task.headers || {}), ...custom };
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
      const isPornhub = (this.task.url || '').includes('phncdn') ||
        (this.task.url || '').includes('pornhub') ||
        (this.task.artist || '').toLowerCase().includes('pornhub') ||
        (this.task.author || '').toLowerCase().includes('pornhub');
      const isVideo = this.task.formatType === 'VIDEO' || isPornhub ||
        /\.(mp4|mkv|webm|avi|mov)$/i.test(this.task.destinationPath || '');
      const supportsRange = probe.acceptRanges && this.totalBytes > 1024 * 1024;

      // Videos MUST always use single continuous stream (1 chunk) to prevent fragmented .part files
      const effectiveChunks = (isVideo || !supportsRange) ? 1 : Math.min(Math.max(this.task.chunkCount || 8, 1), 16);

      if (!supportsRange || effectiveChunks <= 1) {
        // Single stream download directly to destinationPath with auto-resume on drop
        await this.downloadSingle(this.task.url, this.task.destinationPath);
      } else {
        // Parallel multi-chunk download
        await this.downloadMultiChunk(this.task.url, this.task.destinationPath, effectiveChunks);
      }

      if (this.isCanceled) {
        this.status = 'CANCELED';
        this.cleanPartFiles();
        try { if (fs.existsSync(this.task.destinationPath)) fs.unlinkSync(this.task.destinationPath); } catch (e) {}
        this.emit('update', this.snapshot());
        return;
      }

      if (this.isPaused) {
        this.status = 'PAUSED';
        this.emit('update', this.snapshot());
        return;
      }

      // Verify that full content was actually received
      if (this.totalBytes > 0 && this.downloadedBytes < this.totalBytes) {
        throw new Error(`Incomplete download: received ${this.downloadedBytes} of ${this.totalBytes} bytes`);
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
        // Clean up empty 0-byte file if it failed before starting
        try {
          if (fs.existsSync(this.task.destinationPath)) {
            const stat = fs.statSync(this.task.destinationPath);
            if (stat.size === 0) fs.unlinkSync(this.task.destinationPath);
          }
        } catch (e) {}
        this.emit('update', this.snapshot());
        this.emit('error', err);
      }
    }
  }

  probeUrl(targetUrl) {
    return new Promise((resolve) => {
      try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;
        const method = 'GET';
        const reqHeaders = this.getHeaders({ 'Range': 'bytes=0-0' });

        const req = client.request(urlObj, { method, headers: reqHeaders }, (res) => {
          // Handle redirect
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            req.destroy();
            return resolve(this.probeUrl(res.headers.location));
          }

          let len = 0;
          if (res.headers['content-range']) {
            const match = res.headers['content-range'].match(/\/(\d+)/);
            if (match) len = parseInt(match[1], 10);
          } else if (res.headers['content-length']) {
            len = parseInt(res.headers['content-length'], 10);
          }
          const ranges = (res.headers['accept-ranges'] || '').toLowerCase() === 'bytes' || !!res.headers['content-range'];
          req.destroy();
          resolve({ contentLength: len, acceptRanges: ranges });
        });

        req.on('error', () => {
          resolve({ contentLength: 0, acceptRanges: false });
        });

        req.end();
      } catch (e) {
        resolve({ contentLength: 0, acceptRanges: false });
      }
    });
  }

  downloadSingle(targetUrl, destinationPath, resumeFrom = 0, retriesLeft = 8) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        let lastCalcTime = Date.now();
        let lastBytes = resumeFrom;

        const fileStream = fs.createWriteStream(destinationPath, {
          flags: resumeFrom > 0 ? 'a' : 'w'
        });

        const headers = this.getHeaders(resumeFrom > 0 ? { 'Range': `bytes=${resumeFrom}-` } : {});

        const req = client.get(urlObj, { headers }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            fileStream.close();
            return this.downloadSingle(res.headers.location, destinationPath, resumeFrom, retriesLeft).then(resolve).catch(reject);
          }

          if (res.statusCode >= 400) {
            fileStream.close();
            return reject(new Error(`Server returned HTTP ${res.statusCode} ${res.statusMessage || ''}`));
          }

          if (this.totalBytes === 0) {
            if (res.headers['content-range']) {
              const match = res.headers['content-range'].match(/\/(\d+)/);
              if (match) this.totalBytes = parseInt(match[1], 10);
            } else if (res.headers['content-length']) {
              this.totalBytes = resumeFrom + parseInt(res.headers['content-length'], 10);
            }
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
            if (elapsed >= 350) {
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
            fileStream.on('finish', () => {
              if (this.isCanceled || this.isPaused) return resolve();

              // If stream ended prematurely before all bytes were received, resume automatically!
              if (this.totalBytes > 0 && this.downloadedBytes < this.totalBytes && retriesLeft > 0) {
                console.warn(`[Downloader] Stream ended prematurely at ${this.downloadedBytes}/${this.totalBytes}. Resuming from byte ${this.downloadedBytes}...`);
                this.downloadSingle(targetUrl, destinationPath, this.downloadedBytes, retriesLeft - 1)
                  .then(resolve)
                  .catch(reject);
              } else {
                resolve();
              }
            });
          });

          res.on('error', (e) => {
            fileStream.close();
            if (this.totalBytes > 0 && this.downloadedBytes < this.totalBytes && retriesLeft > 0 && !this.isCanceled && !this.isPaused) {
              console.warn(`[Downloader] Socket error (${e.message}) at ${this.downloadedBytes}/${this.totalBytes}. Resuming in 1s...`);
              setTimeout(() => {
                this.downloadSingle(targetUrl, destinationPath, this.downloadedBytes, retriesLeft - 1)
                  .then(resolve)
                  .catch(reject);
              }, 1000);
            } else {
              reject(e);
            }
          });
        });

        req.on('error', (e) => {
          fileStream.close();
          if (this.totalBytes > 0 && this.downloadedBytes < this.totalBytes && retriesLeft > 0 && !this.isCanceled && !this.isPaused) {
            console.warn(`[Downloader] Request error (${e.message}) at ${this.downloadedBytes}/${this.totalBytes}. Resuming in 1s...`);
            setTimeout(() => {
              this.downloadSingle(targetUrl, destinationPath, this.downloadedBytes, retriesLeft - 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
          } else {
            reject(e);
          }
        });

        this.chunkRequests.push(req);
      } catch (err) {
        reject(err);
      }
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
        try {
          const urlObj = new URL(targetUrl);
          const client = urlObj.protocol === 'https:' ? https : http;

          const partStream = fs.createWriteStream(partPath);
          const req = client.get(urlObj, {
            headers: this.getHeaders({
              'Range': `bytes=${start}-${end}`
            })
          }, (res) => {
            if (res.statusCode >= 400) {
              partStream.close();
              return reject(new Error(`Server returned HTTP ${res.statusCode}`));
            }

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
            });

            partStream.on('finish', () => {
              resolve();
            });

            partStream.on('error', (err) => {
              partStream.close();
              reject(err);
            });

            res.on('error', (err) => {
              partStream.close();
              reject(err);
            });
          });

          req.on('error', (err) => {
            partStream.close();
            reject(err);
          });
          this.chunkRequests.push(req);
        } catch (e) {
          reject(e);
        }
      }));
    }

    await Promise.all(chunkPromises);

    if (this.isCanceled || this.isPaused) return;

    // Merge part files sequentially into final file using streams with proper backpressure
    this.status = 'MERGING';
    this.emit('update', this.snapshot());

    await new Promise((resolve, reject) => {
      const outStream = fs.createWriteStream(destinationPath);
      outStream.on('error', reject);
      outStream.on('finish', resolve);

      let pIdx = 0;
      const pipeNext = () => {
        if (pIdx >= this.partFiles.length) {
          outStream.end();
          return;
        }
        const part = this.partFiles[pIdx++];
        if (!fs.existsSync(part)) {
          pipeNext();
          return;
        }
        const inStream = fs.createReadStream(part);
        inStream.on('error', reject);
        inStream.pipe(outStream, { end: false });
        inStream.on('end', () => {
          try { fs.unlinkSync(part); } catch (e) {}
          pipeNext();
        });
      };
      pipeNext();
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
    super();
    this.tasks = new Map();
    this.activeDownloaders = new Map();
    // Catch-all error listener to prevent ERR_UNHANDLED_ERROR crashes in Node
    this.on('error', () => {});
  }

  addTask(taskConfig) {
    const downloader = new TaskDownloader(taskConfig);
    this.tasks.set(taskConfig.id, downloader.snapshot());
    this.activeDownloaders.set(taskConfig.id, downloader);

    downloader.on('update', (snap) => {
      this.tasks.set(taskConfig.id, snap);
      this.emit('update', snap);
    });

    downloader.on('completed', (snap) => {
      this.tasks.delete(taskConfig.id);
      this.activeDownloaders.delete(taskConfig.id);
      this.emit('completed', snap);
    });

    downloader.on('error', (err) => {
      this.emit('failed', { id: taskConfig.id, error: err.message });
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
      d.pause();
    }
  }

  resumeAll() {
    for (const [id, snap] of this.tasks.entries()) {
      if (snap.status === 'PAUSED') {
        this.resumeTask(id);
      }
    }
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

module.exports = { DownloadManager, TaskDownloader };
