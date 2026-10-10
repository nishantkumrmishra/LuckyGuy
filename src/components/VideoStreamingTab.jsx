import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import CustomVideoPlayer from './CustomVideoPlayer';
import {
  Film,
  Play,
  Search,
  FolderOpen,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Clock,
  HardDrive,
  CheckCircle2,
  X,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Eye,
  Video,
  Grid,
  LayoutGrid,
  LayoutList,
  Folder,
  FolderPlus,
  ListPlus,
  Plus,
  Globe,
  ChevronRight
} from 'lucide-react';
import { DuoVideo, DuoPornhub, DuoYoutube } from './DuoIcons';


const VideoSourceBadge = ({ source, isCompact = false }) => {
  const iconSize = isCompact ? 13 : 15;
  let icon = null;
  let label = source?.name || 'Video';

  if (source?.id === 'pornhub') {
    icon = <DuoPornhub size={iconSize} active={true} />;
    label = 'Pornhub';
  } else if (source?.id === 'youtube') {
    icon = <DuoYoutube size={iconSize} active={true} />;
    label = 'YouTube';
  } else if (source?.id === 'telegram') {
    icon = <Send size={iconSize - 2} color="#0ea5e9" />;
    label = 'Telegram';
  } else if (source?.id === 'online') {
    icon = <Globe size={iconSize - 2} color="var(--primary, #7c5cbf)" />;
    label = 'Stream';
  } else {
    icon = <Film size={iconSize - 2} color="#10b981" />;
    label = 'Video';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isCompact ? '2px 6px' : '3px 8px',
        borderRadius: '5px',
        backgroundColor: 'rgba(20, 20, 26, 0.82)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
        zIndex: 2,
      }}
    >
      {icon}
      <span
        style={{
          fontSize: isCompact ? '9.5px' : '10.5px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.2px',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default function VideoStreamingTab({
  videos = [],
  activeVideo = null,
  onPlayVideo,
  onClosePlayer,
  onDeleteVideo,
  onRefreshVideos,
  onOpenFolder,
  downloadFolder = 'C:\\Users\\nishant\\Videos',
  playlists = [],
  onCreatePlaylist,
  onAddToPlaylist,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [isSearching, setIsSearching] = useState(false);

  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'size'
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'folders' | 'pornhub' | 'youtube' | 'telegram' | 'online' | 'downloaded'
  const [selectedFolderId, setSelectedFolderId] = useState(null); // When browsing inside a folder

  // View Mode: 'grid' (Default Large), 'grid-compact' (Compact / Small Size), 'list' (Table List View)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('luckyguy-video-view-mode') || 'grid-compact';
    } catch {
      return 'grid-compact';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('luckyguy-video-view-mode', mode);
    } catch (e) {}
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Playlist Assignment Modal state
  const [playlistModalVideo, setPlaylistModalVideo] = useState(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [playlistNotice, setPlaylistNotice] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, video }
  const [isPlaylistSubmenuOpen, setIsPlaylistSubmenuOpen] = useState(false);

  const handleOpenContextMenu = (e, video) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 230;
    const menuHeight = 240;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
    setContextMenu({ x, y, video });
    setIsPlaylistSubmenuOpen(false);
  };

  useEffect(() => {
    const handleClose = () => {
      if (contextMenu) setContextMenu(null);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  // Auto-scan / refresh video list on component mount
  useEffect(() => {
    if (onRefreshVideos) {
      onRefreshVideos();
    }
  }, []);

  // Search animation feedback
  useEffect(() => {
    if (searchQuery !== deferredSearch) {
      setIsSearching(true);
    } else {
      const t = setTimeout(() => setIsSearching(false), 200);
      return () => clearTimeout(t);
    }
  }, [searchQuery, deferredSearch]);

  // Helper: Classify Video Source & Brand Metadata
  const getVideoSource = (v) => {
    if (!v) return { id: 'local', name: 'General Videos', icon: '📁', color: '#10b981', tag: 'LOCAL' };
    const path = (v.filePath || '').toLowerCase();
    const url = (v.url || '').toLowerCase();
    const auth = (v.author || v.artist || '').toLowerCase();
    const id = String(v.id || '').toLowerCase();

    if (path.includes('pornhub') || url.includes('pornhub') || auth.includes('pornhub') || id.startsWith('ph-')) {
      return { id: 'pornhub', name: 'Pornhub Videos', icon: '🔞', color: '#f59e0b', tag: 'PORNHUB' };
    }
    if (path.includes('youtube') || url.includes('youtube') || url.includes('youtu.be') || auth.includes('youtube') || id.startsWith('yt-')) {
      return { id: 'youtube', name: 'YouTube Videos', icon: '▶️', color: '#ef4444', tag: 'YOUTUBE' };
    }
    if (path.includes('telegram') || url.includes('t.me') || auth.includes('telegram') || id.startsWith('tg-')) {
      return { id: 'telegram', name: 'Telegram Media', icon: '✈️', color: '#0ea5e9', tag: 'TELEGRAM' };
    }
    if (v.isOnline || (v.streamUrl && !v.filePath)) {
      return { id: 'online', name: 'Saved Web Streams', icon: '🌐', color: '#7c5cbf', tag: 'STREAM' };
    }
    return { id: 'local', name: 'General Videos', icon: '📁', color: '#10b981', tag: 'LOCAL' };
  };

  // Group videos into Folders & Collections
  const sourceFolders = useMemo(() => {
    const map = {
      pornhub: { id: 'pornhub', name: 'Pornhub Videos', icon: '🔞', color: '#f59e0b', tag: 'PORNHUB', items: [] },
      youtube: { id: 'youtube', name: 'YouTube Videos', icon: '▶️', color: '#ef4444', tag: 'YOUTUBE', items: [] },
      telegram: { id: 'telegram', name: 'Telegram Media', icon: '✈️', color: '#0ea5e9', tag: 'TELEGRAM', items: [] },
      online: { id: 'online', name: 'Saved Web Streams', icon: '🌐', color: '#7c5cbf', tag: 'STREAM', items: [] },
      local: { id: 'local', name: 'General Downloads', icon: '📁', color: '#10b981', tag: 'LOCAL', items: [] },
    };

    for (const v of videos) {
      const src = getVideoSource(v);
      if (map[src.id]) {
        map[src.id].items.push(v);
      } else {
        map.local.items.push(v);
      }
    }

    const customPlaylistFolders = (playlists || []).map((pl) => {
      const videoItems = (pl.tracks || []).filter(
        (t) =>
          t.formatType === 'VIDEO' ||
          t.mediaType === 'video' ||
          (t.filePath && /\.(mp4|mkv|webm|avi|mov)$/i.test(t.filePath))
      );
      return {
        id: `playlist-${pl.id}`,
        name: pl.name,
        icon: pl.icon || '📑',
        color: 'var(--primary, #7c5cbf)',
        tag: 'PLAYLIST',
        items: videoItems,
        isPlaylist: true,
        playlistId: pl.id,
      };
    });

    return [
      ...Object.values(map).filter((g) => g.items.length > 0),
      ...customPlaylistFolders,
    ];
  }, [videos, playlists]);

  // Active folder object if one is opened
  const activeFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return sourceFolders.find((f) => f.id === selectedFolderId) || null;
  }, [selectedFolderId, sourceFolders]);

  // Total downloaded size calculation
  const totalSizeBytes = useMemo(() => {
    return videos.reduce((acc, v) => acc + (v.fileSize || 0), 0);
  }, [videos]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
    return mb.toFixed(1) + ' MB';
  };

  // Base list depending on folder or source filter
  const baseVideoList = useMemo(() => {
    if (activeFolder) {
      return activeFolder.items;
    }
    if (sourceFilter === 'pornhub') {
      return videos.filter((v) => getVideoSource(v).id === 'pornhub');
    }
    if (sourceFilter === 'youtube') {
      return videos.filter((v) => getVideoSource(v).id === 'youtube');
    }
    if (sourceFilter === 'telegram') {
      return videos.filter((v) => getVideoSource(v).id === 'telegram');
    }
    if (sourceFilter === 'online') {
      return videos.filter((v) => v.isOnline || (v.streamUrl && !v.filePath));
    }
    if (sourceFilter === 'downloaded') {
      return videos.filter((v) => !v.isOnline && v.filePath);
    }
    return videos;
  }, [activeFolder, sourceFilter, videos]);

  // Fast tokenized filtering and sorting
  const filteredVideos = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return baseVideoList
      .filter((v) => {
        if (!q) return true;
        return (
          v.title?.toLowerCase().includes(q) ||
          v.artist?.toLowerCase().includes(q) ||
          v.author?.toLowerCase().includes(q) ||
          v.filePath?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
        return (b.dateModified || b.createdAt || 0) - (a.dateModified || a.createdAt || 0);
      });
  }, [baseVideoList, deferredSearch, sortBy]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshVideos) {
      await onRefreshVideos();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAddVideoToPlaylist = (plId, vid) => {
    if (!onAddToPlaylist || !vid) return;
    const trackPayload = {
      id: vid.id || 'vid-' + Date.now(),
      title: vid.title,
      artist: vid.author || vid.artist || 'Video Creator',
      author: vid.author || vid.artist || 'Video Creator',
      duration: vid.duration || 180,
      durationFormatted: vid.durationFormatted || 'Video',
      filePath: vid.filePath,
      streamUrl: vid.streamUrl,
      thumbnail: vid.thumbnail || vid.artworkUrl,
      artworkUrl: vid.thumbnail || vid.artworkUrl,
      formatType: 'VIDEO',
      mediaType: 'video',
    };
    onAddToPlaylist(plId, trackPayload);
    const targetPl = playlists.find((p) => p.id === plId);
    setPlaylistNotice(`Added to "${targetPl?.name || 'Playlist'}"!`);
    setTimeout(() => {
      setPlaylistNotice('');
      setPlaylistModalVideo(null);
    }, 1500);
  };

  const handleCreateAndAdd = (e) => {
    e?.preventDefault();
    if (!newPlaylistTitle.trim() || !onCreatePlaylist || !playlistModalVideo) return;
    const newPl = onCreatePlaylist(newPlaylistTitle.trim(), 'Video Playlist', '🎬');
    setNewPlaylistTitle('');
    if (newPl?.id) {
      handleAddVideoToPlaylist(newPl.id, playlistModalVideo);
    }
  };

  const counts = useMemo(() => {
    return {
      pornhub: videos.filter((v) => getVideoSource(v).id === 'pornhub').length,
      youtube: videos.filter((v) => getVideoSource(v).id === 'youtube').length,
      telegram: videos.filter((v) => getVideoSource(v).id === 'telegram').length,
      online: videos.filter((v) => v.isOnline || (v.streamUrl && !v.filePath)).length,
      downloaded: videos.filter((v) => !v.isOnline && v.filePath).length,
    };
  }, [videos]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main, #f8fafc)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
      }}
    >
      {/* Active Theater Player Mode */}
      {activeVideo ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClosePlayer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Video Library</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPlaylistModalVideo(activeVideo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <ListPlus size={14} color="var(--primary, #7c5cbf)" />
                <span>Add to Playlist</span>
              </button>

              {activeVideo.filePath && (
                <button
                  onClick={() => onOpenFolder && onOpenFolder(activeVideo.filePath)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <FolderOpen size={14} />
                  <span>Show in Explorer</span>
                </button>
              )}
            </div>
          </div>

          <CustomVideoPlayer video={activeVideo} onBack={onClosePlayer} initialQuality="1080p" />

          <div style={{ marginTop: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {activeVideo.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{activeVideo.author || activeVideo.artist || 'Downloaded Video'}</span>
              <span>•</span>
              <span>{formatFileSize(activeVideo.fileSize)}</span>
              {activeVideo.durationFormatted && (
                <>
                  <span>•</span>
                  <span>{activeVideo.durationFormatted}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Video Library Dashboard */
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DuoVideo size={24} active={true} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Video Library</h1>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Organized videos, streaming collections, and adult media ({videos.length} videos • {formatFileSize(totalSizeBytes)})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleManualRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Scanning...' : 'Scan / Refresh'}</span>
              </button>

              <button
                onClick={() => onOpenFolder && onOpenFolder(downloadFolder)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={14} />
                <span>Open Videos Folder</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & Size Differentiator Controls (Exact Red Marked Area) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {/* Left: Source & Folder Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-card)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSourceFilter('all');
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'all' && !selectedFolderId ? 'var(--primary, #7c5cbf)' : 'transparent',
                    color: sourceFilter === 'all' && !selectedFolderId ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Videos ({videos.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSourceFilter('folders');
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'folders' && !selectedFolderId ? 'var(--primary, #7c5cbf)' : 'transparent',
                    color: sourceFilter === 'folders' && !selectedFolderId ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Folder size={13} />
                  <span>Folders & Playlists ({sourceFolders.length})</span>
                </button>

                {counts.pornhub > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderId(null);
                      setSourceFilter('pornhub');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: sourceFilter === 'pornhub' ? '#f59e0b' : 'transparent',
                      color: sourceFilter === 'pornhub' ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    🔞 Pornhub ({counts.pornhub})
                  </button>
                )}

                {counts.youtube > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderId(null);
                      setSourceFilter('youtube');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: sourceFilter === 'youtube' ? '#ef4444' : 'transparent',
                      color: sourceFilter === 'youtube' ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ▶️ YouTube ({counts.youtube})
                  </button>
                )}

                {counts.telegram > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderId(null);
                      setSourceFilter('telegram');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: sourceFilter === 'telegram' ? '#0ea5e9' : 'transparent',
                      color: sourceFilter === 'telegram' ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ✈️ Telegram ({counts.telegram})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSourceFilter('online');
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'online' ? 'var(--primary, #7c5cbf)' : 'transparent',
                    color: sourceFilter === 'online' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Online Stream ({counts.online})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSourceFilter('downloaded');
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sourceFilter === 'downloaded' ? 'var(--primary, #7c5cbf)' : 'transparent',
                    color: sourceFilter === 'downloaded' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Downloaded ({counts.downloaded})
                </button>
              </div>
            </div>

            {/* Right: SIZE DIFFERENTIATOR & LAYOUT SWITCHER (Exact Location Marked in Red) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'var(--bg-card)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
              }}
              title="Layout & Card Size Differentiator"
            >
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: viewMode === 'grid' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Default Grid (Comfortable Size)"
              >
                <Grid size={14} />
                <span>Default</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('grid-compact')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid-compact' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: viewMode === 'grid-compact' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: viewMode === 'grid-compact' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Compact Grid (Smaller Size Cards)"
              >
                <LayoutGrid size={14} />
                <span>Compact</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: viewMode === 'list' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="List View (Table Layout)"
              >
                <LayoutList size={14} />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Search, Loading Bar, & Sorting Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                padding: '0 12px',
                height: '38px',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder={activeFolder ? `Search in ${activeFolder.name}...` : 'Search videos by title or creator...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}

              {/* Seamless, Transparent Progress Bar Under Search Input */}
              {isSearching && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'rgba(124, 92, 191, 0.12)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '40%',
                      background: 'linear-gradient(90deg, transparent, var(--primary, #7c5cbf), #38bdf8, transparent)',
                      animation: 'titlebarPulse 0.8s infinite ease-in-out',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="recent">Recently Added</option>
                <option value="title">Title (A-Z)</option>
                <option value="size">File Size (Largest)</option>
              </select>
            </div>
          </div>

          {/* BROWSE FOLDERS VIEW (When Folders View is active and no specific folder is opened) */}
          {sourceFilter === 'folders' && !selectedFolderId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Video Folders & Playlists ({sourceFolders.length})
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Click any folder to view its videos
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '16px',
                }}
              >
                {sourceFolders.map((folder) => {
                  const sampleThumbs = folder.items.slice(0, 4).map((i) => i.thumbnail || i.artworkUrl).filter(Boolean);
                  const folderSize = folder.items.reduce((acc, v) => acc + (v.fileSize || 0), 0);

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                      className="clean-video-card"
                    >
                      {/* Folder Cover Composite */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          display: 'grid',
                          gridTemplateColumns: sampleThumbs.length > 1 ? '1fr 1fr' : '1fr',
                          gridTemplateRows: sampleThumbs.length > 2 ? '1fr 1fr' : '1fr',
                          gap: '2px',
                          position: 'relative',
                        }}
                      >
                        {sampleThumbs.length > 0 ? (
                          sampleThumbs.map((thumb, idx) => (
                            <img
                              key={idx}
                              src={thumb}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ))
                        ) : (
                          <div
                            style={{
                              gridColumn: '1 / -1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                            }}
                          >
                            {folder.icon}
                          </div>
                        )}

                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                          }}
                        >
                          {folder.tag}
                        </div>
                      </div>

                      {/* Folder Title & Details */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{folder.icon}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {folder.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {folder.items.length} {folder.items.length === 1 ? 'video' : 'videos'} • {formatFileSize(folderSize)}
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={18} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ACTIVE VIDEOS DISPLAY (Grid / Compact Grid / List) */
            <div>
              {/* If browsing inside a folder, show breadcrumb back button */}
              {activeFolder && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to All Folders</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '16px' }}>{activeFolder.icon}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{activeFolder.name}</strong>
                    <span>({filteredVideos.length} videos)</span>
                  </div>
                </div>
              )}

              {filteredVideos.length === 0 ? (
                <div
                  style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-medium)',
                  }}
                >
                  <Film size={40} color="var(--text-muted)" />
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>No videos found</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: 0 }}>
                    {searchQuery
                      ? `No video matching "${searchQuery}" was found.`
                      : 'No videos available in this category. Download media or save streams to populate this view.'}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                /* 1. LIST VIEW (Sleek Rows) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredVideos.map((video) => {
                    const src = getVideoSource(video);
                    return (
                      <div
                        key={video.id || video.filePath}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '10px',
                          border: '1px solid var(--border-medium)',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        }}
                        className="clean-video-card"
                      >
                        {/* List Thumbnail */}
                        <div
                          onClick={() => onPlayVideo(video)}
                          style={{
                            position: 'relative',
                            width: '110px',
                            height: '62px',
                            borderRadius: '6px',
                            backgroundColor: '#111',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {video.thumbnail || video.artworkUrl ? (
                            <img
                              src={video.thumbnail || video.artworkUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                              <Film size={20} />
                            </div>
                          )}

                          {video.durationFormatted && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '3px',
                                right: '3px',
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 4px',
                                borderRadius: '3px',
                              }}
                            >
                              {video.durationFormatted}
                            </span>
                          )}

                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.15s ease',
                            }}
                            className="list-play-overlay"
                          >
                            <Play size={16} fill="#fff" color="#fff" />
                          </div>
                        </div>

                        {/* Title & Metadata */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div
                            onClick={() => onPlayVideo(video)}
                            title={video.title}
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer',
                            }}
                          >
                            {video.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: `${src.color}15`,
                                color: src.color,
                              }}
                            >
                              {src.tag}
                            </span>
                            <span>{video.author || video.artist || 'Video Creator'}</span>
                            <span>•</span>
                            <span>{formatFileSize(video.fileSize)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setPlaylistModalVideo(video)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-medium)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Add to Playlist"
                          >
                            <ListPlus size={13} color="var(--primary, #7c5cbf)" />
                            <span>Playlist</span>
                          </button>

                          {video.filePath && (
                            <button
                              type="button"
                              onClick={() => onOpenFolder && onOpenFolder(video.filePath)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-medium)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Show in Windows Explorer"
                            >
                              <FolderOpen size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onPlayVideo(video)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'var(--primary, #7c5cbf)',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Play size={12} fill="#fff" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 2. GRID & COMPACT GRID VIEWS */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      viewMode === 'grid-compact'
                        ? 'repeat(auto-fill, minmax(185px, 1fr))'
                        : 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: viewMode === 'grid-compact' ? '12px' : '16px',
                  }}
                >
                  {filteredVideos.map((video) => {
                    const src = getVideoSource(video);
                    const isCompact = viewMode === 'grid-compact';

                    return (
                      <div
                        key={video.id || video.filePath}
                        onClick={() => onPlayVideo(video)}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: isCompact ? '8px' : '10px',
                          border: '1px solid var(--border-medium)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                        }}
                        className="clean-video-card"
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/9',
                            backgroundColor: '#111',
                            overflow: 'hidden',
                          }}
                        >
                          {video.thumbnail || video.artworkUrl ? (
                            <img
                              src={video.thumbnail || video.artworkUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#18181b',
                                color: 'var(--primary)',
                              }}
                            >
                              <Film size={isCompact ? 24 : 32} />
                            </div>
                          )}

                          {/* Source badge overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              padding: isCompact ? '2px 5px' : '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${src.color}dd`,
                              color: '#ffffff',
                              fontSize: isCompact ? '9px' : '10px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              zIndex: 2,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            }}
                          >
                            <span>{src.tag}</span>
                          </div>

                          {/* Play Overlay Icon */}
                          <div
                            className="thumb-play-icon"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0,0,0,0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: isCompact ? '34px' : '44px',
                                height: isCompact ? '34px' : '44px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary, #7c5cbf)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              }}
                            >
                              <Play size={isCompact ? 16 : 20} fill="#fff" />
                            </div>
                          </div>

                          {/* Duration badge */}
                          {video.durationFormatted && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                color: '#fff',
                                fontSize: isCompact ? '10px' : '11px',
                                fontWeight: 600,
                              }}
                            >
                              {video.durationFormatted}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div style={{ padding: isCompact ? '10px' : '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <div
                            title={video.title}
                            style={{
                              fontSize: isCompact ? '12px' : '13px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.35',
                            }}
                          >
                            {video.title}
                          </div>

                          <div
                            style={{
                              fontSize: isCompact ? '10.5px' : '11.5px',
                              color: 'var(--text-secondary)',
                              marginTop: 'auto',
                              paddingTop: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                              {video.author || video.artist || 'Video Creator'}
                            </span>
                            <span>{formatFileSize(video.fileSize)}</span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


      {/* RIGHT-CLICK CONTEXT MENU WITH PLAYLIST SELECTION */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            width: '220px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-medium, #e5e7eb)',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header Title */}
          <div
            style={{
              padding: '6px 10px 8px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted, #9ca3af)',
              borderBottom: '1px solid var(--border-light, #f3f4f6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={contextMenu.video.title}
          >
            {contextMenu.video.title}
          </div>

          {/* Play Video */}
          <button
            type="button"
            onClick={() => {
              onPlayVideo(contextMenu.video);
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background-color 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(124, 92, 191, 0.08))')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Play size={14} color="var(--primary, #7c5cbf)" fill="var(--primary, #7c5cbf)" />
            <span>Play Video</span>
          </button>

          {/* Add to Playlist ▶ (with Submenu) */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsPlaylistSubmenuOpen(true)}
            onMouseLeave={() => setIsPlaylistSubmenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsPlaylistSubmenuOpen(!isPlaylistSubmenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isPlaylistSubmenuOpen ? 'var(--bg-hover, rgba(124, 92, 191, 0.08))' : 'transparent',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                transition: 'background-color 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListPlus size={14} color="var(--primary, #7c5cbf)" />
                <span>Add to Playlist</span>
              </div>
              <ChevronRight size={13} color="var(--text-secondary)" />
            </button>

            {/* Playlist Submenu Flyout */}
            {isPlaylistSubmenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: contextMenu.x + 220 + 200 > window.innerWidth ? '-205px' : '210px',
                  width: '200px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-medium, #e5e7eb)',
                  borderRadius: '10px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.08)',
                  padding: '6px',
                  zIndex: 10000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Select Playlist
                </div>

                {playlists.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No playlists found
                  </div>
                ) : (
                  playlists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        if (onAddToPlaylist) {
                          onAddToPlaylist(pl.id, {
                            id: contextMenu.video.id,
                            filePath: contextMenu.video.filePath,
                            url: contextMenu.video.url || contextMenu.video.streamUrl,
                            title: contextMenu.video.title,
                            author: contextMenu.video.author || contextMenu.video.artist,
                            artist: contextMenu.video.author || contextMenu.video.artist,
                            thumbnail: contextMenu.video.thumbnail || contextMenu.video.artworkUrl,
                            formatType: 'VIDEO',
                            mediaType: 'video',
                          });
                          setPlaylistNotice(`Added to "${pl.name}"`);
                          setTimeout(() => setPlaylistNotice(''), 3000);
                        }
                        setContextMenu(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(124, 92, 191, 0.08))')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Folder size={13} color="var(--primary, #7c5cbf)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.name}
                      </span>
                    </button>
                  ))
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--border-light, #f3f4f6)', margin: '4px 0' }} />

                {/* + New Playlist Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPlaylistModalVideo(contextMenu.video);
                    setContextMenu(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: 'rgba(124, 92, 191, 0.08)',
                    color: 'var(--primary, #7c5cbf)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <FolderPlus size={13} />
                  <span>+ Create Playlist</span>
                </button>
              </div>
            )}
          </div>

          {/* Show in File Explorer */}
          {contextMenu.video.filePath && (
            <button
              type="button"
              onClick={() => {
                onOpenFolder && onOpenFolder(contextMenu.video.filePath);
                setContextMenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(124, 92, 191, 0.08))')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FolderOpen size={14} color="var(--text-secondary)" />
              <span>Show in Folder</span>
            </button>
          )}

          {/* Copy Link */}
          {(contextMenu.video.url || contextMenu.video.streamUrl) && (
            <button
              type="button"
              onClick={() => {
                const urlToCopy = contextMenu.video.url || contextMenu.video.streamUrl;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(urlToCopy);
                  setPlaylistNotice('Link copied to clipboard');
                  setTimeout(() => setPlaylistNotice(''), 2500);
                }
                setContextMenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(124, 92, 191, 0.08))')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Copy size={14} color="var(--text-secondary)" />
              <span>Copy Link</span>
            </button>
          )}

          {/* Delete from Library */}
          {onDeleteVideo && contextMenu.video.filePath && (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--border-light, #f3f4f6)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  const vid = contextMenu.video;
                  setContextMenu(null);
                  if (window.confirm(`Delete "${vid.title}" from library?`)) {
                    onDeleteVideo(vid.filePath);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={14} color="#ef4444" />
                <span>Delete Video</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {playlistNotice && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(24, 24, 30, 0.92)',
            color: '#ffffff',
            backdropFilter: 'blur(10px)',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span>{playlistNotice}</span>
        </div>
      )}

          {/* ADD TO PLAYLIST MODAL */}
          {playlistModalVideo && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
              onClick={() => setPlaylistModalVideo(null)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '440px',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListPlus size={18} color="var(--primary, #7c5cbf)" />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Add Video to Playlist
                    </span>
                  </div>
                  <button
                    onClick={() => setPlaylistModalVideo(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main)',
                  }}
                >
                  <Film size={20} color="var(--primary, #7c5cbf)" />
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {playlistModalVideo.title}
                  </span>
                </div>

                {playlistNotice && (
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                    {playlistNotice}
                  </div>
                )}

                {/* Existing Playlists list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {playlists.length > 0 ? (
                    playlists.map((pl) => (
                      <div
                        key={pl.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px' }}>{pl.icon || '🎬'}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {pl.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {pl.tracks?.length || 0} items
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddVideoToPlaylist(pl.id, playlistModalVideo)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: 'var(--primary, #7c5cbf)',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                      No playlists created yet. Create one below!
                    </div>
                  )}
                </div>

                {/* Create New Playlist inline form */}
                <form onSubmit={handleCreateAndAdd} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="New playlist name..."
                    value={newPlaylistTitle}
                    onChange={(e) => setNewPlaylistTitle(e.target.value)}
                    style={{
                      flex: 1,
                      height: '34px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newPlaylistTitle.trim()}
                    style={{
                      height: '34px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: newPlaylistTitle.trim() ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: newPlaylistTitle.trim() ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} />
                    <span>Create & Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
