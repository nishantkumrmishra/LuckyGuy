import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import HomeTab from './components/HomeTab';
import LibraryTab from './components/LibraryTab';
import VideoStreamingTab from './components/VideoStreamingTab';
import DownloadsTab from './components/DownloadsTab';
import PluginTabContainer from './components/PluginTabContainer';
import TelegramTab from './components/TelegramTab';
import TrashTab from './components/TrashTab';
import SettingsTab from './components/SettingsTab';
import LikedSongsTab from './components/LikedSongsTab';
import PlaylistsTab from './components/PlaylistsTab';
import SleepTimerModal from './components/SleepTimerModal';
import SetupWizard from './components/SetupWizard';
import QueueDrawer from './components/QueueDrawer';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { CustomIcon } from './components/DuoIcons';



const simplifyVideoTitle = (rawTitle, maxLength = 55) => {
  if (!rawTitle) return 'Video';
  let clean = rawTitle
    .replace(/[\/\\?%*:|"<>~#&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length > maxLength) {
    const truncated = clean.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    clean = (lastSpace > 25 ? truncated.substring(0, lastSpace) : truncated).trim();
  }
  return clean || 'Video';
};

const formatAudioSrc = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('file://')) return filePath;
  const normalized = filePath.split('\\').join('/');
  const segments = normalized.split('/').map((seg, i) => (i === 0 && seg.includes(':')) ? seg : encodeURIComponent(seg));
  return 'file:///' + segments.join('/');
};

