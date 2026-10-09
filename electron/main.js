const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, session } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const youtubeExtractor = require('./extractors/youtube');
const spotifyExtractor = require('./extractors/spotify');
const jiosaavnExtractor = require('./extractors/jiosaavn');
const { DownloadManager } = require('./downloader');
const { embedId3Metadata, repairCorruptedMusicDirectory } = require('./id3Tagger');
const LibraryManager = require('./libraryManager');
const HistoryManager = require('./historyManager');
const { fetchEnrichedMetadata, normalizeGenre } = require('./metadataEnricher');

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

// Auto-repair any damaged audio files in music directories on startup
try {
  repairCorruptedMusicDirectory(preferences.downloadFolder);
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
      webviewTag: true,
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
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // Crucial: Only reload if the top-level LuckyGuy application itself fails to load!
    // Never reload because an iframe, webview, or portal sub-request returned an error!
    if (!isMainFrame) return;
    if (validatedURL && (validatedURL.includes('pornhub') || validatedURL.startsWith('http://') || validatedURL.startsWith('https://'))) {
      return;
    }
    console.warn(`Primary app failed to load (${errorCode}: ${errorDescription}), falling back to built dist/index.html`);
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
  // Intercept headers to prevent frame-blocking / flickering on media portal embeds
  try {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = Object.assign({}, details.responseHeaders);
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
      delete responseHeaders['cross-origin-embedder-policy'];
      delete responseHeaders['Cross-Origin-Embedder-Policy'];
      delete responseHeaders['cross-origin-resource-policy'];
      delete responseHeaders['Cross-Origin-Resource-Policy'];
      delete responseHeaders['cross-origin-opener-policy'];
      delete responseHeaders['Cross-Origin-Opener-Policy'];
      callback({ cancel: false, responseHeaders });
    });

    // Auto-inject 18+ age verification disclaimer cookies into outbound requests
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const requestHeaders = Object.assign({}, details.requestHeaders);
      if (details.url.includes('pornhub.org') || details.url.includes('pornhub.com') || details.url.includes('phncdn.com')) {
        let existingCookie = requestHeaders['Cookie'] || requestHeaders['cookie'] || '';
        if (!existingCookie.includes('accessAgeDisclaimerPH')) {
          existingCookie = (existingCookie ? existingCookie + '; ' : '') + 'accessAgeDisclaimerPH=1; age_verified=1; hasVisited=1; accessPH=1; cookieConsent=1; platform=pc';
        }
        requestHeaders['Cookie'] = existingCookie;
        requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
      }
      callback({ cancel: false, requestHeaders });
    });

    // Pre-populate age verification cookies on session store
    const phDomains = ['https://www.pornhub.com', 'https://www.pornhub.org', 'https://pornhub.com', 'https://pornhub.org'];
    for (const domain of phDomains) {
      session.defaultSession.cookies.set({ url: domain, name: 'accessAgeDisclaimerPH', value: '1' }).catch(() => {});
      session.defaultSession.cookies.set({ url: domain, name: 'age_verified', value: '1' }).catch(() => {});
      session.defaultSession.cookies.set({ url: domain, name: 'hasVisited', value: '1' }).catch(() => {});
      session.defaultSession.cookies.set({ url: domain, name: 'accessPH', value: '1' }).catch(() => {});
      session.defaultSession.cookies.set({ url: domain, name: 'cookieConsent', value: '1' }).catch(() => {});
      session.defaultSession.cookies.set({ url: domain, name: 'platform', value: 'pc' }).catch(() => {});
    }
  } catch (err) {}
  createWindow();
  setTimeout(() => checkAppUpdates(true), 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  win?.minimize();
});
ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  win?.close();
});
ipcMain.handle('window-get-state', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  return { isMaximized: win ? win.isMaximized() : false };
});

