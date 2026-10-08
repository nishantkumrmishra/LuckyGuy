const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const youtubeExtractor = require('./extractors/youtube');
const spotifyExtractor = require('./extractors/spotify');
const jiosaavnExtractor = require('./extractors/jiosaavn');
const { DownloadManager } = require('./downloader');
const { embedId3Metadata } = require('./id3Tagger');
const LibraryManager = require('./libraryManager');
const HistoryManager = require('./historyManager');
const { fetchEnrichedMetadata } = require('./metadataEnricher');

let mainWindow = null;
const userDataDir = path.join(app.getPath('userData'), 'LocalGuy');
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

// Preferences
const prefsFile = path.join(userDataDir, 'preferences.json');
let preferences = {
  defaultFormat: 'AUDIO', // 'AUDIO' or 'VIDEO'
  defaultAudioQuality: '320kbps',
  defaultVideoQuality: '1080p',
  chunkCount: 8,
  downloadFolder: path.join(os.homedir(), 'Music'),
  askBeforeDownload: false,
  plugins: {
    youtube: true,
    spotify: true,
    jiosaavn: true,
    soundcloud: true,
    instagram: false,
    tiktok: false
  }
};

try {
  if (fs.existsSync(prefsFile)) {
    preferences = { ...preferences, ...JSON.parse(fs.readFileSync(prefsFile, 'utf8')) };
  } else {
    fs.writeFileSync(prefsFile, JSON.stringify(preferences, null, 2));
  }
} catch (e) {}

// Managers
const libraryManager = new LibraryManager(userDataDir);
const downloadManager = new DownloadManager();
const historyManager = new HistoryManager(userDataDir);

// Auto-scan default music directories on startup if empty
if (libraryManager.songs.length === 0) {
  const defaultMusicDirs = [
    path.join(os.homedir(), 'Music'),
    preferences.downloadFolder
  ];
  libraryManager.scanDirectories(defaultMusicDirs);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 780,
    minWidth: 920,
    minHeight: 600,
    backgroundColor: '#ffffff', title: 'LuckyGuy',
    icon: path.join(__dirname, 'icon.png'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow streaming local audio files
    }
  });

  // In production load built dist/index.html, in development load Vite dev server
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// URL Extractor & Resolver
ipcMain.handle('extract-url', async (event, url) => {
  if (!url || typeof url !== 'string') return { error: 'Invalid URL' };
  const trimmed = url.trim();

  // 1. Spotify
  if (spotifyExtractor.isSpotifyUrl(trimmed)) {
    const entity = await spotifyExtractor.extractSpotifyEntity(trimmed);
    if (entity) {
      return {
        platform: 'Spotify',
        ...entity
      };
    }
  }

  // 2. YouTube
  const ytVideoId = youtubeExtractor.extractVideoId(trimmed);
  if (ytVideoId) {
    const meta = await youtubeExtractor.fetchVideoMetadata(ytVideoId);
    if (meta) {
      return {
        platform: 'YouTube',
        type: 'track',
        ...meta
      };
    }
  }

  // 3. Direct Audio Search / JioSaavn
  const jioResult = await jiosaavnExtractor.searchTrack(trimmed);
  if (jioResult) {
    return {
      platform: 'JioSaavn',
      type: 'track',
      ...jioResult
    };
  }

  // 4. Direct HTTP URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const ext = path.extname(new URL(trimmed).pathname) || '.mp3';
    return {
      platform: 'Direct Stream',
      type: 'track',
      id: Buffer.from(trimmed).toString('base64').substring(0, 12),
      title: path.basename(new URL(trimmed).pathname, ext) || 'Web Stream Track',
      artist: 'Web Source',
      streamUrl: trimmed,
      directStreamUrl: trimmed,
      artworkUrl: '',
      durationSeconds: 0
    };
  }

  return { error: 'Could not resolve media from provided link or search term' };
});

ipcMain.handle('search-jiosaavn', async (event, query) => {
  return await jiosaavnExtractor.searchTrack(query);
});

