import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import HomeTab from './components/HomeTab';
import LibraryTab from './components/LibraryTab';
import DownloadsTab from './components/DownloadsTab';
import PluginTabContainer from './components/PluginTabContainer';
import TrashTab from './components/TrashTab';
import SettingsTab from './components/SettingsTab';
import LikedSongsTab from './components/LikedSongsTab';
import PlaylistsTab from './components/PlaylistsTab';
import SleepTimerModal from './components/SleepTimerModal';
import SetupWizard from './components/SetupWizard';
import QueueDrawer from './components/QueueDrawer';

export default function App() {
  const downloadCompletionMap = useRef(new Map()).current;
  const isQueueCancelledRef = useRef(false);
  const cancelledTaskIdsRef = useRef(new Set());
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('localguy-active-tab') || 'home';
    } catch {
      return 'home';
    }
  });
  const [settingsCategory, setSettingsCategory] = useState('downloads');

  // Dynamically load installed user/community extensions
  const [installedExtensions, setInstalledExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter plugins that declare their own dedicated tab in sidebar
  const pluginTabs = installedExtensions.filter((ext) => ext.enabled !== false && ext.tab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Library Songs: ONLY downloaded music or scanned files
  const [songs, setSongs] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-songs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((t) => t.title !== '4tHJc5agHg9LVsijAwtooy' && !/^[a-zA-Z0-9]{20,}$/.test(t.title) && !t.title.toLowerCase().includes('3 drags'));
      }
      return [];
    } catch {
      return [];
    }
  });

  // 2. Downloads: Active tasks + Completed downloads
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [completedDownloads, setCompletedDownloads] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-downloads');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((t) => (t.filePath || t.destinationPath) && t.status !== 'Skipped (Already on Device)' && t.title !== '4tHJc5agHg9LVsijAwtooy' && !/^[a-zA-Z0-9]{20,}$/.test(t.title) && !t.title.toLowerCase().includes('3 drags'))
          : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // 3. Trash: Trashed tracks
  const [trash, setTrash] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-trash');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-playlists');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const handleCreatePlaylist = (name, description, icon = '🎵') => {
    const newPl = {
      id: 'pl-' + Date.now(),
      name: name || 'New Playlist',
      description: description || 'Custom user playlist',
      icon: icon || '🎵',
      tracks: [],
    };
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
    if (window.electronAPI?.createPlaylist) {
      window.electronAPI.createPlaylist(name, description);
    }
  };

  const handleDeletePlaylist = (playlistId) => {
    const target = playlists.find((p) => p.id === playlistId);
    const updated = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
    if (window.electronAPI?.deletePlaylist && target) {
      window.electronAPI.deletePlaylist(target.name || playlistId);
    }
  };

  const handleRenamePlaylist = (playlistId, newName) => {
    const updated = playlists.map((p) => (p.id === playlistId ? { ...p, name: newName } : p));
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleUpdatePlaylistCover = (playlistId, newIcon) => {
    const updated = playlists.map((p) => (p.id === playlistId ? { ...p, icon: newIcon } : p));
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddTrackToPlaylist = (playlistId, track) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        const exists = (p.tracks || []).some((t) => (t.id && t.id === track.id) || (t.filePath && t.filePath === track.filePath));
        if (exists) return p;
        return { ...p, tracks: [...(p.tracks || []), track] };
      }
      return p;
    });
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveTrackFromPlaylist = (playlistId, trackId) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: (p.tracks || []).filter((t) => t.id !== trackId && t.filePath !== trackId),
        };
      }
      return p;
    });
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
  };

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-preferences');
      return saved ? JSON.parse(saved) : { downloadFolder: 'C:\\Users\\nishant\\Music', bitrate: '320k', format: 'mp3' };
    } catch {
      return { downloadFolder: 'C:\\Users\\nishant\\Music', bitrate: '320k', format: 'mp3' };
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('localguy-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Apply data-theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('localguy-theme', theme);
    } catch (e) {}
  }, [theme]);

  const [appearance, setAppearance] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-appearance');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      accentColor: '#7c5cbf',
      fontFamily: 'Inter',
      borderRadius: '8px'
    };
  });

  useEffect(() => {
    const root = document.documentElement;
    if (appearance.accentColor) {
      root.style.setProperty('--primary', appearance.accentColor);
      root.style.setProperty('--primary-hover', appearance.accentColor + 'dd');
      root.style.setProperty('--primary-glow', appearance.accentColor + '26');
      root.style.setProperty('--accent', appearance.accentColor);
    }
    if (appearance.fontFamily) {
      let fontStack = "'Inter', sans-serif";
      if (appearance.fontFamily === 'System UI') fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      else if (appearance.fontFamily === 'JetBrains Mono') fontStack = "'JetBrains Mono', monospace";
      else if (appearance.fontFamily === 'Geist Sans') fontStack = "'Geist', -apple-system, sans-serif";
      else if (appearance.fontFamily === 'Merriweather') fontStack = "'Merriweather', Georgia, serif";
      else if (appearance.fontFamily === 'Comic / Playful') fontStack = "'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif";
      else fontStack = `'${appearance.fontFamily}', -apple-system, sans-serif`;
      root.style.setProperty('--font-sans', fontStack);
      document.body.style.fontFamily = fontStack;
    }
    if (appearance.borderRadius) {
      root.style.setProperty('--app-radius', appearance.borderRadius);
    }
    try {
      localStorage.setItem('luckyguy-appearance', JSON.stringify(appearance));
    } catch {}
  }, [appearance]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 4. Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);

  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(() => {
    try {
      return !localStorage.getItem('luckyguy-setup-completed');
    } catch {
      return false;
    }
  });
  const [updateNotification, setUpdateNotification] = useState(null);

  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-liked-tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const audioRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-active-tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-songs', JSON.stringify(songs));
    } catch (e) {}
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-downloads', JSON.stringify(completedDownloads));
    } catch (e) {}
  }, [completedDownloads]);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-trash', JSON.stringify(trash));
    } catch (e) {}
  }, [trash]);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-preferences', JSON.stringify(preferences));
    } catch (e) {}
  }, [preferences]);

    // Real-time disk verification: Ensure library, downloads & trash only contain actual existing files
  useEffect(() => {
    if (!window.electronAPI) return;

    // 1. Sync & verify backend library songs
    if (window.electronAPI.getSongs) {
      window.electronAPI.getSongs().then(async (loadedSongs) => {
        const validList = Array.isArray(loadedSongs) ? loadedSongs : [];
        if (validList.length > 0 && window.electronAPI.verifyFilesExist) {
          const existMap = await window.electronAPI.verifyFilesExist(validList.map(s => s.filePath).filter(Boolean));
          const actualSongs = validList.filter(s => s.filePath && existMap[s.filePath] === true);
          setSongs(actualSongs);
        } else {
          setSongs([]);
        }
      }).catch(console.error);
    }

    // 2. Verify completed downloads against physical disk files
    if (window.electronAPI.verifyFilesExist) {
      const dlPaths = completedDownloads.map(d => d.destinationPath || d.filePath).filter(Boolean);
      if (dlPaths.length > 0) {
        window.electronAPI.verifyFilesExist(dlPaths).then((existMap) => {
          setCompletedDownloads((prev) => prev.filter(d => {
            const fp = d.destinationPath || d.filePath;
            return fp && existMap[fp] === true;
          }));
        }).catch(console.error);
      } else if (completedDownloads.length > 0) {
        setCompletedDownloads([]);
      }

      // 3. Verify trash items against disk
      const trashPaths = trash.map(t => t.filePath || t.destinationPath).filter(Boolean);
      if (trashPaths.length > 0) {
        window.electronAPI.verifyFilesExist(trashPaths).then((existMap) => {
          setTrash((prev) => prev.filter(t => {
            const fp = t.filePath || t.destinationPath;
            return fp && existMap[fp] === true;
          }));
        }).catch(console.error);
      }
    }
  }, []);

