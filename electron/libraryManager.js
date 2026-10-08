const fs = require('fs');
const path = require('path');
const os = require('os');
const { extractId3Artwork } = require('./id3Tagger');

class LibraryManager {
  constructor(userDataDir) {
    this.userDataDir = userDataDir;
    this.libraryFile = path.join(userDataDir, 'library_cache.json');
    this.playlistsFile = path.join(userDataDir, 'playlists.json');
    this.ledgerFile = path.join(userDataDir, 'bookkeeping_ledger.json');
    this.bookmarksFile = path.join(userDataDir, 'bookmarks.json');

    this.songs = [];
    this.playlists = [];
    this.ledger = [];
    this.bookmarks = [];

    this.loadState();
  }

  
  getPlaylistsDir() {
    const musicDir = path.join(os.homedir(), 'Music');
    const plDir = path.join(musicDir, 'Playlists');
    if (!fs.existsSync(plDir)) {
      try { fs.mkdirSync(plDir, { recursive: true }); } catch(e) {}
    }
    return plDir;
  }

  syncPlaylistsFromDisk() {
    const plDir = this.getPlaylistsDir();
    const validExts = new Set(['.mp3', '.m4a', '.flac', '.wav', '.aac', '.ogg', '.webm']);
    const discoveredPlaylists = [];

    if (fs.existsSync(plDir)) {
      try {
        const entries = fs.readdirSync(plDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const folderPath = path.join(plDir, entry.name);
            const trackFiles = [];
            try {
              const fEntries = fs.readdirSync(folderPath, { withFileTypes: true });
              for (const fe of fEntries) {
                if (fe.isFile()) {
                  const ext = path.extname(fe.name).toLowerCase();
                  if (validExts.has(ext)) {
                    trackFiles.push(path.join(folderPath, fe.name));
                  }
                }
              }
            } catch(e) {}

            discoveredPlaylists.push({
              id: 'pl-' + Buffer.from(entry.name).toString('base64').replace(/=/g, ''),
              name: entry.name,
              title: entry.name,
              folderPath,
              tracks: trackFiles,
              trackCount: trackFiles.length,
              createdAt: fs.statSync(folderPath).birthtimeMs || Date.now(),
            });
          }
        }
      } catch(e) {}
    }

    // Keep any non-disk playlists if present, but prioritize disk folders
    const diskNames = new Set(discoveredPlaylists.map(p => p.name));
    for (const pl of (this.playlists || [])) {
      if (!diskNames.has(pl.name || pl.title)) {
        // Create folder on disk for it
        try {
          const folder = path.join(plDir, pl.name || pl.title || pl.id);
          if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
          discoveredPlaylists.push({
            ...pl,
            name: pl.name || pl.title,
            title: pl.name || pl.title,
            folderPath: folder,
            tracks: pl.tracks || pl.songIds || [],
            trackCount: (pl.tracks || pl.songIds || []).length,
          });
        } catch(e) {}
      }
    }

