const fs = require('fs');
const path = require('path');

class HistoryManager {
  constructor(userDataDir) {
    this.userDataDir = userDataDir;
    this.logFile = path.join(userDataDir, 'download_history.log');
    this.downloadedKeys = new Set();
    this.init();
  }

  normalizeKey(title, artist) {
    const t = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${t}__${a}`;
  }

  init() {
    try {
      if (fs.existsSync(this.logFile)) {
        const lines = fs.readFileSync(this.logFile, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim() || line.startsWith('#')) continue;
          const parts = line.split(' | ');
          if (parts.length >= 2) {
            const key = parts[1].trim();
            if (key) this.downloadedKeys.add(key);
          }
        }
      } else {
        const header = '# LocalGuy Download History Log\n# Format: Timestamp | NormalizedKey | Status | FilePath\n';
        fs.writeFileSync(this.logFile, header, 'utf8');
      }
    } catch (err) {
      console.warn('[HistoryManager] Init error:', err.message);
    }
  }

  isDownloaded(title, artist, targetPath) {
    // Only consider downloaded if the file physically exists on disk
    if (targetPath && typeof targetPath === 'string') {
      return fs.existsSync(targetPath);
    }
    return false;
  }

  recordDownload(title, artist, targetPath, status = 'COMPLETED') {
    const key = this.normalizeKey(title, artist);
    this.downloadedKeys.add(key);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const line = `${now} | ${key} | ${status} | ${targetPath || ''}\n`;

    try {
      fs.appendFileSync(this.logFile, line, 'utf8');
    } catch (err) {
      console.warn('[HistoryManager] Append error:', err.message);
    }
  }
}

module.exports = HistoryManager;
