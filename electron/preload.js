const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {\n  minimize: () => ipcRenderer.send('window-minimize'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  closeWindow: () => ipcRenderer.send('window-close'),
  getWindowState: () => ipcRenderer.invoke('window-get-state'),
  onWindowStateChanged: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('window-state-changed', handler);
    return () => ipcRenderer.removeListener('window-state-changed', handler);
  },

  extractUrl: (url) => ipcRenderer.invoke('extract-url', url),
  searchJioSaavn: (query) => ipcRenderer.invoke('search-jiosaavn', query),
  resolveTrackStream: (title, artist) => ipcRenderer.invoke('resolve-track-stream', title, artist),

  startDownload: (task) => ipcRenderer.invoke('download-start', task),
  pauseDownload: (id) => ipcRenderer.invoke('download-pause', id),
  pauseAllDownloads: () => ipcRenderer.invoke('download-pause-all'),
  resumeAllDownloads: () => ipcRenderer.invoke('download-resume-all'),
  checkAlreadyDownloaded: (title, artist, targetPath) => ipcRenderer.invoke('download-check-exists', title, artist, targetPath),
  resumeDownload: (id) => ipcRenderer.invoke('download-resume', id),
  cancelDownload: (id) => ipcRenderer.invoke('download-cancel', id),
  removeDownload: (id) => ipcRenderer.invoke('download-remove', id),
  getDownloadTasks: () => ipcRenderer.invoke('download-get-all'),

  // Event listeners with safe fallbacks
  onDownloadProgress: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onDownloadCompleted: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-completed', handler);
    return () => ipcRenderer.removeListener('download-completed', handler);
  },
  onDownloadFailed: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-failed', handler);
    return () => ipcRenderer.removeListener('download-failed', handler);
  },
  onDownloadUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },

  openInFolder: (filePath) => ipcRenderer.invoke('open-in-folder', filePath),
  deleteFilePermanently: (filePath, songId) => ipcRenderer.invoke('delete-file-permanently', filePath, songId),
  clearCacheData: () => ipcRenderer.invoke('clear-cache-data'),
  moveToTrash: (filePath, songId) => ipcRenderer.invoke('move-to-trash', filePath, songId),

  verifyFilesExist: (paths) => ipcRenderer.invoke('verify-files-exist', paths),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  getSongs: () => ipcRenderer.invoke('library-get-songs'),
  scanLocalMusic: (dirs) => ipcRenderer.invoke('library-scan', dirs),
  getPlaylists: () => ipcRenderer.invoke('library-get-playlists'),
  createPlaylist: (title) => ipcRenderer.invoke('library-create-playlist', title),
  addToPlaylist: (plId, songId) => ipcRenderer.invoke('library-add-to-playlist', plId, songId),
  removeFromPlaylist: (plId, songId) => ipcRenderer.invoke('library-remove-from-playlist', plId, songId),
  deletePlaylist: (plId) => ipcRenderer.invoke('library-delete-playlist', plId),
  updateSongMetadata: (songId, updates) => ipcRenderer.invoke('library-update-song', songId, updates),
  findDuplicates: () => ipcRenderer.invoke('library-find-duplicates'),
  organizeAndFixLibrary: (musicDir) => ipcRenderer.invoke('library-organize-fix', musicDir),
  resolveAudioPath: (filePath, title, artist) => ipcRenderer.invoke('resolve-audio-path', filePath, title, artist),

  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  savePreferences: (prefs) => ipcRenderer.invoke('save-preferences', prefs),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openDirectoryDialog: () => ipcRenderer.invoke('pick-folder'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateAvailable: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  }
});
