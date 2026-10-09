const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
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
    backgroundColor: '#0a0a0a',
    title: 'LuckyGuy',
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

  const indexPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      if (fs.existsSync(indexPath)) mainWindow.loadFile(indexPath);
    });
  } else {
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  // Handle reload failure safely
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`Page failed to load (${errorCode}: ${errorDescription}), falling back to built dist/index.html`);
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  });

  // Enable F12 to inspect console and debug anytime
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents?.send('window-state-changed', { isMaximized: true });
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents?.send('window-state-changed', { isMaximized: false });
  });

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
ipcMain.handle('window-get-state', () => {
  return { isMaximized: mainWindow ? mainWindow.isMaximized() : false };
});

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
  if (historyManager.isDownloaded(taskConfig.title, taskConfig.artist, taskConfig.destinationPath)) {
    return {
      ...taskConfig,
      status: 'SKIPPED_EXISTING',
      message: 'Track already downloaded in library (skipped to save battery & data)'
    };
  }

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

    historyManager.recordDownload(taskConfig.title, taskConfig.artist, targetPath, 'COMPLETED');

    libraryManager.recordDownloadTransaction({
      ...snap,
      genre,
      filePath: targetPath,
      fileSize: finalSize,
      status: 'COMPLETED'
    });

    libraryManager.scanDirectories([preferences.downloadFolder, targetDir]);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-progress', {
        ...snap,
        filePath: targetPath,
        fileSize: finalSize,
        status: 'COMPLETED'
      });
      mainWindow.webContents.send('download-completed', {
        ...snap,
        filePath: targetPath,
        fileSize: finalSize
      });
    }
  });

  downloader.on('failed', (snap) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-failed', snap);
    }
  });

  return downloader.start();
});

ipcMain.handle('download-pause', async (event, id) => downloadManager.pauseTask(id));
ipcMain.handle('download-pause-all', async () => downloadManager.pauseAll());
ipcMain.handle('download-resume-all', async () => downloadManager.resumeAll());
ipcMain.handle('download-check-exists', async (event, title, artist, targetPath) => {
  return historyManager.isDownloaded(title, artist, targetPath);
});
ipcMain.handle('download-resume', async (event, id) => downloadManager.resumeTask(id));
ipcMain.handle('download-cancel', async (event, id) => downloadManager.cancelTask(id));
ipcMain.handle('download-remove', async (event, id) => downloadManager.removeTask(id));
ipcMain.handle('download-get-all', async () => downloadManager.getAllTasks());

// File System IPC
ipcMain.handle('open-in-folder', async (event, filePath) => {
  if (!filePath) return false;
  try {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    } else {
      shell.openPath(path.dirname(filePath) || preferences.downloadFolder);
      return true;
    }
  } catch (e) {
    return false;
  }
});

ipcMain.handle('delete-file-permanently', async (event, filePath, songId) => {
  let fileDeleted = false;
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      fileDeleted = true;
    } catch (e) {
      console.warn('Failed to delete physical file:', e.message);
    }
  }
  if (songId) {
    libraryManager.deleteSong(songId);
  }
  return fileDeleted;
});

ipcMain.handle('verify-files-exist', async (event, filePaths) => {
  if (!Array.isArray(filePaths)) return {};
  const results = {};
  for (const fp of filePaths) {
    results[fp] = fs.existsSync(fp);
  }
  return results;
});

ipcMain.handle('check-file-exists', async (event, filePath) => {
  if (!filePath) return false;
  return fs.existsSync(filePath);
});

// Library Manager IPC
ipcMain.handle('library-get-songs', async () => libraryManager.songs);
ipcMain.handle('library-scan', async (event, dirs) => libraryManager.scanDirectories(dirs));
ipcMain.handle('library-get-playlists', async () => libraryManager.playlists);
ipcMain.handle('library-create-playlist', async (event, title, desc) => libraryManager.createPlaylist(title, desc));
ipcMain.handle('library-add-to-playlist', async (event, plId, songId) => libraryManager.addToPlaylist(plId, songId));
ipcMain.handle('library-remove-from-playlist', async (event, plId, songId) => libraryManager.removeFromPlaylist(plId, songId));
ipcMain.handle('library-delete-playlist', async (event, plId) => libraryManager.deletePlaylist(plId));
ipcMain.handle('library-update-song', async (event, songId, updates) => libraryManager.updateSong(songId, updates));
ipcMain.handle('library-find-duplicates', async () => libraryManager.findDuplicates());
ipcMain.handle('library-organize-fix', async (event, musicDir) => libraryManager.organizeAndFixLibrary(musicDir));
ipcMain.handle('resolve-audio-path', async (event, filePath, title, artist) => {
  if (filePath && fs.existsSync(filePath)) return filePath;

  function cleanFuzzy(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // 1. Check in libraryManager.songs
  const matchInSongs = libraryManager.songs.find(s => 
    (filePath && s.filePath === filePath) ||
    (title && s.title && s.title.toLowerCase() === title.toLowerCase()) ||
    (s.id && filePath && filePath.includes(s.id))
  );
  if (matchInSongs && matchInSongs.filePath && fs.existsSync(matchInSongs.filePath)) {
    return matchInSongs.filePath;
  }

  // 2. Search Music directory recursively
  const musicDir = preferences.downloadFolder || path.join(os.homedir(), 'Music');
  if (fs.existsSync(musicDir)) {
    const cTitle = cleanFuzzy(title);
    const cArtist = cleanFuzzy(artist);
    const cBase = filePath ? cleanFuzzy(path.basename(filePath, path.extname(filePath))) : '';

    const searchFile = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            const found = searchFile(full);
            if (found) return found;
          } else if (e.isFile() && e.name.toLowerCase().endsWith('.mp3')) {
            const cName = cleanFuzzy(e.name);
            if (cBase && cName.includes(cBase)) return full;
            if (cTitle && cName.includes(cTitle)) return full;
            if (cArtist && cName.includes(cArtist)) return full;
          }
        }
      } catch (err) {}
      return null;
    };
    const found = searchFile(musicDir);
    if (found) return found;
  }

  return filePath;
});

// Preferences IPC
ipcMain.handle('get-preferences', async () => preferences);
ipcMain.handle('save-preferences', async (event, newPrefs) => {
  preferences = { ...preferences, ...newPrefs };
  try {
    fs.writeFileSync(prefsFile, JSON.stringify(preferences, null, 2));
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('pick-folder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (!res.canceled && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-system-info', async () => ({
  platform: process.platform,
  arch: process.arch,
  homedir: os.homedir(),
  totalMemory: os.totalmem(),
  freeMemory: os.freemem()
}));
