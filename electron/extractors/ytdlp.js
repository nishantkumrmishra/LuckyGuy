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
          return resolve([]);\n        }\n\n        const items = [];\n        const lines = stdout.trim().split('\\n');\n        for (const line of lines) {\n          if (!line.trim()) continue;\n          try {\n            const raw = JSON.parse(line.trim());\n            items.push({\n              id: 'yt-' + raw.id,\n              title: raw.title || 'YouTube Video',\n              author: raw.uploader || raw.channel || 'Creator',\n              duration: raw.duration_string || (raw.duration ? `${Math.floor(raw.duration / 60)}:${raw.duration % 60}` : '3:45'),\n              thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails[0]?.url) || `https://i.ytimg.com/vi/${raw.id}/hqdefault.jpg`,\n              url: `https://www.youtube.com/watch?v=${raw.id}`,\n              views: raw.view_count ? `${(raw.view_count / 1000).toFixed(0)}K` : 'YouTube',\n              quality: '1080p HD',\n              formatType: 'VIDEO',\n              mediaType: 'video',\n            });\n          } catch (e) {}\n        }\n        resolve(items);\n      });\n    });\n  }\n\n  download(url, destinationPath, onProgress, options = {}) {\n    return new Promise((resolve, reject) => {\n      const isAudioOnly = options.formatType === 'AUDIO' || options.mediaType === 'audio';\n      const ffmpegDir = this.resolveFfmpeg();\n\n      const args = [\n        '--newline',\n        '--progress-template', 'PROGRESS:%(progress._percent_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress._speed_str)s|%(progress._eta_str)s',\n        '--no-playlist',\n      ];\n\n      if (ffmpegDir) {\n        args.push('--ffmpeg-location', ffmpegDir);\n      }\n\n      if (isAudioOnly) {\n        args.push('-x', '--audio-format', 'mp3');\n      } else {\n        args.push(\n          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',\n          '--merge-output-format', 'mp4'\n        );\n      }\n\n      args.push('--write-thumbnail', '--convert-thumbnails', 'jpg');\n      args.push('-o', destinationPath);\n      args.push(url);\n\n      const proc = spawn(this.binPath, args, { windowsHide: true });\n      let stderrOutput = '';\n\n      proc.stdout.on('data', (chunk) => {\n        const text = chunk.toString();\n        const lines = text.split('\\n');\n        for (const line of lines) {\n          if (line.startsWith('PROGRESS:')) {\n            const parts = line.replace('PROGRESS:', '').trim().split('|');\n            const downloadedBytes = parseInt(parts[1], 10) || 0;\n            const totalBytes = parseInt(parts[2], 10) || 0;\n            const rawSpeed = parts[3] || '';\n            const rawEta = parts[4] || '';\n            \n            let speedBytesPerSec = 0;\n            if (rawSpeed.includes('MiB/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed) * 1024 * 1024);\n            else if (rawSpeed.includes('KiB/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed) * 1024);\n            else if (rawSpeed.includes('B/s')) speedBytesPerSec = Math.round(parseFloat(rawSpeed));\n\n            let etaSeconds = 0;\n            if (rawEta.includes(':')) {\n              const [min, sec] = rawEta.split(':').map(Number);\n              etaSeconds = (min || 0) * 60 + (sec || 0);\n            }\n\n            if (onProgress) {\n              onProgress({\n                downloadedBytes,\n                totalBytes,\n                speedBytesPerSec,\n                etaSeconds,\n                percentStr: parts[0]?.trim()\n              });\n            }\n          }\n        }\n      });\n\n      proc.stderr.on('data', (chunk) => {\n        stderrOutput += chunk.toString();\n      });\n\n      proc.on('close', (code) => {\n        if (code === 0) {\n          if (fs.existsSync(destinationPath) && fs.statSync(destinationPath).size > 0) {\n            const base = destinationPath.replace(/\\.[^/.]+$/, '');\n            const jpgThumb = `${base}.jpg`;\n            const webpThumb = `${base}.webp`;\n            if (fs.existsSync(webpThumb) && !fs.existsSync(jpgThumb)) {\n              if (ffmpegDir) {\n                const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');\n                execFile(ffmpegExe, ['-y', '-i', webpThumb, jpgThumb], () => {\n                  try { fs.unlinkSync(webpThumb); } catch (e) {}\n                });\n              }\n            }\n            resolve({ destinationPath });\n          } else {\n            reject(new Error(`Download finished but output file not found: ${stderrOutput}`));\n          }\n        } else {\n          reject(new Error(`yt-dlp download failed with code ${code}: ${stderrOutput}`));\n        }\n      });\n\n      proc.on('error', (err) => {\n        reject(err);\n      });\n\n      if (options.registerProcess) {\n        options.registerProcess(proc);\n      }\n    });\n  }\n}\n\nmodule.exports = new YtDlpWrapper();\n