// Helper: Universal track deduplication (by path, id, and normalized title+artist)
const deduplicateTracks = (trackList) => {
  if (!Array.isArray(trackList)) return [];
  const seenPaths = new Set();
  const seenKeys = new Set();
  const seenIds = new Set();
  const result = [];
  for (const t of trackList) {
    if (!t) continue;
    if (t.title === "4tHJc5agHg9LVsijAwtooy" || /^[a-zA-Z0-9]{20,}$/.test(t.title)) continue;

    const rawPath = (t.filePath || t.destinationPath || "").replace(/[\\/]+/g, "/").toLowerCase().trim();
    const idKey = t.id ? String(t.id).trim() : "";
    const titleKey = (t.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const artistKey = (t.artist && t.artist !== "Unknown Artist" && t.artist !== "Various Artists")
      ? (t.artist || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      : "";
    const songKey = `${titleKey}__${artistKey}`;

    if (rawPath && seenPaths.has(rawPath)) continue;
    if (idKey && seenIds.has(idKey)) continue;
    if (titleKey.length >= 2 && seenKeys.has(songKey)) continue;

    if (rawPath) seenPaths.add(rawPath);
    if (idKey) seenIds.add(idKey);
    if (titleKey.length >= 2) seenKeys.add(songKey);
    result.push(t);
  }
  return result;
};

const defaultTelegramExtension = {
  id: "luckyguy-ext-telegram",
  name: "Telegram",
  version: "1.0.0",
  type: "hybrid",
  rating: "all",
  description: "Download original high-speed videos, voice notes, photos, and media from Telegram channels, posts, and bots.",
  author: "LuckyGuy Community",
  category: "Video & Media Downloader",
  entry: "index.js",
  mediaTypes: ["video", "image", "audio", "document"],
  tab: {
    title: "Telegram",
    icon: "Send",
    url: "https://t.me/s/telegram",
    defaultUrl: "https://t.me/s/telegram",
    badge: "MEDIA",
    viewLayout: "grid",
    themeColor: "#229ED9"
  },
  settings: {
    title: "Telegram Settings",
    description: "Authenticate via Telegram Bot Token or configure public channel streaming and download directories.",
    fields: [
      {
        id: "botToken",
        label: "Telegram Bot Token",
        type: "password",
        placeholder: "123456789:ABCdefGhIJKlmNoPQRstuVWXyz",
        description: "Optional: Bot token from @BotFather to download files directly from bot chats or private channels"
      },
      {
        id: "defaultChannel",
        label: "Default Channel / Post Link",
        type: "text",
        placeholder: "https://t.me/s/telegram or @channelname",
        defaultValue: "https://t.me/s/telegram",
        description: "Public channel username or web preview link to index on startup"
      },
      {
        id: "mediaFilter",
        label: "Media Extraction Filter",
        type: "select",
        defaultValue: "all",
        options: [
          { label: "All Media (Videos, Photos & Audio)", value: "all" },
          { label: "Videos Only (MP4 HD)", value: "videos" },
          { label: "Photos & Wallpapers Only", value: "photos" }
        ],
        description: "Filter the types of media retrieved from channels"
      },
      {
        id: "videoQuality",
        label: "Video Resolution & Quality",
        type: "select",
        defaultValue: "1080p",
        options: [
          { label: "Original 1080p Full Quality", value: "1080p" },
          { label: "Optimized 720p HD", value: "720p" },
          { label: "Compressed 480p (Fast Download)", value: "480p" }
        ],
        description: "Preferred video download bitrate and resolution"
      },
      {
        id: "customFolder",
        label: "Dedicated Download Directory",
        type: "folder",
        placeholder: "Default Music/Videos folder",
        description: "Destination directory where Telegram videos and files are saved"
      },
      {
        id: "customCode",
        label: "Custom Webhook or Extractor Script (JavaScript)",
        type: "code",
        placeholder: "// Optional Telegram custom post parser or webhook hook\nfunction onMessage(msg) {\n  return msg;\n}",
        description: "Custom JavaScript hook for transforming Telegram payloads or injecting headers"
      }
    ]
  },
  capabilities: [
    "stream",
    "crawlPage",
    "download",
    "videoPlayer",
    "imageGallery"
  ],
  supportedUrls: [
    "*://t.me/*",
    "*://*.t.me/*",
    "*://telegram.me/*",
    "*://*.telegram.me/*",
    "*://api.telegram.org/*",
    "*://web.telegram.org/*",
    "*://cdn*.telesco.pe/*"
  ],
  domainAliases: [
    { from: "telegram.me", to: "t.me" }
  ],
  enabled: true,
  downloadUrl: "https://raw.githubusercontent.com/nishantkumrmishra/LuckyGuy--extensions/main/extensions/telegram/manifest.json",
  repoUrl: "https://github.com/nishantkumrmishra/LuckyGuy--extensions/tree/main/extensions/telegram"
};

const defaultYouTubeExtension = {
  id: "luckyguy-ext-youtube",
  name: "YouTube",
  version: "1.0.0",
  type: "hybrid",
  rating: "all",
  description: "High-speed YouTube video & audio streaming engine powered by yt-dlp.",
  author: "LuckyGuy Core",
  category: "Video & Media Downloader",
  entry: "index.js",
  mediaTypes: ["video", "audio"],
  capabilities: [
    "stream",
    "download",
    "metadata",
    "search",
    "videoPlayer"
  ],
  supportedUrls: [
    "*://*.youtube.com/*",
    "*://youtu.be/*"
  ],
  enabled: true
};

export default function App() {
  const downloadCompletionMap = useRef(new Map()).current;
  const isQueueCancelledRef = useRef(false);
  const cancelledTaskIdsRef = useRef(new Set());
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-active-tab') || 'home';
      if (saved === 'plugin-luckyguy-ext-telegraph') return 'plugin-luckyguy-ext-telegram';
      return saved;
    } catch {
      return 'home';
    }
  });
  const [settingsCategory, setSettingsCategory] = useState('downloads');

  // Dynamically load installed user/community extensions
  const [installedExtensions, setInstalledExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      const hadTelegraph = list.some(e => e.id === 'luckyguy-ext-telegraph');
      if (hadTelegraph) {
        list = list.filter(e => e.id !== 'luckyguy-ext-telegraph');
        if (!list.some(e => e.id === 'luckyguy-ext-telegram')) {
          list.push(defaultTelegramExtension);
        }
      }
      if (!list.some(e => e.id === 'luckyguy-ext-youtube')) {
        list.push(defaultYouTubeExtension);
      }
      try {
        localStorage.setItem('luckyguy-extensions', JSON.stringify(list));
      } catch (e) {}
      return list;
    } catch {
      return [];
    }
  });

  // Filter plugins that declare their own dedicated tab in sidebar
  const pluginTabs = installedExtensions.filter((ext) => ext.enabled !== false && ext.tab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pluginNavState, setPluginNavState] = useState(null);
  const [visitedPluginTabs, setVisitedPluginTabs] = useState(() => {
    const initial = new Set();
    try {
      const saved = localStorage.getItem('localguy-active-tab') || 'home';
      if (saved.startsWith('plugin-')) {
        initial.add(saved.replace('plugin-', ''));
      }
    } catch {}
    return initial;
  });

  useEffect(() => {
    if (activeTab.startsWith('plugin-')) {
      const pid = activeTab.replace('plugin-', '');
      setVisitedPluginTabs((prev) => {
        if (prev.has(pid)) return prev;
        const next = new Set(prev);
        next.add(pid);
        return next;
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeTab.startsWith('plugin-')) {
      setPluginNavState(null);
    }
  }, [activeTab]);

  // 1. Library Songs: ONLY downloaded music or scanned files
  const [songs, setSongs] = useState(() => {
    try {
      const saved = localStorage.getItem("localguy-songs");
      return saved ? deduplicateTracks(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  // 2. Downloads: Active tasks + Completed downloads
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [savedOnlineVideos, setSavedOnlineVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-saved-online-videos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveToVideos = useCallback((video) => {
    if (!video) return;
    setSavedOnlineVideos((prev) => {
      const exists = prev.some((v) => (v.id && v.id === video.id) || (v.url && v.url === video.url));
      let updated;
      if (exists) {
        updated = prev.filter((v) => (v.id ? v.id !== video.id : true) && (v.url ? v.url !== video.url : true));
      } else {
        const item = {
          id: video.id || 'online-' + Date.now(),
          title: video.title || 'Online Video',
          author: video.author || 'Web Stream',
          thumbnail: video.thumbnail || video.imageUrl || '',
          url: video.url || '',
          streamUrl: video.streamUrl || video.url || '',
          duration: video.duration || 'Stream',
          durationFormatted: video.duration || 'Online',
          isOnline: true,
          mediaType: 'video',
          formatType: 'VIDEO',
          quality: video.quality || '1080p Stream',
          savedAt: Date.now(),
        };
        updated = [item, ...prev];
      }
      try {
        localStorage.setItem('localguy-saved-online-videos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const handleRemoveOnlineVideo = useCallback((videoId) => {
    setSavedOnlineVideos((prev) => {
      const updated = prev.filter((v) => v.id !== videoId && v.url !== videoId);
      try {
        localStorage.setItem('localguy-saved-online-videos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const allVideos = useMemo(() => {
    return [...savedOnlineVideos, ...videos];
  }, [savedOnlineVideos, videos]);
  const [libraryMode, setLibraryMode] = useState('music'); // 'music' | 'videos'
  const [completedDownloads, setCompletedDownloads] = useState(() => {
    try {
      const saved = localStorage.getItem("localguy-downloads");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? deduplicateTracks(parsed.filter((t) => (t.filePath || t.destinationPath) && t.status !== "Skipped (Already on Device)"))
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
    const newPlaylist = {
      id: 'pl-' + Date.now(),
      name,
      description: description || '',
      icon: icon || '🎵',
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
    if (window.electronAPI?.createPlaylist) {
      window.electronAPI.createPlaylist(name, description);
    }
    return newPlaylist;
  };

  const handleDeletePlaylist = (playlistId) => {
    const updated = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updated);
    try {
      localStorage.setItem('localguy-playlists', JSON.stringify(updated));
    } catch (e) {}
    if (window.electronAPI?.deletePlaylist) {
      window.electronAPI.deletePlaylist(playlistId);
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
    }
    if (appearance.borderRadius) {
      root.style.setProperty('--radius-md', appearance.borderRadius);
    }
  }, [appearance]);

  // Audio Element Ref & Playback Speed
  const audioRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Player & Queue State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playQueue, setPlayQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);
  const [updateNotification, setUpdateNotification] = useState(null);

  // Liked Tracks
  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      const saved = localStorage.getItem('localguy-liked-tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isMusicTab = ['home', 'library', 'playlists', 'liked'].includes(activeTab);

  useEffect(() => {
    try {
      localStorage.setItem('localguy-active-tab', activeTab);
    } catch (e) {}
    if (activeTab === 'videos' || activeTab === 'library') {
      refreshVideos();
    }
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
    if (!window.electronAPI) return;
    if (window.electronAPI.savePreferences) {
      window.electronAPI.savePreferences(preferences);
    }
  }, [preferences]);

  // Real-time disk verification: Ensure library, downloads & trash only contain actual existing files
  useEffect(() => {
    if (!window.electronAPI) return;

    // 0. Sync videos from backend
    const refreshVideos = async () => {
      try {
        let list = null;
        if (window.electronAPI?.getVideos) {
          list = await window.electronAPI.getVideos();
        } else if (window.electronAPI?.getAdultVideos) {
          list = await window.electronAPI.getAdultVideos();
        }
        if (Array.isArray(list)) {
          setVideos(list);
        }
      } catch (e) {
        console.warn('Failed to load videos:', e);
      }
    };
    refreshVideos();

    // 1. Sync & verify backend library songs
    if (window.electronAPI.getSongs) {
      window.electronAPI.getSongs().then(async (loadedSongs) => {
        const validList = Array.isArray(loadedSongs) ? loadedSongs : [];
        if (validList.length > 0 && window.electronAPI.verifyFilesExist) {
          const existMap = await window.electronAPI.verifyFilesExist(validList.map(s => s.filePath).filter(Boolean));
          const actualSongs = validList.filter(s => s.filePath && existMap[s.filePath] === true);
          setSongs(deduplicateTracks(actualSongs));
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
    }

    // 3. Verify trash items
    if (window.electronAPI.verifyFilesExist) {
      const trashPaths = trash.map(t => t.filePath).filter(Boolean);
      if (trashPaths.length > 0) {
        window.electronAPI.verifyFilesExist(trashPaths).then((existMap) => {
          setTrash((prev) => prev.filter(t => t.filePath && existMap[t.filePath] === true));
        }).catch(console.error);
      } else if (trash.length > 0) {
        setTrash([]);
      }
    }

    // 4. Initial sync of playlists from disk
    if (window.electronAPI.getPlaylists) {
      window.electronAPI.getPlaylists().then((loadedPlaylists) => {
        if (Array.isArray(loadedPlaylists) && loadedPlaylists.length > 0) {
          setPlaylists(loadedPlaylists);
        }
      }).catch(console.error);
    }
  }, []);

  // Preferences sync
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

      const finalBytes = payload.totalBytes || payload.fileSize || 8.5 * 1024 * 1024;
      const formattedSize = (finalBytes / (1024 * 1024)).toFixed(1) + ' MB';
      const isVideo = payload.formatType === 'VIDEO' ||
        (payload.format && payload.format.includes('MP4')) ||
        (payload.filePath && /\.(mp4|mkv|webm|avi|mov)$/i.test(payload.filePath));

      const completed = {
        id: payload.id || 'completed-' + Date.now(),
        title: payload.title || (isVideo ? 'Downloaded Video' : 'Downloaded Audio'),
        artist: payload.artist || (isVideo ? 'Video Creator' : 'Unknown Artist'),
        album: payload.album || 'Downloaded Master',
        duration: payload.duration,
        artworkUrl: payload.artworkUrl,
        streamUrl: payload.streamUrl,
        filePath: payload.filePath,
        format: payload.format || (isVideo ? 'MP4 1080p' : 'MP3 320k'),
        formatType: isVideo ? 'VIDEO' : (payload.formatType || 'AUDIO'),
        mediaType: isVideo ? 'video' : (payload.mediaType || 'audio'),
        size: formattedSize,
        fileSize: finalBytes,
        downloadedAt: new Date().toLocaleDateString(),
      };
      setCompletedDownloads((prev) => [completed, ...prev]);

      // Only add to music songs list if this is NOT a video!
      if (!isVideo) {
        setSongs((prev) => {
          if (prev.some((s) => s.filePath === completed.filePath || s.id === completed.id)) return prev;
          return [completed, ...prev];
        });
      } else {
        refreshVideos();
      }
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
  const handleStartDownload = async (queryOrUrl, options = {}) => {
    const trimmed = (queryOrUrl || "").trim();
    if (!trimmed) return;

    // Direct routing for Video and Image downloads from plugins
    const isVideo = options.formatType === "VIDEO" || options.mediaType === "video" || (options.format && options.format.includes("MP4"));
    const isImage = options.formatType === "IMAGE" || options.mediaType === "image" || (options.format && options.format.includes("JPG"));
    const isFile = options.formatType === "FILE" || options.mediaType === "file";

    const isAdult = options.isAdult === true ||
      options.category === 'adult' ||
      (options.author && /pornhub/i.test(options.author)) ||
      (options.pluginId && /pornhub/i.test(options.pluginId)) ||
      (trimmed && (trimmed.includes('phncdn') || trimmed.includes('pornhub')));

    if (isVideo || isImage || isFile) {
      const taskId = options.id || ("dl-" + Date.now());
      const cleanTitle = isVideo ? simplifyVideoTitle(options.title) : (options.title || "media").replace(/[\/\\?%*:|"<>]/g, "_");
      const ext = isVideo ? ".mp4" : (isImage ? ".jpg" : ".bin");
      const quality = options.quality || options.qualityLabel || (isVideo ? "1080p HD" : "Original");

      // Custom folder or Adult/PornHub folder or Videos/Pictures folder
      let targetFolder = (isVideo && isAdult)
        ? "C:\\Users\\nishant\\Videos\\Adult\\PornHub"
        : isVideo
        ? "C:\\Users\\nishant\\Videos"
        : (isImage ? "C:\\Users\\nishant\\Pictures" : "C:\\Users\\nishant\\Downloads");
      if (options.customFolder && typeof options.customFolder === "string" && options.customFolder.trim()) {
        targetFolder = options.customFolder.trim();
      }

      const destinationPath = targetFolder + "\\" + cleanTitle + ext;

      const newTask = {
        id: taskId,
        title: options.title || cleanTitle,
        artist: options.author || (isVideo ? "Video Stream" : (isImage ? "Image Gallery" : "Telegram File")),
        album: quality,
        artworkUrl: options.thumbnail || "",
        duration: isVideo ? 180 : 0,
        format: isVideo ? `MP4 ${quality}` : (isImage ? `JPG ${quality}` : `File`),
        size: isVideo ? "75 MB" : (isImage ? "3.8 MB" : "15 MB"),
        speed: "Connecting...",
        progress: 10,
        status: "downloading",
        streamUrl: trimmed,
        destinationPath,
      };

      setActiveDownloads((prev) => [newTask, ...prev]);

      if (window.electronAPI?.startDownload) {
        try {
          await window.electronAPI.startDownload({
            id: taskId,
            url: trimmed,
            title: newTask.title,
            artist: newTask.artist,
            album: newTask.album,
            duration: newTask.duration,
            destinationPath,
            customFolder: options.customFolder || null,
            formatType: isVideo ? "VIDEO" : (isImage ? "IMAGE" : "FILE"),
            qualityLabel: quality,
            isAdult,
            artworkUrl: options.thumbnail || newTask.artworkUrl || '',
          });
        } catch (e) {
          console.error("Plugin media download error:", e);
        }
      }
      return;
    }

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
          qualityLabel: '320kbps',
        });
      } catch (err) {
        console.error('startDownload error:', err);
      }
    }
  };

  const handlePauseDownload = (taskId) => {
    setActiveDownloads((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: 'paused' } : item))
    );
    if (window.electronAPI?.pauseDownload) {
      window.electronAPI.pauseDownload(taskId);
    }
  };

  const handleResumeDownload = (taskId) => {
    setActiveDownloads((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: 'downloading' } : item))
    );
    if (window.electronAPI?.resumeDownload) {
      window.electronAPI.resumeDownload(taskId);
    }
  };

  const handlePauseAll = () => {
    setActiveDownloads((prev) => prev.map((item) => ({ ...item, status: 'paused' })));
    if (window.electronAPI?.pauseAllDownloads) {
      window.electronAPI.pauseAllDownloads();
    }
  };

  const handleResumeAll = () => {
    setActiveDownloads((prev) => prev.map((item) => ({ ...item, status: 'downloading' })));
    if (window.electronAPI?.resumeAllDownloads) {
      window.electronAPI.resumeAllDownloads();
    }
  };

  const handleCancelDownload = (taskId) => {
    cancelledTaskIdsRef.current.add(taskId);
    if (downloadCompletionMap.has(taskId)) {
      const resolve = downloadCompletionMap.get(taskId);
      downloadCompletionMap.delete(taskId);
      resolve(false);
    }
    setActiveDownloads((prev) => prev.filter((item) => item.id !== taskId));
    if (window.electronAPI?.cancelDownload) {
      window.electronAPI.cancelDownload(taskId);
    }
  };

  const handleCancelAll = () => {
    isQueueCancelledRef.current = true;
    for (const [id, resolve] of downloadCompletionMap.entries()) {
      resolve(false);
    }
    downloadCompletionMap.clear();
    setActiveDownloads([]);
    if (window.electronAPI?.cancelAllDownloads) {
      window.electronAPI.cancelAllDownloads();
    }
  };

  const handleClearCompleted = () => {
    setCompletedDownloads([]);
  };

  const handleDeleteDownload = (taskId) => {
    const target = completedDownloads.find((d) => d.id === taskId);
    setCompletedDownloads((prev) => prev.filter((item) => item.id !== taskId));
    if (target && target.filePath) {
      setSongs((prev) => prev.filter((s) => s.filePath !== target.filePath && s.id !== target.id));
      if (window.electronAPI?.trashSong) {
        window.electronAPI.trashSong(target.id, target.filePath);
      }
    }
  };

  // Trash & Library Management
  const handleTrashSong = async (songId, filePath) => {
    const songToTrash = songs.find((s) => s.id === songId || s.filePath === filePath);
    if (songToTrash) {
      setTrash((prev) => [songToTrash, ...prev]);
    }
    setSongs((prev) => prev.filter((s) => s.id !== songId && s.filePath !== filePath));
    if (window.electronAPI?.trashSong) {
      await window.electronAPI.trashSong(songId, filePath);
    }
  };

  const handlePermanentDelete = async (songId, filePath) => {
    setTrash((prev) => prev.filter((s) => s.id !== songId && s.filePath !== filePath));
    if (window.electronAPI?.deleteSong) {
      await window.electronAPI.deleteSong(songId, filePath);
    }
  };

  const handleRestoreFromTrash = (trashId) => {
    const restored = trash.find((item) => item.id === trashId);
    if (restored) {
      setTrash((prev) => prev.filter((item) => item.id !== trashId));
      setSongs((prev) => [restored, ...prev]);
    }
  };

  const handleEmptyTrash = () => {
    setTrash([]);
  };

  const handleUpdateSong = (id, updates) => {
    setSongs((prev) => prev.map((s) => (s.id === id || s.filePath === id ? { ...s, ...updates } : s)));
    try {
      const saved = JSON.parse(localStorage.getItem('localguy-songs') || '[]');
      const updated = saved.map((s) => (s.id === id || s.filePath === id ? { ...s, ...updates } : s));
      localStorage.setItem('localguy-songs', JSON.stringify(updated));
    } catch (e) {}
    if (window.electronAPI?.updateSong) {
      window.electronAPI.updateSong(id, updates);
    }
  };

  const handleOpenFolder = (folderPath) => {
    if (window.electronAPI?.openInFolder) {
      window.electronAPI.openInFolder(folderPath);
    }
  };

  // Playback logic
  const refreshVideos = async () => {
    try {
      let list = null;
      if (window.electronAPI?.getVideos) {
        list = await window.electronAPI.getVideos();
      } else if (window.electronAPI?.getAdultVideos) {
        list = await window.electronAPI.getAdultVideos();
      }
      if (Array.isArray(list)) {
        setVideos(list);
      }
    } catch (e) {
      console.warn('Failed to load videos:', e);
    }
  };

  const handlePlayVideo = (video) => {
    setIsPlaying(false);
    setActiveVideo(video);
    setActiveTab('videos');
  };

  const handleDeleteVideo = async (video) => {
    if (activeVideo?.id === video.id) {
      setActiveVideo(null);
    }
    if (video.isOnline) {
      handleRemoveOnlineVideo(video.id);
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== video.id && v.filePath !== video.filePath));
    if (video.filePath) {
      if (window.electronAPI?.deleteVideo) {
        await window.electronAPI.deleteVideo(video.filePath);
      } else if (window.electronAPI?.deleteAdultVideo) {
        await window.electronAPI.deleteAdultVideo(video.filePath);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
    } else {
      handleNext();
    }
  };

  const handlePlayTrack = async (track, newQueue = null) => {
    if (!track) return;

    const isVideo = track.formatType === 'VIDEO' || track.mediaType === 'video' || track.isOnline || Boolean(track.url && /view_video|pornhub|youtube|video/i.test(track.url)) ||
      (track.format && track.format.toUpperCase().includes('MP4')) ||
      (track.filePath && /\.(mp4|mkv|webm|avi|mov)$/i.test(track.filePath)) ||
      (track.destinationPath && /\.(mp4|mkv|webm|avi|mov)$/i.test(track.destinationPath));

    if (isVideo) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      handlePlayVideo(track);
      return;
    }

    // Audio song -> standard music player playback
    let resolvedPath = track.filePath || track.destinationPath;
    if (window.electronAPI?.resolveAudioPath && (resolvedPath || track.title)) {
      try {
        const actual = await window.electronAPI.resolveAudioPath(resolvedPath, track.title, track.artist);
        if (actual) resolvedPath = actual;
      } catch (e) {}
    }

    const activeTrack = { ...track, filePath: resolvedPath || track.filePath };
    setCurrentTrack(activeTrack);

    const queueList = newQueue || (songs.length > 0 ? songs : [activeTrack]);
    setPlayQueue(queueList);
    const idx = queueList.findIndex((t) => (t.id && t.id === track.id) || (t.filePath && t.filePath === activeTrack.filePath));
    setQueueIndex(idx !== -1 ? idx : 0);

    const audioSrc = activeTrack.streamUrl || formatAudioSrc(resolvedPath);
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackSpeed || 1.0;
      audioRef.current.volume = isMuted ? 0 : (volume ?? 0.8);
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

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleResume = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.warn);
    } else if (currentTrack) {
      handlePlayTrack(currentTrack);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) handlePause();
    else handleResume();
  };

  const handleNext = () => {
    if (playQueue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= playQueue.length) {
      if (repeatMode === 'all') nextIdx = 0;
      else return;
    }
    handlePlayTrack(playQueue[nextIdx], playQueue);
  };

  const handlePrevious = () => {
    if (playQueue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') prevIdx = playQueue.length - 1;
      else return;
    }
    handlePlayTrack(playQueue[prevIdx], playQueue);
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = false;
    }
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  const handleToggleLike = (track) => {
    setLikedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id || t.filePath === track.filePath);
      const updated = exists
        ? prev.filter((t) => t.id !== track.id && t.filePath !== track.filePath)
        : [...prev, track];
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

        // 1. If video player is active, toggle video element directly
        if (activeVideo) {
          const videoEl = document.querySelector('video');
          if (videoEl) {
            if (videoEl.paused) {
              videoEl.play().catch(console.warn);
            } else {
              videoEl.pause();
            }
            return;
          }
        }

        // 2. If music player has a track, toggle audio playback
        if (currentTrack || (audioRef.current && audioRef.current.src)) {
          handleTogglePlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, currentTrack, isPlaying, handleTogglePlay]);

  // Update notification dismissal
  const handleDismissUpdate = () => {
    setUpdateNotification(null);
  };

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          activeDownloadCount={activeDownloads.length}
          videoCount={videos.length}
          playlists={playlists}
          pluginTabs={pluginTabs}
          settingsCategory={settingsCategory}
          setSettingsCategory={setSettingsCategory}
        />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TitleBar
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          libraryTracks={songs}
          onPlayTrack={handlePlayTrack}
          onNavigateHome={() => setActiveTab('home')}
          activeTab={activeTab}
          isPluginTab={activeTab.startsWith('plugin-')}
          pluginNav={pluginNavState}
        />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          {/* Main Views Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
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

            {activeTab === 'videos' && (
              <VideoStreamingTab
                videos={allVideos}
                activeVideo={activeVideo}
                onPlayVideo={handlePlayVideo}
                onClosePlayer={() => setActiveVideo(null)}
                onDeleteVideo={handleDeleteVideo}
                onRefreshVideos={refreshVideos}
                onOpenFolder={handleOpenFolder}
                downloadFolder="C:\\Users\\nishant\\Videos"
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab
                songs={songs}
                videos={allVideos}
                activeVideo={activeVideo}
                onPlayVideo={handlePlayVideo}
                onClosePlayer={() => setActiveVideo(null)}
                onDeleteVideo={handleDeleteVideo}
                onRefreshVideos={refreshVideos}
                libraryMode={libraryMode}
                onSetLibraryMode={setLibraryMode}
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
              />
            )}

            {activeTab === 'liked' && (
              <LikedSongsTab
                likedTracks={likedTracks}
                onPlaySong={handlePlayTrack}
                onToggleLike={handleToggleLike}
                onTrashSong={handleTrashSong}
                onAddToPlaylist={handleAddTrackToPlaylist}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onBack={() => setActiveTab('library')}
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

            {/* DYNAMIC PLUGIN-DECLARED TABS (Preserved in DOM so playing video & scroll position persist across tab switches) */}
            {pluginTabs.map((matchedPlugin) => {
              const isCurrent = activeTab === `plugin-${matchedPlugin.id}`;
              if (!visitedPluginTabs.has(matchedPlugin.id) && !isCurrent) return null;
              return (
                <div
                  key={matchedPlugin.id}
                  style={{
                    display: isCurrent ? 'flex' : 'none',
                    flex: 1,
                    height: '100%',
                    width: '100%',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {matchedPlugin.id?.includes('telegram') ? (
                    <TelegramTab
                      plugin={matchedPlugin}
                      onStartDownload={handleStartDownload}
                      preferences={preferences}
                      onOpenFolder={handleOpenFolder}
                    />
                  ) : (
                    <PluginTabContainer
                      plugin={matchedPlugin}
                      onStartDownload={handleStartDownload}
                      preferences={preferences}
                      onOpenFolder={handleOpenFolder}
                      playlists={playlists}
                      onAddToPlaylist={handleAddTrackToPlaylist}
                      onCreatePlaylist={handleCreatePlaylist}
                      savedOnlineVideos={savedOnlineVideos}
                      onSaveToVideos={handleSaveToVideos}
                      onNavigateHome={() => setActiveTab('home')}
                    />
                  )}
                </div>
              );
            })}

            {activeTab === 'settings' && (
              <SettingsTab
                category={settingsCategory}
                onSelectCategory={setSettingsCategory}
                preferences={preferences}
                theme={theme}
                setTheme={setTheme}
                appearance={appearance}
                setAppearance={setAppearance}
                onSavePreferences={(newPrefs) => {
                  setPreferences((prev) => ({ ...prev, ...newPrefs }));
                  if (window.electronAPI?.savePreferences) {
                    window.electronAPI.savePreferences(newPrefs);
                  }
                }}
                onUpdateExtensions={setInstalledExtensions}
                onOpenFolder={handleOpenFolder}
                onClearAllData={() => {
                  setSongs([]);
                  setCompletedDownloads([]);
                  setTrash([]);
                  setPlaylists([]);
                  localStorage.clear();
                }}
              />
            )}

            {activeTab === 'trash' && (
              <TrashTab
                trash={trash}
                onRestoreSong={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
                onBack={() => setActiveTab('library')}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}
          </div>

          {/* Persistent Player Bar at Bottom (Never on video/plugin/telegram tabs, only when track is active) */}
          {/* Hidden Native Audio Element for zero-delay hardware-accelerated playback */}
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
              console.warn('Audio element error:', e);
              setIsPlaying(false);
            }}
          />

          {/* Persistent Player Bar at Bottom (Never on video/plugin/telegram tabs, only when track is active) */}
          {!activeTab.startsWith('plugin-') && activeTab !== 'telegram' && activeTab !== 'videos' && activeTab !== 'adult' && currentTrack && (
            <PlayerBar
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={handleSeek}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              isShuffle={isShuffle}
              onToggleShuffle={() => setIsShuffle((prev) => !prev)}
              repeatMode={repeatMode}
              onToggleRepeat={() => {
                setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
              }}
              playbackSpeed={playbackSpeed}
              onChangePlaybackSpeed={(speed) => {
                setPlaybackSpeed(speed);
                if (audioRef.current) audioRef.current.playbackRate = speed;
              }}
              isLiked={likedTracks.some(
                (t) => currentTrack && (t.id === currentTrack.id || t.filePath === currentTrack.filePath)
              )}
              onToggleLike={() => currentTrack && handleToggleLike(currentTrack)}
              onToggleQueue={() => setShowQueueDrawer((prev) => !prev)}
              isQueueOpen={showQueueDrawer}
              onOpenSleepTimer={() => setShowSleepTimerModal(true)}
              sleepTimerRemaining={sleepTimerRemaining}
            />
          )}
        </main>
      </div>

      {/* Queue Drawer */}
      {showQueueDrawer && (
        <QueueDrawer
          queue={playQueue}
          currentIndex={queueIndex}
          onSelectTrack={(idx) => {
            setQueueIndex(idx);
            setCurrentTrack(playQueue[idx]);
            setIsPlaying(true);
          }}
          onClose={() => setShowQueueDrawer(false)}
        />
      )}

      {/* Sleep Timer Modal */}
      {showSleepTimerModal && (
        <SleepTimerModal
          isOpen={showSleepTimerModal}
          onClose={() => setShowSleepTimerModal(false)}
          onSetTimer={(seconds) => setSleepTimerRemaining(seconds)}
          currentRemaining={sleepTimerRemaining}
        />
      )}
    </div>
  );
}