// Load preferences from backend config.json on boot
  useEffect(() => {
    if (window.electronAPI?.getPreferences) {
      window.electronAPI.getPreferences().then((loadedPrefs) => {
        if (loadedPrefs && typeof loadedPrefs === 'object') {
          setPreferences((prev) => ({ ...prev, ...loadedPrefs }));
        }
      });
    }
  }, []);

  // Sleep timer interval countdown
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handlePause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // Sync download events from Electron
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onDownloadProgress((payload) => {
      setActiveDownloads((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                progress: payload.progress !== undefined
                  ? (payload.progress <= 1 && payload.progress > 0 ? Math.round(payload.progress * 100) : Math.round(payload.progress))
                  : item.progress,
                downloadedBytes: payload.downloadedBytes ?? item.downloadedBytes,
                totalBytes: payload.totalBytes ?? item.totalBytes,
                speed: payload.speed || (payload.speedBytesPerSec ? (payload.speedBytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s' : item.speed),
                status: payload.status ? payload.status.toLowerCase() : item.status,
              }
            : item
        )
      );
    });

    window.electronAPI.onDownloadCompleted((payload) => {
      if (downloadCompletionMap.has(payload.id)) {
        const resolve = downloadCompletionMap.get(payload.id);
        downloadCompletionMap.delete(payload.id);
        resolve(true);
      }
      setActiveDownloads((prev) => prev.filter((item) => item.id !== payload.id));
      const finalBytes = payload.fileSize || payload.downloadedBytes;
      let formattedSize = payload.size || 'Saved';
      if (finalBytes && !isNaN(finalBytes) && finalBytes > 0) {
        const mb = finalBytes / (1024 * 1024);
        formattedSize = mb >= 1000 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB';
      }
      const completed = {
        id: payload.id,
        title: payload.title,
        artist: payload.artist,
        album: payload.album,
        duration: payload.duration,
        artworkUrl: payload.artworkUrl,
        streamUrl: payload.streamUrl,
        filePath: payload.filePath,
        format: payload.format || 'MP3 320k',
        size: formattedSize,
        fileSize: finalBytes,
        downloadedAt: new Date().toLocaleDateString(),
      };
      setCompletedDownloads((prev) => [completed, ...prev]);
      setSongs((prev) => {
        if (prev.some((s) => s.filePath === completed.filePath || s.id === completed.id)) return prev;
        return [completed, ...prev];
      });
    });

    if (window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((updateInfo) => {
        setUpdateNotification(updateInfo);
      });
    }

    window.electronAPI.onDownloadFailed((payload) => {
      if (downloadCompletionMap.has(payload.id)) {
        const resolve = downloadCompletionMap.get(payload.id);
        downloadCompletionMap.delete(payload.id);
        resolve(false);
      }
      setActiveDownloads((prev) =>
        prev.map((item) =>
          item.id === payload.id ? { ...item, status: 'failed', error: payload.error } : item
        )
      );
    });
  }, []);

  // Handlers for downloads
  const handleStartDownload = async (queryOrUrl) => {
    const trimmed = queryOrUrl.trim();
    if (!trimmed) return;

    const taskId = 'dl-' + Date.now();
    let resolvedTrack = null;

    // 1. Check if backend URL extraction works
    if (window.electronAPI?.extractUrl) {
      try {
        const res = await window.electronAPI.extractUrl(trimmed);
        if (res && !res.error && (res.title || res.streamUrl)) {
          resolvedTrack = res;
        }
      } catch (err) {
        console.warn('Backend extraction error:', err);
      }
    }

    // 2. Fallback: search JioSaavn
    if (!resolvedTrack && window.electronAPI?.searchJioSaavn) {
      try {
        const jio = await window.electronAPI.searchJioSaavn(trimmed);
        if (jio && (jio.title || jio.streamUrl)) {
          resolvedTrack = jio;
        }
      } catch (e) {}
    }

    // 3. Fallback resolution for web mode (only for text search queries, NEVER for URLs)
    if (!resolvedTrack) {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        console.warn('URL could not be resolved or extracted:', trimmed);
        return;
      }
      let title = trimmed;
      let artist = 'Various Artists';
      if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }
      resolvedTrack = {
        title,
        artist,
        album: 'Downloaded Master',
        durationSeconds: 215,
        streamUrl: null,
      };
    }

    const musicDir = preferences?.downloadFolder || 'C:\\Users\\nishant\\Music';

    // Handle Multi-track entities (Playlist / Album batch)
    if (resolvedTrack.tracks && Array.isArray(resolvedTrack.tracks) && resolvedTrack.tracks.length > 0) {
      const tasksToQueue = [];
      for (const t of resolvedTrack.tracks) {
        const itemTitle = t.title || 'Track';
        const itemArtist = t.artist || resolvedTrack.artist || 'Unknown Artist';
        const itemCover = t.coverUrl || '';

        const tCleanTitle = itemTitle.replace(/[\/\\?%*:|"<>]/g, '_');
        const tCleanArtist = (itemArtist && itemArtist !== 'Unknown Artist')
          ? itemArtist.replace(/[\/\\?%*:|"<>]/g, '_') + ' - '
          : '';
        const tSampleFilename = `${tCleanArtist}${tCleanTitle}.m4a`;

        const tTaskId = 'dl-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        tasksToQueue.push({
          id: tTaskId,
          title: itemTitle,
          artist: itemArtist,
          album: resolvedTrack.title || 'Playlist',
          artworkUrl: itemCover,
          duration: Math.round((t.durationMs || 215000) / 1000),
          format: 'MP3 320k',
          size: 'In Queue',
          speed: 'Waiting in queue...',
          progress: 0,
          status: 'queued',
          destinationPath: null,
          sampleFilename: tSampleFilename,
        });
      }

      // Instantly populate the Downloads Manager UI table so user sees all items in queue!
      setActiveDownloads((prev) => [...tasksToQueue, ...prev]);

      // Controlled queue worker: 2 tracks processed in parallel with true completion waiting
      isQueueCancelledRef.current = false;
      cancelledTaskIdsRef.current.clear();

      (async () => {
        const CONCURRENCY = 2;
        let queueIndex = 0;

        const worker = async () => {
          while (queueIndex < tasksToQueue.length) {
            if (isQueueCancelledRef.current) break;

            const task = tasksToQueue[queueIndex++];
            if (!task) break;

            if (cancelledTaskIdsRef.current.has(task.id)) continue;

            try {
              // Check if file is already on device in any genre subfolder
              if (window.electronAPI?.checkFileExists) {
                const samplePath = musicDir + '\\' + (task.sampleFilename || (task.title + '.m4a'));
                const exists = await window.electronAPI.checkFileExists(samplePath);
                if (exists) {
                  setActiveDownloads((prev) => prev.filter((item) => item.id !== task.id));
                  continue;
                }
              }

              // Update status to scanning & resolving individual artwork
              setActiveDownloads((prev) =>
                prev.map((item) =>
                  item.id === task.id
                    ? {
                        ...item,
                        status: 'downloading',
                        speed: 'Scanning artwork & audio...',
                        progress: 0,
                      }
                    : item
                )
              );

              // 1. Search JioSaavn / iTunes for real high-fidelity stream & authentic individual song artwork
              let tStreamUrl = null;
              let tBitrate = '320kbps';
              let tArtwork = task.artworkUrl;
              let tAlbum = task.album;

              if (window.electronAPI?.resolveTrackStream) {
                try {
                  const resolved = await window.electronAPI.resolveTrackStream(task.title, task.artist);
                  if (resolved && resolved.streamUrl) {
                    tStreamUrl = resolved.streamUrl;
                    tBitrate = resolved.bitrate || '320kbps';
                    if (resolved.artworkUrl) tArtwork = resolved.artworkUrl;
                    if (resolved.album) tAlbum = resolved.album;
                  }
                } catch (e) {}
              } else if (window.electronAPI?.searchJioSaavn) {
                try {
                  const jioMatch = await window.electronAPI.searchJioSaavn(task.title + ' ' + task.artist);
                  if (jioMatch && jioMatch.streamUrl) {
                    tStreamUrl = jioMatch.streamUrl;
                    tBitrate = jioMatch.bitrate || '320kbps';
                    if (jioMatch.artworkUrl) tArtwork = jioMatch.artworkUrl;
                    if (jioMatch.album) tAlbum = jioMatch.album;
                  }
                } catch (e) {}
              }

              if (isQueueCancelledRef.current || cancelledTaskIdsRef.current.has(task.id)) {
                continue;
              }

              // Update task with the real individual artwork and album
              setActiveDownloads((prev) =>
                prev.map((item) =>
                  item.id === task.id
                    ? {
                        ...item,
                        artworkUrl: tArtwork || item.artworkUrl,
                        album: tAlbum || item.album,
                        speed: tStreamUrl ? 'Connecting...' : 'Stream not found',
                        progress: 0,
                        status: tStreamUrl ? 'downloading' : 'failed',
                      }
                    : item
                )
              );

              if (tStreamUrl && window.electronAPI?.startDownload) {
                const completionPromise = new Promise((resolve) => {
                  downloadCompletionMap.set(task.id, resolve);
                  setTimeout(() => {
                    if (downloadCompletionMap.has(task.id)) {
                      downloadCompletionMap.delete(task.id);
                      resolve(false);
                    }
                  }, 120000); // 2 minute per-track safety timeout
                });

                await window.electronAPI.startDownload({
                  id: task.id,
                  url: tStreamUrl,
                  title: task.title,
                  artist: task.artist,
                  album: tAlbum,
                  artworkUrl: tArtwork,
                  duration: task.duration,
                  destinationPath: null, // Auto-organizes into genre subfolder!
                  formatType: 'AUDIO',
                  qualityLabel: tBitrate,
                });

                // Wait for this specific download to finish before this worker takes the next track!
                await completionPromise;
              }

              // Polite pause before next track
              await new Promise((r) => setTimeout(r, 400));
            } catch (err) {
              console.error('Track queue error:', err);
            }
          }
        };

        const workers = Array(CONCURRENCY).fill(null).map(() => worker());
        await Promise.all(workers);
      })();

      return;
    }

    const title = resolvedTrack.title || trimmed;
    const artist = resolvedTrack.artist || 'Unknown Artist';
    const album = resolvedTrack.album || 'Single Master';
    const artworkUrl = resolvedTrack.artworkUrl || '';
    const duration = resolvedTrack.durationSeconds || 215;
    const streamUrl = resolvedTrack.streamUrl;

    const cleanTitle = title.replace(/[\/\\?%*:|"<>]/g, '_');
    const cleanArtist = (artist && artist !== 'Unknown Artist') ? artist.replace(/[\/\\?%*:|"<>]/g, '_') + ' - ' : '';
    const destinationPath = musicDir + '\\' + cleanArtist + cleanTitle + '.mp3';

    const newTask = {
      id: taskId,
      title,
      artist,
      album,
      artworkUrl,
      duration,
      format: 'MP3 320k',
      size: '8.8 MB',
      speed: 'Starting...',
      progress: 5,
      status: 'downloading',
      streamUrl,
      destinationPath: null,
    };

    setActiveDownloads((prev) => [newTask, ...prev]);

    // 4. Trigger Real Download in Electron
    if (window.electronAPI?.startDownload && streamUrl) {
      try {
        await window.electronAPI.startDownload({
          id: taskId,
          url: streamUrl,
          title,
          artist,
          album,
          artworkUrl,
          duration,
          destinationPath: null, // Auto-organizes into genre subfolder!
          formatType: 'AUDIO',
          qualityLabel: resolvedTrack.bitrate || '320kbps',
        });
      } catch (err) {
        console.error('Download start error:', err);
      }
    } else {
      let p = 10;
      const interval = setInterval(() => {
        p += 25;
        if (p >= 100) {
          clearInterval(interval);
          const completed = {
            id: 'song-' + Date.now(),
            title,
            artist,
            album,
            duration,
            artworkUrl,
            streamUrl,
            filePath: destinationPath,
            format: 'MP3 320k',
            size: '8.8 MB',
            downloadedAt: new Date().toLocaleDateString(),
          };
          setActiveDownloads((prev) => prev.filter((t) => t.id !== taskId));
          setCompletedDownloads((prev) => [completed, ...prev]);
          setSongs((prev) => [completed, ...prev]);
        } else {
          setActiveDownloads((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, progress: p, speed: '4.8 MB/s' } : t))
          );
        }
      }, 350);
    }
  };

  const handlePauseDownload = async (id) => {
    setActiveDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'paused' } : d))
    );
    if (window.electronAPI?.pauseDownload) {
      await window.electronAPI.pauseDownload(id);
    }
  };

  const handleResumeDownload = async (id) => {
    setActiveDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'downloading' } : d))
    );
    if (window.electronAPI?.resumeDownload) {
      await window.electronAPI.resumeDownload(id);
    }
  };

  const handlePauseAll = async () => {
    setActiveDownloads((prev) => prev.map((d) => ({ ...d, status: 'paused' })));
    if (window.electronAPI?.pauseAllDownloads) {
      await window.electronAPI.pauseAllDownloads();
    }
  };

  const handleResumeAll = async () => {
    setActiveDownloads((prev) => prev.map((d) => ({ ...d, status: 'downloading' })));
    if (window.electronAPI?.resumeAllDownloads) {
      await window.electronAPI.resumeAllDownloads();
    }
  };

  const handleCancelDownload = (id) => {
    cancelledTaskIdsRef.current.add(id);
    if (downloadCompletionMap.has(id)) {
      const resolve = downloadCompletionMap.get(id);
      downloadCompletionMap.delete(id);
      resolve(false);
    }
    setActiveDownloads((prev) => prev.filter((d) => d.id !== id));
    if (window.electronAPI?.cancelDownload) {
      window.electronAPI.cancelDownload(id);
    }
  };

  const handleCancelAll = () => {
    isQueueCancelledRef.current = true;
    activeDownloads.forEach((d) => {
      cancelledTaskIdsRef.current.add(d.id);
      if (downloadCompletionMap.has(d.id)) {
        const resolve = downloadCompletionMap.get(d.id);
        downloadCompletionMap.delete(d.id);
        resolve(false);
      }
      if (window.electronAPI?.cancelDownload) {
        window.electronAPI.cancelDownload(d.id);
      }
    });
    setActiveDownloads([]);
  };

  const handleDeleteDownload = (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const itemsToDelete = completedDownloads.filter((d) => ids.includes(d.id));
    if (itemsToDelete.length > 0) {
      const deletedPaths = new Set(itemsToDelete.map((item) => item.destinationPath || item.filePath).filter(Boolean));
      setCompletedDownloads((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSongs((prev) => prev.filter((s) => !ids.includes(s.id) && !deletedPaths.has(s.filePath)));
      for (const item of itemsToDelete) {
        const fp = item.destinationPath || item.filePath;
        if (window.electronAPI?.deleteFilePermanently) {
          window.electronAPI.deleteFilePermanently(fp, item.id);
        }
      }
    }
  };

  const handleClearCompleted = () => {
    for (const item of completedDownloads) {
      const fp = item.destinationPath || item.filePath;
      if (window.electronAPI?.deleteFilePermanently) {
        window.electronAPI.deleteFilePermanently(fp, item.id);
      }
    }
    setSongs((prev) => prev.filter((s) => !completedDownloads.some((d) => d.id === s.id || (d.destinationPath && d.destinationPath === s.filePath))));
    setCompletedDownloads([]);
  };

  const handleTrashSong = (track) => {
    const filePath = track.filePath || track.destinationPath;
    if (window.electronAPI?.deleteFilePermanently) {
      window.electronAPI.deleteFilePermanently(filePath, track.id);
    }
    setSongs((prev) => {
      const remaining = prev.filter((s) => s.id !== track.id && (!filePath || s.filePath !== filePath));
      if (currentTrack && (currentTrack.id === track.id || currentTrack.filePath === filePath)) {
        if (remaining.length > 0) {
          handlePlayTrack(remaining[0]);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        }
      }
      return remaining;
    });
    setCompletedDownloads((prev) => prev.filter((d) => d.id !== track.id && (!filePath || (d.destinationPath !== filePath && d.filePath !== filePath))));
  };

  const handleRestoreTrack = (track) => {
    setTrash((prev) => prev.filter((t) => t.id !== track.id));
    setSongs((prev) => [track, ...prev]);
    setCompletedDownloads((prev) => [track, ...prev]);
  };

  const handleUpdateSong = (id, updates) => {
    setSongs((prev) => prev.map((s) => (s.id === id || s.filePath === id ? { ...s, ...updates } : s)));
    setCompletedDownloads((prev) => prev.map((d) => (d.id === id || d.filePath === id ? { ...d, ...updates } : d)));
    try {
      const saved = JSON.parse(localStorage.getItem('localguy-songs') || '[]');
      const updated = saved.map((s) => (s.id === id || s.filePath === id ? { ...s, ...updates } : s));
      localStorage.setItem('localguy-songs', JSON.stringify(updated));
    } catch(e) {}
    if (window.electronAPI?.updateSongMetadata) {
      window.electronAPI.updateSongMetadata(id, updates);
    }
  };

  const handlePermanentDelete = async (trackOrId) => {
    const track = typeof trackOrId === 'object'
      ? trackOrId
      : (trash.find((t) => t.id === trackOrId) || songs.find((t) => t.id === trackOrId));
    const id = track?.id || trackOrId;
    const filePath = track?.filePath || track?.destinationPath;

    if (filePath && window.electronAPI?.deleteFilePermanently) {
      try {
        await window.electronAPI.deleteFilePermanently(filePath, id);
      } catch(e) {}
    }

    setTrash((prev) => prev.filter((t) => t.id !== id && (!filePath || (t.filePath !== filePath && t.destinationPath !== filePath))));
    setSongs((prev) => {
      const remaining = prev.filter((s) => s.id !== id && (!filePath || (s.filePath !== filePath && s.destinationPath !== filePath)));
      if (currentTrack && (currentTrack.id === id || (filePath && currentTrack.filePath === filePath))) {
        if (remaining.length > 0) {
          handlePlayTrack(remaining[0]);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        }
      }
      return remaining;
    });
    setCompletedDownloads((prev) => prev.filter((d) => d.id !== id && (!filePath || (d.destinationPath !== filePath && d.filePath !== filePath))));
  };

  const handleEmptyTrash = async () => {
    const itemsToDelete = [...trash];
    for (const item of itemsToDelete) {
      const filePath = item.filePath || item.destinationPath;
      if (filePath && window.electronAPI?.deleteFilePermanently) {
        await window.electronAPI.deleteFilePermanently(filePath, item.id);
      }
    }
    setTrash([]);
    setSongs((prev) => prev.filter((s) => !itemsToDelete.some((item) => item.id === s.id || (item.filePath && item.filePath === s.filePath))));
    setCompletedDownloads((prev) => prev.filter((d) => !itemsToDelete.some((item) => item.id === d.id || (item.destinationPath && item.destinationPath === d.destinationPath))));
  };

  const handleOpenFolder = (targetPath) => {
    const folder = targetPath || preferences?.downloadFolder || 'C:\\Users\\nishant\\Music';
    if (window.electronAPI?.openInFolder) {
      window.electronAPI.openInFolder(folder);
    }
  };

  // Audio Event Listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNextTrack();
    }
  };

  const formatAudioSrc = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const clean = filePath.replace(/\\/g, '/');
    const parts = clean.split('/');
    const encodedParts = parts.map((part, idx) => {
      if (idx === 0 && part.endsWith(':')) return part;
      return encodeURIComponent(part);
    });
    const normalized = encodedParts.join('/');
    return 'file:///' + (normalized.startsWith('/') ? normalized.slice(1) : normalized);
  };

  // Playback Controls with Real Audio Source Loading
  const handlePlayTrack = async (track, trackList = null) => {
    if (!track) return;

    let resolvedPath = track.filePath;
    if (window.electronAPI?.resolveAudioPath && resolvedPath) {
      try {
        const actual = await window.electronAPI.resolveAudioPath(resolvedPath, track.title, track.artist);
        if (actual) resolvedPath = actual;
      } catch (e) {}
    }

    const activeTrack = { ...track, filePath: resolvedPath };
    setCurrentTrack(activeTrack);

    const listToQueue = trackList || (songs.length > 0 ? songs : [activeTrack]);
    setQueue(listToQueue);
    const idx = listToQueue.findIndex((t) => (t.id && t.id === track.id) || (t.filePath && t.filePath === resolvedPath));
    setQueueIndex(idx !== -1 ? idx : 0);

    let audioSrc = activeTrack.streamUrl;
    if (!audioSrc && resolvedPath) {
      audioSrc = formatAudioSrc(resolvedPath);
    }

    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
      setDuration(activeTrack.duration || 215);
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (songs.length > 0) {
        handlePlayTrack(songs[0]);
      }
      return;
    }
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(true));
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.85;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleToggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    setRepeatMode(modes[nextIdx]);
  };

  const handleChangePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleNextTrack = () => {
    const list = queue.length > 0 ? queue : songs;
    if (list.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * list.length);
    } else {
      nextIndex = (queueIndex + 1) % list.length;
    }
    setQueueIndex(nextIndex);
    handlePlayTrack(list[nextIndex]);
  };

  const handlePreviousTrack = () => {
    const list = queue.length > 0 ? queue : songs;
    if (list.length === 0) return;
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : list.length - 1;
    setQueueIndex(prevIndex);
    handlePlayTrack(list[prevIndex]);
  };

  const handleToggleLike = (track) => {
    const key = track.id || track.filePath || track.title;
    setLikedTracks((prev) => {
      let updated;
      if (prev.includes(key)) {
        updated = prev.filter((k) => k !== key);
      } else {
        updated = [...prev, key];
      }
      try {
        localStorage.setItem('localguy-liked-tracks', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleScanLibrary = async () => {
    if (window.electronAPI?.scanLocalMusic) {
      const scanned = await window.electronAPI.scanLocalMusic(['C:\\Users\\nishant\\Music']);
      if (scanned && scanned.length > 0) setSongs(scanned);
    }
  };

  const handleOrganizeLibrary = async () => {
    if (window.electronAPI?.organizeAndFixLibrary) {
      const folder = preferences?.downloadFolder || 'C:\\Users\\nishant\\Music';
      const res = await window.electronAPI.organizeAndFixLibrary(folder);
      if (window.electronAPI?.getSongs) {
        const refreshed = await window.electronAPI.getSongs();
        if (refreshed && Array.isArray(refreshed) && refreshed.length > 0) {
          setSongs(refreshed);
        }
      }
      return res;
    }
    return { success: false, error: 'Not available' };
  };

  // Global Spacebar Play / Pause Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
        const isEditable = e.target.isContentEditable;
        if (tag === 'input' || tag === 'textarea' || isEditable) return;
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, songs]);

  const isCurrentTrackLiked = currentTrack
    ? likedTracks.includes(currentTrack.id || currentTrack.filePath || currentTrack.title)
    : false;

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--color-background-primary, #ffffff)',
      }}
    >
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          if (e.target.duration && !isNaN(e.target.duration)) {
            setDuration(e.target.duration);
          }
        }}
        onDurationChange={(e) => {
          if (e.target.duration && !isNaN(e.target.duration)) {
            setDuration(e.target.duration);
          }
        }}
        onEnded={handleEnded}
        onError={(e) => {
          console.warn('Audio tag playback error:', e);
          setIsPlaying(false);
        }}
      />

      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settingsCategory={settingsCategory}
        setSettingsCategory={setSettingsCategory}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeDownloadCount={activeDownloads.length}
        trashCount={trash.length}
        likedCount={likedTracks.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        pluginTabs={pluginTabs}
      />

      {/* 2. Main App Area */}
      <div
        className="app-main"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header / TitleBar */}
        <TitleBar
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          libraryTracks={songs}
          onPlayTrack={handlePlayTrack}
          onNavigateHome={() => setActiveTab('home')}
          activeTab={activeTab}
          onNavigate={setActiveTab}
          pluginTabs={pluginTabs}
        />

        {/* Center Workspace */}
        <div
          className="app-content-row"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <main
            style={{
              flex: 1,
              overflow: 'hidden',
              minWidth: 0,
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {activeTab === 'home' && (
              <HomeTab
                songs={songs}
                playlists={playlists}
                likedTracks={likedTracks}
                onPlaySong={handlePlayTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onToggleLike={handleToggleLike}
                onNavigateToLibrary={() => setActiveTab('library')}
                onNavigateToPlaylists={() => setActiveTab('playlists')}
                onNavigateToLiked={() => setActiveTab('liked')}
                onNavigateToDownloads={() => setActiveTab('downloads')}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab
                songs={songs}
                playlists={playlists}
                onPlaySong={handlePlayTrack}
                onScanLibrary={handleScanLibrary}
                onOrganizeLibrary={handleOrganizeLibrary}
                onTrashSong={handleTrashSong}
                onPermanentDelete={handlePermanentDelete}
                onOpenFolder={handleOpenFolder}
                onUpdateSong={handleUpdateSong}
                onAddToPlaylist={handleAddTrackToPlaylist}
                downloadFolder={preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'}
                preferences={preferences}
                onSavePreferences={(newPrefs) => {
                  setPreferences((prev) => ({ ...prev, ...newPrefs }));
                  if (window.electronAPI?.savePreferences) {
                    window.electronAPI.savePreferences(newPrefs);
                  }
                }}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onNavigateToHome={() => setActiveTab('home')}
                likedTracks={likedTracks}
                onToggleLike={handleToggleLike}
              />
            )}

            {activeTab === 'playlists' && (
              <PlaylistsTab
                playlists={playlists}
                songs={songs}
                onPlaySong={handlePlayTrack}
                onCreatePlaylist={handleCreatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRenamePlaylist={handleRenamePlaylist}
                onUpdatePlaylistCover={handleUpdatePlaylistCover}
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
                onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                onBack={() => setActiveTab('library')}
                onNavigateToHome={() => setActiveTab('home')}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                likedTracks={likedTracks}
                onToggleLike={handleToggleLike}
              />
            )}

            {activeTab === 'liked' && (
              <LikedSongsTab
                songs={songs}
                likedTracks={likedTracks}
                onToggleLike={handleToggleLike}
                onPlayTrack={handlePlayTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onBack={() => setActiveTab('library')}
                onTrashSong={handleTrashSong}
                onOpenFolder={handleOpenFolder}
                downloadFolder={preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'downloads' && (
              <DownloadsTab
                activeDownloads={activeDownloads}
                completedDownloads={completedDownloads}
                installedExtensions={installedExtensions}
                onStartDownload={handleStartDownload}
                onPauseDownload={handlePauseDownload}
                onResumeDownload={handleResumeDownload}
                onPauseAll={handlePauseAll}
                onResumeAll={handleResumeAll}
                onCancelDownload={handleCancelDownload}
                onCancelAll={handleCancelAll}
                onClearCompleted={handleClearCompleted}
                onDeleteDownload={handleDeleteDownload}
                onPlayTrack={handlePlayTrack}
                onOpenFolder={handleOpenFolder}
                downloadFolder={preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'}
                onNavigateToHome={() => setActiveTab('home')}
                onNavigateToLibrary={() => setActiveTab('library')}
                preferences={preferences}
                onSavePreferences={(newPrefs) => {
                  setPreferences((prev) => ({ ...prev, ...newPrefs }));
                  if (window.electronAPI?.savePreferences) {
                    window.electronAPI.savePreferences(newPrefs);
                  }
                }}
              />
            )}

            {/* DYNAMIC PLUGIN-DECLARED TAB ROUTING */}
            {activeTab.startsWith('plugin-') && (() => {
              const pluginId = activeTab.replace('plugin-', '');
              const matchedPlugin = pluginTabs.find((p) => p.id === pluginId);
              if (!matchedPlugin) return null;
              return (
                <PluginTabContainer
                  key={matchedPlugin.id}
                  plugin={matchedPlugin}
                  onStartDownload={handleStartDownload}
                  preferences={preferences}
                  onOpenFolder={handleOpenFolder}
                />
              );
            })()}

            {activeTab === 'settings' && (
              <SettingsTab
                category={settingsCategory}
                onSelectCategory={setSettingsCategory}
                preferences={preferences}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                appearance={appearance}
                onUpdateAppearance={setAppearance}
                onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
                onUpdateExtensions={setInstalledExtensions}
                onSavePreferences={(prefs) => {
                  setPreferences(prefs);
                  window.electronAPI?.savePreferences?.(prefs);
                }}
              />
            )}
          </main>

          {/* Sliding Queue Drawer */}
          <QueueDrawer
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            queue={queue.length > 0 ? queue : songs}
            currentIndex={queueIndex}
            onSelectTrack={(idx) => {
              setQueueIndex(idx);
              const list = queue.length > 0 ? queue : songs;
              handlePlayTrack(list[idx]);
            }}
            onClearQueue={() => setQueue([])}
          />
        </div>

        {/* 3. Docked Music Player Bar */}
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onToggleRepeat={handleToggleRepeat}
          playbackSpeed={playbackSpeed}
          onChangePlaybackSpeed={handleChangePlaybackSpeed}
          onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
          sleepTimerRemaining={sleepTimerRemaining}
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          isQueueOpen={isQueueOpen}
          isLiked={isCurrentTrackLiked}
          onToggleLike={handleToggleLike}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </div>

      {/* Top Update Notification Banner */}
      {updateNotification && (
        <div
          style={{
            position: 'fixed',
            top: '40px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            padding: '14px 18px',
            border: '1.5px solid var(--primary, #7c5cbf)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '420px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Update Available: v{updateNotification.latestVersion}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              A newer release of LuckyGuy is available on GitHub.
            </div>
          </div>
          <button
            onClick={() => {
              if (updateNotification.releaseUrl && window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(updateNotification.releaseUrl);
              } else if (updateNotification.releaseUrl) {
                window.open(updateNotification.releaseUrl, '_blank');
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary, #7c5cbf)',
              border: 'none',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Update
          </button>
          <button
            onClick={() => setUpdateNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Setup Wizard Modal */}
      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        preferences={preferences}
        onSavePreferences={(prefs) => {
          setPreferences((prev) => ({ ...prev, ...prefs }));
          if (window.electronAPI?.savePreferences) {
            window.electronAPI.savePreferences(prefs);
          }
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Sleep Timer Modal */}
      {isSleepTimerOpen && (
        <SleepTimerModal
          isOpen={isSleepTimerOpen}
          onClose={() => setIsSleepTimerOpen(false)}
          onSetTimer={(mins) => {
            setSleepTimerRemaining(mins * 60);
            setIsSleepTimerOpen(false);
          }}
          onCancelTimer={() => {
            setSleepTimerRemaining(null);
            setIsSleepTimerOpen(false);
          }}
        />
      )}
    </div>
  );
}