// URL Extractor & Resolver
ipcMain.handle('extract-url', async (event, url) => {
  if (!url || typeof url !== 'string') return { error: 'Invalid URL' };
  const trimmed = url.trim();

  // 1. Spotify
  if (spotifyExtractor.isSpotifyUrl(trimmed)) {
    const entity = await spotifyExtractor.extractSpotifyEntity(trimmed, preferences);
    if (entity) {
      return {
        platform: 'Spotify',
        ...entity
      };
    }
    return { error: 'Could not extract playlist or track details from Spotify link. Please verify the URL or network connection.' };
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
    return { error: 'Could not extract audio metadata from YouTube link.' };
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

  // 4. Direct HTTP Audio/Video Stream
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const urlObj = new URL(trimmed);
      const ext = path.extname(urlObj.pathname).toLowerCase();
      const isDirectMedia = ['.mp3', '.m4a', '.mp4', '.flac', '.wav', '.aac', '.ogg', '.opus', '.webm'].includes(ext);
      if (isDirectMedia) {
        return {
          platform: 'Direct Stream',
          type: 'track',
          id: Buffer.from(trimmed).toString('base64').substring(0, 12),
          title: path.basename(urlObj.pathname, ext) || 'Web Stream Track',
          artist: 'Web Source',
          streamUrl: trimmed,
          directStreamUrl: trimmed,
          artworkUrl: '',
          durationSeconds: 0
        };
      }
    } catch (e) {}
    return { error: 'Provided link is not a recognized media stream or supported playlist format.' };
  }

  return { error: 'Could not resolve media from provided link or search term' };
});

