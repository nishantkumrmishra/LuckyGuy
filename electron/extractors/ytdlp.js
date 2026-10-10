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
    const bundledFfmpeg = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
    if (fs.existsSync(bundledFfmpeg)) return path.dirname(bundledFfmpeg);
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

      if (this.ffmpegPath) {
        args.push('--ffmpeg-location', this.ffmpegPath);
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
}

module.exports = new YtDlpWrapper();
