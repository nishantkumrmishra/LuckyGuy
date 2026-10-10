const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class YtDlpWrapper {
  constructor() {
    this.binPath = this.resolveBinary();
    this.ffmpegPath = this.resolveFfmpeg();
  }

  resolveBinary() {
    // 1. Check bundled electron/bin
    const bundled = path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
    if (fs.existsSync(bundled)) return bundled;

    // 2. Check local AppData WinGet path
    const wingetPath = path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft', 'WinGet', 'Packages',
      'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe', 'yt-dlp.exe'
    );
    if (fs.existsSync(wingetPath)) return wingetPath;

    // 3. Fallback to system PATH
    return 'yt-dlp';
  }

  resolveFfmpeg() {
    // 1. Check bundled electron/bin
    const bundledFfmpeg = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
    if (fs.existsSync(bundledFfmpeg)) return path.dirname(bundledFfmpeg);

    // 2. Check local AppData WinGet path
    const wingetFfmpegDir = path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft', 'WinGet', 'Packages',
      'yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'
    );
    if (fs.existsSync(wingetFfmpegDir)) {
      try {
        const subdirs = fs.readdirSync(wingetFfmpegDir);
        for (const sub of subdirs) {
          const binPath = path.join(wingetFfmpegDir, sub, 'bin');
          if (fs.existsSync(path.join(binPath, 'ffmpeg.exe'))) {
            return binPath;
          }
        }
      } catch (e) {}
    }

    return null;
  }

  async extractInfo(targetUrl) {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--skip-download',
      ];

      const ffmpegDir = this.resolveFfmpeg();
      if (ffmpegDir) {
        args.push('--ffmpeg-location', ffmpegDir);
      }

      args.push(targetUrl);

      execFile(this.binPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr || err.message));
        }

        try {
          const info = JSON.parse(stdout);
          
          // Filter and extract clean formats
          const streams = {};
          let audioStreamUrl = null;
          if (Array.isArray(info.formats)) {
            const audioFormats = info.formats.filter(f => f.acodec && f.acodec !== 'none' && f.url);
            const m4aAudio = audioFormats.find(f => f.ext === 'm4a' || (f.acodec && f.acodec.includes('mp4a')));
            audioStreamUrl = m4aAudio ? m4aAudio.url : (audioFormats[audioFormats.length - 1]?.url || null);
          }
          if (Array.isArray(info.formats)) {
            // Find best direct mp4 video streams
            for (const f of info.formats) {
              if (f.url && (f.ext === 'mp4' || f.vcodec !== 'none')) {
                const label = f.format_note || `${f.height}p` || f.resolution || 'HD';
                if (!streams[label]) {
                  streams[label] = f.url;
                }
              }
            }
          }

          resolve({
            id: info.id,
            title: info.title || 'YouTube Video',
            author: info.uploader || info.channel || 'YouTube Creator',
            channel: info.uploader || info.channel || 'YouTube',
            duration: info.duration || 0,
            durationFormatted: info.duration_string || `${Math.floor((info.duration || 0) / 60)}:${(info.duration || 0) % 60}`,
            thumbnail: info.thumbnail || '',
            views: info.view_count ? `${(info.view_count / 1000).toFixed(0)}K views` : 'YouTube',
            url: info.webpage_url || targetUrl,
            streamUrl: info.url || Object.values(streams)[0] || null,
            streams,
            audioStreamUrl,
            formatType: 'VIDEO',
            mediaType: 'video',
          });
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });
  }

  async search(query, limit = 15) {
    return new Promise((resolve) => {
      const args = [
        `ytsearch${limit}:${query}`,
        '--dump-json',
        '--no-warnings',
        '--flat-playlist',
        '--skip-download',
      ];

      execFile(this.binPath, args, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
        if (err || !stdout) {
          return resolve([]);
        }

        const items = [];
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const raw = JSON.parse(line.trim());
            items.push({
              id: 'yt-' + raw.id,
              title: raw.title || 'YouTube Video',
              author: raw.uploader || raw.channel || 'Creator',
              duration: raw.duration_string || (raw.duration ? `${Math.floor(raw.duration / 60)}:${raw.duration % 60}` : '3:45'),
              thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails[0]?.url) || `https://i.ytimg.com/vi/${raw.id}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${raw.id}`,
              views: raw.view_count ? `${(raw.view_count / 1000).toFixed(0)}K` : 'YouTube',
              quality: '1080p HD',
              formatType: 'VIDEO',
              mediaType: 'video',
            });
          } catch (e) {}
        }
        resolve(items);
      });
    });
  }

  download(url, destinationPath, onProgress, options = {}) {
    return new Promise((resolve, reject) => {
      const isAudioOnly = options.formatType === 'AUDIO' || options.mediaType === 'audio';
      const ffmpegDir = this.resolveFfmpeg();

      const args = [
        '--newline',
        '--progress-template', 'PROGRESS:%(progress._percent_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress._speed_str)s|%(progress._eta_str)s',
        '--no-playlist',
      ];

      if (ffmpegDir) {
        args.push('--ffmpeg-location', ffmpegDir);
      }

      if (isAudioOnly) {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        args.push(
          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
          '--merge-output-format', 'mp4'
        );
      }

      args.push('--write-thumbnail', '--convert-thumbnails', 'jpg');
      args.push('-o', destinationPath);
      args.push(url);

      const proc = spawn(this.binPath, args, { windowsHide: true });
      let stderrOutput = '';

      proc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('PROGRESS:')) {
            const parts = line.replace('PROGRESS:', '').trim().split('|');
            const downloadedBytes = parseInt(parts[1], 10) || 0;
            const totalBytes = parseInt(parts[2], 10) || 0;
            const rawSpeed = parts[3] || '';
            const rawEta = parts[4] || '';
            
            let speedBytesPerSec = 0;
            if (rawSpeed.includes('MiB/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed) * 1024 * 1024);
            else if (rawSpeed.includes('KiB/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed) * 1024);
            else if (rawSpeed.includes('B/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed));

            let etaSeconds = 0;
            if (rawEta.includes(':')) {
              const [min, sec] = rawEta.split(':').map(Number);
              etaSeconds = (min || 0) * 60 + (sec || 0);
            }

            if (onProgress) {
              onProgress({
                downloadedBytes,
                totalBytes,
                speedBytesPerSec,
                etaSeconds,
                percentStr: parts[0]?.trim()
              });
            }
          }
        }
      });

      proc.stderr.on('data', (chunk) => {
        stderrOutput += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (fs.existsSync(destinationPath) && fs.statSync(destinationPath).size > 0) {
            const base = destinationPath.replace(/\.[^/.]+$/, '');
            const jpgThumb = `${base}.jpg`;
            const webpThumb = `${base}.webp`;
            if (fs.existsSync(webpThumb) && !fs.existsSync(jpgThumb)) {
              if (ffmpegDir) {
                const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');
                execFile(ffmpegExe, ['-y', '-i', webpThumb, jpgThumb], () => {
                  try { fs.unlinkSync(webpThumb); } catch (e) {}
                });
              }
            }
            resolve({ destinationPath });
          } else {
            reject(new Error(`Download finished but output file not found: ${stderrOutput}`));
          }
        } else {
          reject(new Error(`yt-dlp download failed with code ${code}: ${stderrOutput}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      if (options.registerProcess) {
        options.registerProcess(proc);
      }
    });
  }
}

module.exports = new YtDlpWrapper();