// Download Manager IPC
ipcMain.handle('download-start', async (event, taskConfig) => {
  // Check duplicate / existing in history or disk
  if (historyManager.isDownloaded(taskConfig.title, taskConfig.artist, taskConfig.destinationPath)) {
    return {
      ...taskConfig,
      status: 'SKIPPED_EXISTING',
      message: 'Track already downloaded in library (skipped to save battery & data)'
    };
  }

  // Enrich metadata via iTunes Search API
  let enriched = null;
  try {
    enriched = await fetchEnrichedMetadata(taskConfig.title, taskConfig.artist);
  } catch (e) {}

  const genre = enriched?.genre || taskConfig.genre || '';
  const album = enriched?.album || taskConfig.album || 'Downloaded Master';
  const year = enriched?.releaseDate || taskConfig.year || '';
  const itunesArtwork = enriched?.artworkUrl || '';
  const artworkUrl = taskConfig.artworkUrl || itunesArtwork || '';

  const ext = taskConfig.formatType === 'VIDEO' ? '.mp4' : '.mp3';
  const cleanTitle = (taskConfig.title || 'download').replace(/[\/\\?%*:|"<>]/g, '_');
  const cleanArtist = (taskConfig.artist && taskConfig.artist !== 'Unknown Artist' && taskConfig.artist !== 'Various Artists')
    ? taskConfig.artist.replace(/[\/\\?%*:|"<>]/g, '_') + ' - '
    : '';

  // Categorize by genre/category if available
  let targetDir = preferences.downloadFolder;
  if (genre && genre !== 'Music') {
    const cleanGenre = genre.replace(/[\/\\?%*:|"<>]/g, '_');
    targetDir = path.join(preferences.downloadFolder, cleanGenre);
  }
  if (!fs.existsSync(targetDir)) {
    try { fs.mkdirSync(targetDir, { recursive: true }); } catch (e) {}
  }

  const targetPath = taskConfig.destinationPath || path.join(targetDir, `${cleanArtist}${cleanTitle}${ext}`);

  const downloader = downloadManager.addTask({
    ...taskConfig,
    title: taskConfig.title,
    artist: taskConfig.artist,
    album,
    year,
    genre,
    artworkUrl,
    destinationPath: targetPath,
    chunkCount: preferences.chunkCount || 8
  });

  downloader.on('update', (snap) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-progress', snap);
    }
  });

  downloader.on('completed', async (snap) => {
    // Embed ID3 tags and artwork into audio file
    if (targetPath.endsWith('.mp3')) {
      try {
        await embedId3Metadata(targetPath, {
          title: taskConfig.title || snap.title,
          artist: taskConfig.artist || snap.artist,
          album: album || snap.album,
          year: year || snap.year,
          genre: genre || snap.genre,
          artworkUrl: artworkUrl || snap.artworkUrl
        });
      } catch (tagErr) {
        console.warn('Failed to embed ID3 tags into MP3:', tagErr.message);
      }
    }

    let finalSize = snap.downloadedBytes;
    try {
      if (fs.existsSync(targetPath)) {
        finalSize = fs.statSync(targetPath).size;
      }
    } catch (e) {}

    // Record into download history log in AppData/LocalGuy
    historyManager.recordDownload(taskConfig.title, taskConfig.artist, targetPath, 'COMPLETED');

    // Record into Bookkeeping ledger
    libraryManager.recordDownloadTransaction({
      ...snap,
      genre,
      filePath: targetPath,
      fileSize: finalSize,
      status: 'COMPLETED'
    });

    // Auto-index into local library
    libraryManager.scanDirectories([preferences.downloadFolder, targetDir]);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-progress', {
        ...snap,
        filePath: targetPath,
        fileSize: finalSize,
        status: 'COMPLETED'
      });
    }
  });

  return downloader.snapshot();
});

ipcMain.handle('download-pause', (e, id) => downloadManager.pauseTask(id));
ipcMain.handle('download-pause-all', () => { downloadManager.pauseAll(); return true; });
ipcMain.handle('download-resume-all', () => { downloadManager.resumeAll(); return true; });
ipcMain.handle('download-check-exists', (e, title, artist, targetPath) => historyManager.isDownloaded(title, artist, targetPath));
ipcMain.handle('download-resume', (e, id) => downloadManager.resumeTask(id));
ipcMain.handle('download-cancel', (e, id) => downloadManager.cancelTask(id));
ipcMain.handle('download-remove', (e, id) => downloadManager.removeTask(id));
ipcMain.handle('download-get-all', () => downloadManager.getAllTasks());

ipcMain.handle('delete-file-permanently', async (e, filePath, songId) => {
  let deletedFromDisk = false;
  if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      deletedFromDisk = true;
    } catch (err) {
      console.warn('Failed to delete file from disk:', err);
    }
  }
  libraryManager.removeSong(songId, filePath);
  return { success: true, deletedFromDisk, songs: libraryManager.songs };
});

ipcMain.handle('move-to-trash', async (e, filePath, songId) => {
  let movedToTrash = false;
  if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
    try {
      await shell.trashItem(filePath);
      movedToTrash = true;
    } catch (err) {
      console.warn('Failed to move to trash:', err);
    }
  }
  libraryManager.removeSong(songId, filePath);
  return { success: true, movedToTrash, songs: libraryManager.songs };
});

ipcMain.handle('open-in-folder', (e, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

// Library IPC
ipcMain.handle('verify-files-exist', (e, paths) => {
  if (!Array.isArray(paths)) return [];
  return paths.filter(p => p && typeof p === 'string' && fs.existsSync(p));
});

ipcMain.handle('check-file-exists', (e, filePath) => {
  return Boolean(filePath && typeof filePath === 'string' && fs.existsSync(filePath));
});

ipcMain.handle('library-get-songs', () => libraryManager.pruneMissingFiles());
ipcMain.handle('library-scan', (e, dirs) => {
  const targetDirs = dirs && dirs.length > 0 ? dirs : [
    path.join(os.homedir(), 'Music'),
    preferences.downloadFolder
  ];
  return libraryManager.scanDirectories(targetDirs);
});
ipcMain.handle('library-get-playlists', () => libraryManager.syncPlaylistsFromDisk());
ipcMain.handle('library-create-playlist', (e, title) => libraryManager.createPlaylist(title));
ipcMain.handle('library-add-to-playlist', (e, plId, songId) => libraryManager.addToPlaylist(plId, songId));
ipcMain.handle('library-remove-from-playlist', (e, plId, songId) => libraryManager.removeFromPlaylist(plId, songId));
ipcMain.handle('library-delete-playlist', (e, plId) => libraryManager.deletePlaylist(plId));
ipcMain.handle('library-update-song', (e, id, updates) => libraryManager.updateSongMetadata(id, updates));
ipcMain.handle('library-find-duplicates', () => libraryManager.findDuplicates());

// Settings IPC
ipcMain.handle('get-preferences', () => preferences);
ipcMain.handle('save-preferences', (e, newPrefs) => {
  preferences = { ...preferences, ...newPrefs };
  try {
    fs.writeFileSync(prefsFile, JSON.stringify(preferences, null, 2));
  } catch (e) {}
  return preferences;
});

ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Folder'
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    cpuCount: os.cpus().length
  };
});