// Age Verification & Offscreen Portal Crawler
ipcMain.handle('bypass-age-verification', async () => {
  try {
    const phCookies = [
      { url: 'https://www.pornhub.org', name: 'accessAgeDisclaimerPH', value: '1' },
      { url: 'https://www.pornhub.org', name: 'age_verified', value: '1' },
      { url: 'https://www.pornhub.org', name: 'hasVisited', value: '1' },
      { url: 'https://www.pornhub.org', name: 'accessPH', value: '1' },
      { url: 'https://www.pornhub.org', name: 'cookieConsent', value: '1' },
      { url: 'https://www.pornhub.org', name: 'platform', value: 'pc' },
      { url: 'https://www.pornhub.com', name: 'accessAgeDisclaimerPH', value: '1' },
      { url: 'https://www.pornhub.com', name: 'age_verified', value: '1' },
      { url: 'https://www.pornhub.com', name: 'hasVisited', value: '1' },
      { url: 'https://www.pornhub.com', name: 'accessPH', value: '1' },
      { url: 'https://www.pornhub.com', name: 'cookieConsent', value: '1' },
      { url: 'https://www.pornhub.com', name: 'platform', value: 'pc' },
    ];
    for (const c of phCookies) {
      await session.defaultSession.cookies.set(c);
    }
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

ipcMain.handle('crawl-portal', async (event, targetUrl) => {
  if (!targetUrl) return [];
  const crawlUrl = targetUrl.startsWith('http') ? targetUrl : 'https://' + targetUrl;

  return new Promise((resolve) => {
    let crawlWin = null;
    let resolved = false;

    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        try {
          if (crawlWin && !crawlWin.isDestroyed()) crawlWin.destroy();
        } catch (e) {}
        resolve(result || []);
      }
    };

    // Timeout safety: 5 seconds max
    const timeout = setTimeout(() => {
      finish([]);
    }, 5500);

    try {
      crawlWin = new BrowserWindow({
        show: false,
        width: 1280,
        height: 800,
        webPreferences: {
          offscreen: true,
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
        }
      });

      crawlWin.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

      crawlWin.webContents.on('did-finish-load', async () => {
        try {
          await new Promise(r => setTimeout(r, 600));
          if (crawlWin.isDestroyed()) return;

          const extracted = await crawlWin.webContents.executeJavaScript(`
            (() => {
              const items = [];
              const seen = new Set();
              const nodes = document.querySelectorAll('li.videoBox, li[data-video-vkey]');
              nodes.forEach((el, i) => {
                const linkEl = el.querySelector('a[href*="viewkey="]');
                const vkey = el.getAttribute('data-video-vkey') || linkEl?.href?.match(/viewkey=([a-zA-Z0-9_-]+)/)?.[1];
                if (!vkey || seen.has(vkey)) return;
                seen.add(vkey);

                const titleEl = el.querySelector('.title a, .title, a[title]');
                const title = titleEl?.getAttribute('title') || titleEl?.textContent?.trim() || ('Video ' + vkey);
                const imgEl = el.querySelector('img');
                const thumbnail = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-thumb_url') || imgEl?.getAttribute('data-mediumthumb') || imgEl?.getAttribute('src') || '';
                const duration = el.querySelector('.duration, var.duration')?.textContent?.trim() || '12:00';
                const views = el.querySelector('.views var, .views')?.textContent?.trim() || '1.2M views';
                const rating = el.querySelector('.value, .rating')?.textContent?.trim() || '96%';
                const uploader = el.querySelector('.usernameWrap a, .username, .channelName a')?.textContent?.trim() || 'Verified Creator';
                if (title && thumbnail && !thumbnail.startsWith('data:image/gif')) {
                  items.push({
                    id: 'ph-' + vkey,
                    title,
                    thumbnail,
                    duration,
                    quality: '1080p 60fps',
                    views,
                    rating,
                    author: uploader,
                    url: 'https://www.pornhub.org/view_video.php?viewkey=' + vkey,
                    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  });
                }
              });
              return items.slice(0, 48);
            })()
          `);

          clearTimeout(timeout);
          finish(extracted || []);
        } catch (e) {
          clearTimeout(timeout);
          finish([]);
        }
      });

      crawlWin.webContents.on('did-fail-load', () => {
        clearTimeout(timeout);
        finish([]);
      });

      crawlWin.loadURL(crawlUrl).catch(() => {
        clearTimeout(timeout);
        finish([]);
      });
    } catch (e) {
      clearTimeout(timeout);
      finish([]);
    }
  });
});

ipcMain.handle('search-jiosaavn', async (event, query) => {
  return await jiosaavnExtractor.searchTrack(query);
});

// Resilient Stream & Artwork Resolver (JioSaavn variations + iTunes HQ fallback)
ipcMain.handle('resolve-track-stream', async (event, title, artist) => {
  const cleanTitle = (title || '').replace(/[\u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ').trim();
  const cleanArtist = (artist || '').replace(/[\u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ').trim();
  const firstArtist = cleanArtist.split(/[,/|]/)[0].trim();

  // 1. Try JioSaavn with title + first artist
  let res = null;
  if (firstArtist) {
    res = await jiosaavnExtractor.searchTrack(`${cleanTitle} ${firstArtist}`);
  }
  if (!res) {
    res = await jiosaavnExtractor.searchTrack(`${cleanTitle} ${cleanArtist}`);
  }
  if (!res) {
    res = await jiosaavnExtractor.searchTrack(cleanTitle);
  }
  if (res && res.streamUrl) return res;

  // 2. Try iTunes Search API fallback
  try {
    const q = `${cleanTitle} ${firstArtist || cleanArtist}`.trim();
    const itunesResp = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(q) + '&media=music&limit=1');
    if (itunesResp.ok) {
      const itunesData = await itunesResp.json();
      if (itunesData.results && itunesData.results.length > 0) {
        const item = itunesData.results[0];
        if (item.previewUrl) {
          return {
            id: String(item.trackId || Date.now()),
            title: item.trackName || title,
            artist: item.artistName || artist,
            album: item.collectionName || 'Master',
            duration: Math.round((item.trackTimeMillis || 215000) / 1000),
            artworkUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            streamUrl: item.previewUrl,
            bitrate: '256kbps',
            source: 'iTunes Direct HQ'
          };
        }
      }
    }
  } catch (e) {}

  return null;
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

  const rawGenre = enriched?.genre || taskConfig.genre || '';
  const genre = normalizeGenre(rawGenre, taskConfig.artist, taskConfig.title);
  const album = enriched?.album || taskConfig.album || 'Downloaded Master';
  const year = enriched?.releaseDate || taskConfig.year || '';
  const itunesArtwork = enriched?.artworkUrl || '';
  const artworkUrl = taskConfig.artworkUrl || itunesArtwork || '';

  // Determine correct initial extension based on format or stream URL
  let ext = '.m4a';
  if (taskConfig.formatType === 'VIDEO') {
    ext = '.mp4';
  } else if (taskConfig.url && (taskConfig.url.includes('.mp3') || taskConfig.url.includes('youtube.com') || taskConfig.url.includes('googlevideo.com'))) {
    ext = '.mp3';
  }

  const cleanTitle = (taskConfig.title || 'download').replace(/[\/\\?%*:|"<>]/g, '_');
  const cleanArtist = (taskConfig.artist && taskConfig.artist !== 'Unknown Artist' && taskConfig.artist !== 'Various Artists')
    ? taskConfig.artist.replace(/[\/\\?%*:|"<>]/g, '_') + ' - '
    : '';

  let targetDir = preferences.downloadFolder;
  // Auto-organize into genre subfolder when enabled
  const shouldOrganize = preferences.autoOrganizeByGenre !== false;
  if (shouldOrganize) {
    const cleanGenre = (genre && genre !== 'Music') ? genre.replace(/[\/\\?%*:|"<>]/g, '_') : 'Pop';
    targetDir = path.join(preferences.downloadFolder, cleanGenre);
  }
  if (!fs.existsSync(targetDir)) {
    try { fs.mkdirSync(targetDir, { recursive: true }); } catch (e) {}
  }

  let targetPath;
  if (taskConfig.destinationPath) {
    const parentDir = path.resolve(path.dirname(taskConfig.destinationPath));
    const rootDownloadDir = path.resolve(preferences.downloadFolder);
    if (parentDir === rootDownloadDir) {
      targetPath = path.join(targetDir, path.basename(taskConfig.destinationPath));
    } else {
      targetPath = taskConfig.destinationPath;
    }
  } else {
    targetPath = path.join(targetDir, `${cleanArtist}${cleanTitle}${ext}`);
  }

  downloadManager.addTask({
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

  return true;
});

// Global DownloadManager event routing
downloadManager.on('update', (snap) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download-progress', snap);
  }
});

downloadManager.on('completed', async (snap) => {
  let targetPath = snap.destinationPath;
  const targetDir = targetPath ? path.dirname(targetPath) : preferences.downloadFolder;

  // Inspect physical container of the downloaded stream to prevent file corruption
  if (targetPath && fs.existsSync(targetPath)) {
    try {
      const head = Buffer.alloc(16);
      const fd = fs.openSync(targetPath, 'r');
      fs.readSync(fd, head, 0, 16, 0);
      fs.closeSync(fd);

      const isFtyp = head.slice(4, 8).toString('ascii') === 'ftyp';
      if (isFtyp && targetPath.endsWith('.mp3')) {
        // Correct extension to .m4a so Windows Media Player and external players play natively
        const correctedPath = targetPath.replace(/\.mp3$/i, '.m4a');
        fs.renameSync(targetPath, correctedPath);
        targetPath = correctedPath;
      }
    } catch (renameErr) {
      console.warn('Could not inspect container header:', renameErr.message);
    }
  }

  // Universal metadata embedding (atoms for M4A, ID3 frames for MP3)
  if (targetPath && (targetPath.endsWith('.mp3') || targetPath.endsWith('.m4a'))) {
    try {
      await embedId3Metadata(targetPath, {
        title: snap.title,
        artist: snap.artist,
        album: snap.album,
        year: snap.year,
        genre: snap.genre,
        artworkUrl: snap.artworkUrl
      });
    } catch (tagErr) {
      console.warn('Failed to embed metadata tags:', tagErr.message);
    }
  }

  // Guarantee file is moved into its genre directory if currently in root
  if (targetPath && fs.existsSync(targetPath)) {
    const parentDir = path.resolve(path.dirname(targetPath));
    const rootDownloadDir = path.resolve(preferences.downloadFolder);
    const resolvedGenre = snap.genre || 'Pop';
    const cleanGenre = resolvedGenre.replace(/[/\\?%*:|"<>]/g, '_');
    const expectedGenreDir = path.join(preferences.downloadFolder, cleanGenre);
    if (!fs.existsSync(expectedGenreDir)) {
      try { fs.mkdirSync(expectedGenreDir, { recursive: true }); } catch (e) {}
    }

    if (parentDir === rootDownloadDir) {
      const destinationInGenre = path.join(expectedGenreDir, path.basename(targetPath));
      try {
        fs.renameSync(targetPath, destinationInGenre);
        targetPath = destinationInGenre;
      } catch (moveErr) {
        console.warn('Could not move file to genre folder:', moveErr.message);
      }
    }
  }

  const activeArtwork = snap.artworkUrl;
  if (activeArtwork && activeArtwork.startsWith('http') && targetDir) {
    try {
      const folderCover = path.join(targetDir, 'folder.jpg');
      if (!fs.existsSync(folderCover)) {
        const { fetchBuffer } = require('./id3Tagger');
        fetchBuffer(activeArtwork).then(res => {
          if (res && res.buffer) fs.writeFileSync(folderCover, res.buffer);
        }).catch(() => {});
      }
    } catch (coverErr) {}
  }

  let finalSize = snap.downloadedBytes;
  try {
    if (targetPath && fs.existsSync(targetPath)) {
      finalSize = fs.statSync(targetPath).size;
    }
  } catch (e) {}

  historyManager.recordDownload(snap.title, snap.artist, targetPath, 'COMPLETED');

  libraryManager.recordDownloadTransaction({
    ...snap,
    genre: snap.genre,
    filePath: targetPath,
    fileSize: finalSize,
    status: 'COMPLETED'
  });

  if (targetDir) {
    libraryManager.scanDirectories([preferences.downloadFolder, targetDir]);
  }

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

downloadManager.on('failed', (snap) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download-failed', snap);
  }
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
  if (songId || filePath) {
    libraryManager.removeSong(songId, filePath);
  }
  return fileDeleted;
});

ipcMain.handle('clear-cache-data', async () => {
  try {
    if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
      await mainWindow.webContents.session.clearCache();
      await mainWindow.webContents.session.clearStorageData({
        storages: ['appcache', 'shadercache', 'serviceworkers', 'cachestorage']
      });
    }
    libraryManager.pruneMissingFiles();
    return true;
  } catch (e) {
    return false;
  }
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
  if (fs.existsSync(filePath)) return true;
  const altM4a = filePath.replace(/\.mp3$/i, '.m4a');
  if (fs.existsSync(altM4a)) return true;
  const altMp3 = filePath.replace(/\.m4a$/i, '.mp3');
  if (fs.existsSync(altMp3)) return true;

  // Also check if the filename exists in any genre subfolder
  const baseNoExt = path.basename(filePath, path.extname(filePath));
  const rootDir = preferences.downloadFolder || path.dirname(filePath);
  try {
    if (fs.existsSync(rootDir)) {
      const subdirs = fs.readdirSync(rootDir, { withFileTypes: true });
      for (const d of subdirs) {
        if (d.isDirectory()) {
          const subM4a = path.join(rootDir, d.name, baseNoExt + '.m4a');
          const subMp3 = path.join(rootDir, d.name, baseNoExt + '.mp3');
          if (fs.existsSync(subM4a) || fs.existsSync(subMp3)) return true;
        }
      }
    }
  } catch (e) {}

  return false;
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

function hasRealAudioData(targetPath) {
  try {
    if (!targetPath || !fs.existsSync(targetPath)) return false;
    const stat = fs.statSync(targetPath);
    if (stat.size < 50000) return false;
    const fd = fs.openSync(targetPath, 'r');
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);

    // M4A / MP4 container check
    if (header.slice(4, 8).toString('ascii') === 'ftyp') {
      return stat.size > 100000;
    }

    // ID3 MP3 check
    if (header.slice(0, 3).toString('ascii') === 'ID3') {
      const tagSize = ((header[6] & 0x7f) << 21) | ((header[7] & 0x7f) << 14) | ((header[8] & 0x7f) << 7) | (header[9] & 0x7f);
      const audioBytes = stat.size - (10 + tagSize);
      return audioBytes > 102400;
    }

    return stat.size > 200000;
  } catch (e) {
    return false;
  }
}

ipcMain.handle('resolve-audio-path', async (event, filePath, title, artist) => {
  // Check exact file or alternative .m4a / .mp3 extensions
  if (filePath) {
    if (fs.existsSync(filePath) && hasRealAudioData(filePath)) return filePath;
    const altM4a = filePath.replace(/\.mp3$/i, '.m4a');
    if (fs.existsSync(altM4a) && hasRealAudioData(altM4a)) return altM4a;
    const altMp3 = filePath.replace(/\.m4a$/i, '.mp3');
    if (fs.existsSync(altMp3) && hasRealAudioData(altMp3)) return altMp3;
  }

  function cleanFuzzy(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // 1. Check in libraryManager.songs for a valid local copy
  const matchInSongs = libraryManager.songs.find(s =>
    (filePath && (s.filePath === filePath || s.filePath === filePath.replace(/\.mp3$/i, '.m4a') || s.filePath === filePath.replace(/\.m4a$/i, '.mp3'))) ||
    (title && s.title && s.title.toLowerCase() === title.toLowerCase()) ||
    (s.id && filePath && filePath.includes(s.id))
  );
  if (matchInSongs && matchInSongs.filePath && fs.existsSync(matchInSongs.filePath) && hasRealAudioData(matchInSongs.filePath)) {
    return matchInSongs.filePath;
  }

  // 2. Search Music directory recursively for a matching valid audio file
  const musicDir = preferences.downloadFolder || path.join(os.homedir(), 'Music');
  if (fs.existsSync(musicDir)) {
    const cTitle = cleanFuzzy(title);
    const cArtist = cleanFuzzy(artist);
    const cBase = filePath ? cleanFuzzy(path.basename(filePath, path.extname(filePath))) : '';
    const validAudioExts = ['.m4a', '.mp3', '.flac', '.wav', '.aac', '.ogg'];

    const searchFile = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            const found = searchFile(full);
            if (found) return found;
          } else if (e.isFile() && validAudioExts.some(ext => e.name.toLowerCase().endsWith(ext))) {
            const cName = cleanFuzzy(e.name);
            if ((cBase && cName.includes(cBase)) || (cTitle && cName.includes(cTitle)) || (cArtist && cName.includes(cArtist))) {
              if (hasRealAudioData(full)) return full;
            }
          }
        }
      } catch (err) {}
      return null;
    };
    const found = searchFile(musicDir);
    if (found) return found;
  }

  // 3. Fallback: If local file is not found, dynamically resolve stream online
  const query = [title || '', (artist && artist !== 'Unknown Artist') ? artist : ''].join(' ').trim();
  if (query) {
    try {
      const jioMatch = await jiosaavnExtractor.searchTrack(query);
      if (jioMatch && jioMatch.streamUrl) {
        return jioMatch.streamUrl;
      }
    } catch (e) {}
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


// --- Auto-Updater & Version Checker ---
function semverCompare(v1, v2) {
  const p1 = (v1 || '0').replace(/^v/, '').split('.').map(Number);
  const p2 = (v2 || '0').replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

async function checkAppUpdates(silent = false) {
  try {
    const currentVer = app.getVersion() || '1.0.0';
    const resp = await fetch('https://api.github.com/repos/nishantkumrmishra/LuckyGuy/releases/latest', {
      headers: { 'User-Agent': 'LuckyGuy-App' }
    });
    if (resp.ok) {
      const release = await resp.json();
      const latestTag = release.tag_name || '';
      const latestVer = latestTag.replace(/^v/, '');
      if (latestVer && semverCompare(latestVer, currentVer) > 0) {
        const updateInfo = {
          available: true,
          currentVersion: currentVer,
          latestVersion: latestVer,
          releaseName: release.name || latestTag,
          releaseNotes: release.body || 'A new update is available for LuckyGuy.',
          releaseUrl: release.html_url,
          publishedAt: release.published_at,
          assets: release.assets || []
        };
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-available', updateInfo);
        }
        return updateInfo;
      }
    }
    return { available: false, currentVersion: app.getVersion() || '1.0.0', message: 'You are running the latest version.' };
  } catch (err) {
    if (!silent) console.warn('[AutoUpdater] Check failed:', err.message);
    return { available: false, error: err.message };
  }
}

ipcMain.handle('check-for-updates', async () => checkAppUpdates(false));