    this.playlists = discoveredPlaylists;
    this.savePlaylists();
    return this.playlists;
  }

  loadState() {
    try {
      if (fs.existsSync(this.libraryFile)) {
        const raw = JSON.parse(fs.readFileSync(this.libraryFile, 'utf8'));
        this.songs = (Array.isArray(raw) ? raw : []).filter(s => s.filePath && fs.existsSync(s.filePath));
        if (raw.length !== this.songs.length) { this.saveLibrary(); } // persist prune
      }
    } catch (e) { this.songs = []; }

    try {
      if (fs.existsSync(this.playlistsFile)) {
        this.playlists = JSON.parse(fs.readFileSync(this.playlistsFile, 'utf8'));
      } else {
        this.playlists = [
          { id: 'favs', title: 'Favorites', songIds: [], createdAt: Date.now() },
          { id: 'workout', title: 'High Energy', songIds: [], createdAt: Date.now() }
        ];
        this.savePlaylists();
      }
    } catch (e) { this.playlists = []; }

    try {
      if (fs.existsSync(this.ledgerFile)) {
        this.ledger = JSON.parse(fs.readFileSync(this.ledgerFile, 'utf8'));
      } else {
        this.ledger = [];
      }
    } catch (e) { this.ledger = []; }

    try {
      if (fs.existsSync(this.bookmarksFile)) {
        this.bookmarks = JSON.parse(fs.readFileSync(this.bookmarksFile, 'utf8'));
      } else {
        this.bookmarks = [];
      }
    } catch (e) { this.bookmarks = []; }
  }

  saveLibrary() {
    try {
      fs.writeFileSync(this.libraryFile, JSON.stringify(this.songs, null, 2));
    } catch (e) {}
  }

  savePlaylists() {
    try {
      fs.writeFileSync(this.playlistsFile, JSON.stringify(this.playlists, null, 2));
    } catch (e) {}
  }

  saveLedger() {
    try {
      fs.writeFileSync(this.ledgerFile, JSON.stringify(this.ledger, null, 2));
    } catch (e) {}
  }

  saveBookmarks() {
    try {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(this.bookmarks, null, 2));
    } catch (e) {}
  }

  // --- Scan Local Directories ---
  scanDirectories(directories) {
    const validExts = new Set(['.mp3', '.m4a', '.flac', '.wav', '.aac', '.ogg', '.mp4', '.mkv', '.webm']);
    const discovered = [];

    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Avoid deep hidden / node_modules folders
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              walk(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (validExts.has(ext)) {
              const stat = fs.statSync(fullPath);
              const basename = path.basename(entry.name, ext);
              const parts = basename.split(' - ');
              const artist = parts.length > 1 ? parts[0].trim() : 'Local Artist';
              const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : basename;

              discovered.push({
                id: Buffer.from(fullPath).toString('base64').replace(/=/g, ''),
                title,
                artist,
                album: path.basename(path.dirname(fullPath)),
                durationSeconds: Math.round(stat.size / (160 * 128)), // estimate or placeholder
                durationFormatted: '3:45',
                fileSize: stat.size,
                artworkUrl: (ext === '.mp3' ? (extractId3Artwork(fullPath) || '') : '') || (this.ledger.find(function(l) { return l.filePath === fullPath; })?.artworkUrl || ''),
                filePath: fullPath,
                ext,
                mimeType: ext === '.mp4' || ext === '.mkv' ? 'video/mp4' : 'audio/mpeg',
                modifiedAt: stat.mtimeMs,
                source: 'Local Storage'
              });
            }
          }
        }
      } catch (err) {}
    };

    for (const d of directories) {
      walk(d);
    }

    // Prune non-existent files first
    this.songs = this.songs.filter(s => s.filePath && fs.existsSync(s.filePath));

    // Merge discovered files
    const existingMap = new Map(this.songs.map(s => [s.filePath, s]));
    for (const song of discovered) {
      if (!existingMap.has(song.filePath)) {
        this.songs.push(song);
      } else {
        const existing = existingMap.get(song.filePath);
        if (!existing.artworkUrl && song.artworkUrl) {
          existing.artworkUrl = song.artworkUrl;
        }
      }
    }

    this.saveLibrary();
    return this.songs;
  }

  // --- Duplicate Detection (matching Android findDuplicateSongIds) ---
  findDuplicates() {
    const duplicates = [];
    const seen = new Map();

    for (const song of this.songs) {
      let clean = song.title.toLowerCase().trim();
      if (clean.includes(' - ')) {
        const parts = clean.split(' - ');
        if (parts.length >= 2) clean = parts[1].trim();
      }
      const key = clean.replace(/[^a-z0-9]/g, '');
      if (key.length < 3) continue;

      if (seen.has(key)) {
        const match = seen.get(key);
        duplicates.push({
          original: match,
          duplicate: song,
          reclaimableBytes: song.fileSize
        });
      } else {
        seen.set(key, song);
      }
    }

    return duplicates;
  }

  // --- Bookkeeping & Ledger ---
  recordDownloadTransaction(item) {
    const entry = {
      id: item.id || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString(),
      title: item.title,
      artist: item.artist || 'Unknown',
      platform: item.platform || 'Direct',
      formatType: item.formatType || 'AUDIO',
      quality: item.qualityLabel || 'High',
      fileSize: item.fileSize || item.downloadedBytes || 0,
      filePath: item.filePath || item.destinationPath || '',
      artworkUrl: item.artworkUrl || '',
      status: item.status || 'COMPLETED',
      speedAvg: item.speedBytesPerSec || 0
    };

    this.ledger.unshift(entry);
    this.saveLedger();
    return entry;
  }

  getBookkeepingStats() {
    let totalBytesDownloaded = 0;
    let completedCount = 0;
    let failedCount = 0;
    const formatBreakdown = {};
    const platformBreakdown = {};

    for (const entry of this.ledger) {
      totalBytesDownloaded += entry.fileSize || 0;
      if (entry.status === 'COMPLETED') completedCount++;
      else if (entry.status === 'ERROR') failedCount++;

      const fmt = (entry.formatType || 'AUDIO').toUpperCase();
      formatBreakdown[fmt] = (formatBreakdown[fmt] || 0) + (entry.fileSize || 0);

      const plat = (entry.platform || 'Direct').toUpperCase();
      platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;
    }

    const duplicates = this.findDuplicates();
    const reclaimableBytes = duplicates.reduce((acc, d) => acc + (d.reclaimableBytes || 0), 0);

    return {
      totalTransactions: this.ledger.length,
      completedCount,
      failedCount,
      totalBytesDownloaded,
      formatBreakdown,
      platformBreakdown,
      duplicateCount: duplicates.length,
      reclaimableBytes
    };
  }

  exportLedgerCsv() {
    const headers = ['ID', 'Date', 'Title', 'Artist', 'Platform', 'Format', 'Quality', 'Bytes', 'File Path', 'Status'];
    const rows = this.ledger.map(e => [
      `"${e.id}"`,
      `"${e.dateFormatted}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.artist || '').replace(/"/g, '""')}"`,
      `"${e.platform || ''}"`,
      `"${e.formatType || ''}"`,
      `"${e.quality || ''}"`,
      e.fileSize || 0,
      `"${(e.filePath || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // --- Bookmarks / Saved links queue ---
  addBookmark(bookmark) {
    const item = {
      id: `BM-${Date.now()}`,
      url: bookmark.url,
      title: bookmark.title || bookmark.url,
      platform: bookmark.platform || 'Auto',
      addedAt: Date.now()
    };
    this.bookmarks.unshift(item);
    this.saveBookmarks();
    return item;
  }

  removeBookmark(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.saveBookmarks();
    return this.bookmarks;
  }

  // --- Playlists ---
  createPlaylist(title) {
    const plDir = this.getPlaylistsDir();
    const folderPath = path.join(plDir, title);
    if (!fs.existsSync(folderPath)) {
      try { fs.mkdirSync(folderPath, { recursive: true }); } catch(e) {}
    }
    const pl = {
      id: 'pl-' + Buffer.from(title).toString('base64').replace(/=/g, ''),
      name: title,
      title,
      folderPath,
      tracks: [],
      trackCount: 0,
      createdAt: Date.now()
    };
    this.playlists = this.playlists.filter(p => p.name !== title && p.title !== title);
    this.playlists.push(pl);
    this.savePlaylists();
    return pl;
  }

  addToPlaylist(playlistId, trackOrPath) {
    const pl = this.playlists.find(p => p.id === playlistId || p.name === playlistId);
    if (pl) {
      let srcPath = typeof trackOrPath === 'string' ? trackOrPath : (trackOrPath.filePath || trackOrPath.id);
      if (srcPath && fs.existsSync(srcPath) && pl.folderPath && fs.existsSync(pl.folderPath)) {
        try {
          const dest = path.join(pl.folderPath, path.basename(srcPath));
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(srcPath, dest);
          }
          if (!pl.tracks) pl.tracks = [];
          if (!pl.tracks.includes(dest)) pl.tracks.push(dest);
          pl.trackCount = pl.tracks.length;
          this.savePlaylists();
        } catch(e) {}
      }
    }
    return this.playlists;
  }

  removeFromPlaylist(playlistId, songId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (pl) {
      pl.songIds = pl.songIds.filter(id => id !== songId);
      this.savePlaylists();
    }
    return this.playlists;
  }

  deletePlaylist(playlistId) {
    const pl = this.playlists.find(p => p.id === playlistId || p.name === playlistId);
    if (pl && pl.folderPath && fs.existsSync(pl.folderPath)) {
      try { fs.rmSync(pl.folderPath, { recursive: true, force: true }); } catch(e) {}
    }
    this.playlists = this.playlists.filter(p => p.id !== playlistId && p.name !== playlistId);
    this.savePlaylists();
    return this.playlists;
  }

  // --- Song metadata edit ---
  updateSongMetadata(songId, updates) {
    const song = this.songs.find(s => s.id === songId);
    if (song) {
      Object.assign(song, updates);
      this.saveLibrary();
    }
    return song;
  }

  removeSong(songId, filePath) {
    const beforeCount = this.songs.length;
    this.songs = this.songs.filter(s => {
      if (songId && s.id === songId) return false;
      if (filePath && s.filePath === filePath) return false;
      return true;
    });
    if (this.songs.length !== beforeCount) {
      this.saveLibrary();
    }
    return this.songs;
  }

  pruneMissingFiles() {
    const beforeCount = this.songs.length;
    this.songs = this.songs.filter(s => s.filePath && fs.existsSync(s.filePath));
    if (this.songs.length !== beforeCount) {
      this.saveLibrary();
    }
    return this.songs;
  }
}

module.exports = LibraryManager;
