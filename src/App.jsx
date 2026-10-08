import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import HomeTab from './components/HomeTab';
import LibraryTab from './components/LibraryTab';
import DownloadsTab from './components/DownloadsTab';
import TrashTab from './components/TrashTab';
import SettingsTab from './components/SettingsTab';
import LikedSongsTab from './components/LikedSongsTab';
import PlaylistsTab from './components/PlaylistsTab';
import SleepTimerModal from './components/SleepTimerModal';
import QueueDrawer from './components/QueueDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('localguy-active-tab') || 'home';
    } catch {
      return 'home';
    }
  });
  const [settingsCategory, setSettingsCategory] = useState('downloads');
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
        return parsed.filter((t) => t.title !== '4tHJc5agHg9LVsijAwtooy' && !/^[a-zA-Z0-9]{20,}$/.test(t.title) && !t.title.toLowerCase().includes('3 drags'));
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
    return [
      { id: 'pl-chill', name: 'Chill Vibes', description: 'Lo-Fi beats and ambient tracks', icon: '🎧', tracks: [] },
      { id: 'pl-favorites', name: 'Top Hits', description: 'Heavy rotation studio masters', icon: '🔥', tracks: [] },
      { id: 'pl-night', name: 'Late Night Focus', description: 'Deep electronic and downtempo', icon: '🌙', tracks: [] },
    ];
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
                progress: payload.progress,
                speed: payload.speed || item.speed,
                status: 'downloading',
              }
            : item
        )
      );
    });

    window.electronAPI.onDownloadCompleted((payload) => {
      setActiveDownloads((prev) => prev.filter((item) => item.id !== payload.id));
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
        size: payload.size || 'Saved',
        downloadedAt: new Date().toLocaleDateString(),
      };
      setCompletedDownloads((prev) => [completed, ...prev]);
      setSongs((prev) => {
        if (prev.some((s) => s.filePath === completed.filePath || s.id === completed.id)) return prev;
        return [completed, ...prev];
      });
    });

    window.electronAPI.onDownloadFailed((payload) => {
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

    // 3. Fallback resolution for web mode
    if (!resolvedTrack) {
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

    // Handle Multi-track entities (Playlist / Album batch) with duplicate skip
    if (resolvedTrack.tracks && Array.isArray(resolvedTrack.tracks) && resolvedTrack.tracks.length > 0) {
      for (const t of resolvedTrack.tracks) {
        const itemTitle = t.title || 'Track';
        const itemArtist = t.artist || resolvedTrack.artist || 'Unknown Artist';
        const itemCover = t.coverUrl || resolvedTrack.artworkUrl || '';

        // Check if already downloaded on device
        let isAlreadyOnDevice = false;
        if (window.electronAPI?.checkAlreadyDownloaded) {
          try {
            isAlreadyOnDevice = await window.electronAPI.checkAlreadyDownloaded(itemTitle, itemArtist);
          } catch (e) {}
        }

        if (isAlreadyOnDevice) {
          const skippedEntry = {
            id: 'skip-' + Date.now() + '-' + Math.random().toString(36).substring(7),
            title: itemTitle,
            artist: itemArtist,
            album: resolvedTrack.title || 'Playlist',
            artworkUrl: itemCover,
            duration: Math.round((t.durationMs || 215000) / 1000),
            format: 'MP3 320k',
            size: 'Saved',
            status: 'Skipped (Already on Device)',
            downloadedAt: 'Already Exists',
          };
          setCompletedDownloads((prev) => [skippedEntry, ...prev]);
          continue;
        }

        // Resolve stream and queue
        const tTaskId = 'dl-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        let tStreamUrl = null;
        let tBitrate = '320kbps';
        if (window.electronAPI?.searchJioSaavn) {
          try {
            const jioMatch = await window.electronAPI.searchJioSaavn(`${itemTitle} ${itemArtist}`);
            if (jioMatch && jioMatch.streamUrl) {
              tStreamUrl = jioMatch.streamUrl;
              tBitrate = jioMatch.bitrate || '320kbps';
            }
          } catch (e) {}
        }

        if (tStreamUrl) {
          const tCleanTitle = itemTitle.replace(/[\/\\?%*:|"<>]/g, '_');
          const tCleanArtist = (itemArtist && itemArtist !== 'Unknown Artist')
            ? itemArtist.replace(/[\/\\?%*:|"<>]/g, '_') + ' - '
            : '';
          const tDestinationPath = musicDir + '\\' + tCleanArtist + tCleanTitle + '.mp3';

          const tTask = {
            id: tTaskId,
            title: itemTitle,
            artist: itemArtist,
            album: resolvedTrack.title || 'Playlist',
            artworkUrl: itemCover,
            duration: Math.round((t.durationMs || 215000) / 1000),
            format: 'MP3 320k',
            size: 'Queued',
            speed: 'Starting...',
            progress: 5,
            status: 'downloading',
            streamUrl: tStreamUrl,
            destinationPath: tDestinationPath,
          };

          setActiveDownloads((prev) => [tTask, ...prev]);

          if (window.electronAPI?.startDownload) {
            window.electronAPI.startDownload({
              id: tTaskId,
              url: tStreamUrl,
              title: itemTitle,
              artist: itemArtist,
              album: resolvedTrack.title || 'Playlist',
              artworkUrl: itemCover,
              duration: tTask.duration,
              destinationPath: tDestinationPath,
              formatType: 'AUDIO',
              qualityLabel: tBitrate,
            }).catch(console.error);
          }
        }
      }
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
      destinationPath,
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
          destinationPath,
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
    setActiveDownloads((prev) => prev.filter((d) => d.id !== id));
    if (window.electronAPI?.cancelDownload) {
      window.electronAPI.cancelDownload(id);
    }
  };

  const handleDeleteDownload = (id) => {
    const item = completedDownloads.find((d) => d.id === id);
    if (item) {
      const filePath = item.destinationPath || item.filePath;
      setCompletedDownloads((prev) => prev.filter((d) => d.id !== id));
      setSongs((prev) => prev.filter((s) => s.id !== id && (!filePath || s.filePath !== filePath)));
      setTrash((prev) => [item, ...prev]);
    }
  };

  const handleClearCompleted = () => {
    setTrash((prev) => [...completedDownloads, ...prev]);
    setSongs((prev) => prev.filter((s) => !completedDownloads.some((d) => d.id === s.id || (d.destinationPath && d.destinationPath === s.filePath))));
    setCompletedDownloads([]);
  };

  const handleTrashSong = (track) => {
    const filePath = track.filePath || track.destinationPath;
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
    setCompletedDownloads((prev) => prev.filter((d) => d.id !== track.id && (!filePath || d.destinationPath !== filePath)));
    setTrash((prev) => [track, ...prev]);
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
      setDuration(audioRef.current.duration || 0);
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

  // Playback Controls with Real Audio Source Loading
  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setQueue((prev) => {
      if (!prev.find((t) => (t.id && t.id === track.id) || (t.filePath && t.filePath === track.filePath))) {
        return [...prev, track];
      }
      return prev;
    });

    let audioSrc = track.streamUrl;
    if (!audioSrc && track.filePath) {
      audioSrc = track.filePath.startsWith('http') || track.filePath.startsWith('file://')
        ? track.filePath
        : 'file:///' + track.filePath.replace(/\\/g, '/');
    }

    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsPlaying(true);
        });
    } else {
      setIsPlaying(true);
      setDuration(track.duration || 215);
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
        onEnded={handleEnded}
        onError={() => setIsPlaying(false)}
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
              overflowY: 'auto',
              minWidth: 0,
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
                onTrashSong={handleTrashSong}
                onPermanentDelete={handlePermanentDelete}
                onOpenFolder={handleOpenFolder}
                onUpdateSong={handleUpdateSong}
                onAddToPlaylist={handleAddTrackToPlaylist}
                downloadFolder={preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'}
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
                onStartDownload={handleStartDownload}
                onPauseAll={handlePauseAll}
                onResumeAll={handleResumeAll}
                onCancelDownload={handleCancelDownload}
                onClearCompleted={handleClearCompleted}
                onDeleteDownload={handleDeleteDownload}
                onPlayTrack={handlePlayTrack}
                onOpenFolder={handleOpenFolder}
                downloadFolder={preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'}
                onNavigateToHome={() => setActiveTab('home')}
                onNavigateToLibrary={() => setActiveTab('library')}
              />
            )}

            {activeTab === 'trash' && (
              <TrashTab
                trashItems={trash}
                onRestoreTrack={handleRestoreTrack}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                category={settingsCategory}
                onSelectCategory={setSettingsCategory}
                preferences={preferences}
                theme={theme}
                onToggleTheme={handleToggleTheme}
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
