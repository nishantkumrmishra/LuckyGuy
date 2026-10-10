import VideoStreamingTab from './VideoStreamingTab';
import ContextMenu from './ContextMenu';
import EditMetadataModal from './EditMetadataModal';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  Clock,
  Trash2,
  Heart,
  MoreVertical,
  Folder,
  ArrowLeft,
  LayoutList,
  LayoutGrid,
  Music,
  Film,
} from 'lucide-react';
import { CustomIcon, DuoVideo } from './DuoIcons';

export default function LibraryTab({
  songs = [],
  playlists = [],
  onPlaySong,
  onTrashSong,
  onPermanentDelete,
  onOpenFolder,
  onUpdateSong,
  onAddToPlaylist,
  downloadFolder,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNavigateToHome,
  likedTracks = [],
  onToggleLike,
  videos = [],
  adultVideos = [],
  activeVideo = null,
  activeAdultVideo = null,
  onPlayVideo,
  onPlayAdultVideo,
  onClosePlayer,
  onCloseAdultPlayer,
  onDeleteVideo,
  onDeleteAdultVideo,
  onRefreshVideos,
  onRefreshAdultVideos,
  libraryMode = 'music',
  onSetLibraryMode,
}) {
  const [internalMode, setInternalMode] = useState('music');
  const currentLibraryMode = onSetLibraryMode ? libraryMode : internalMode;
  const handleSetLibraryMode = (mode) => {
    if (onSetLibraryMode) onSetLibraryMode(mode);
    else setInternalMode(mode);
  };
  const videoList = (videos && videos.length > 0) ? videos : adultVideos;
  const currentActiveVideo = activeVideo || activeAdultVideo;
  const handlePlayVid = onPlayVideo || onPlayAdultVideo;
  const handleClosePlayer = onClosePlayer || onCloseAdultPlayer;
  const handleDeleteVid = onDeleteVideo || onDeleteAdultVideo;
  const handleRefreshVid = onRefreshVideos || onRefreshAdultVideos;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null); // null = overview folders grid, string = opened folder name
  const [contextMenu, setContextMenu] = useState(null);
  const [editingTrack, setEditingTrack] = useState(null);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);
  const [folderViewMode, setFolderViewMode] = useState(() => {
    try {
      return localStorage.getItem('luckyguy-folder-view-mode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleToggleFolderViewMode = (mode) => {
    setFolderViewMode(mode);
    try {
      localStorage.setItem('luckyguy-folder-view-mode', mode);
    } catch (e) {}
  };

  // Group songs into folders based on category/directory/album
  const folders = useMemo(() => {
    const map = new Map();
    for (const song of songs) {
      let folderName = 'General';
      if (song.filePath) {
        const parts = song.filePath.replace(/\\/g, '/').split('/');
        if (parts.length > 2) {
          const parentDir = parts[parts.length - 2];
          if (parentDir && parentDir.toLowerCase() !== 'music' && parentDir.toLowerCase() !== 'playlists') {
            folderName = parentDir;
          }
        }
      } else if (song.album && song.album !== 'Unknown Album') {
        folderName = song.album;
      }

      if (!map.has(folderName)) {
        map.set(folderName, []);
      }
      map.get(folderName).push(song);
    }

    const list = [];
    for (const [name, tracks] of map.entries()) {
      const firstWithArt = tracks.find((t) => t.artworkUrl || t.coverArt);
      const coverArt = firstWithArt?.artworkUrl || firstWithArt?.coverArt || null;
      list.push({
        name,
        tracks,
        trackCount: tracks.length,
        coverArt,
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  // Active track list: either tracks in selected folder or all filtered songs
  const activeSongs = useMemo(() => {
    if (selectedFolder) {
      const f = folders.find((item) => item.name === selectedFolder);
      return f ? f.tracks : [];
    }
    return songs;
  }, [selectedFolder, folders, songs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return activeSongs;
    const q = searchQuery.toLowerCase().trim();
    return activeSongs.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q)
    );
  }, [activeSongs, searchQuery]);

  const handleContextMenu = (e, track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
    });
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '3:45';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (currentLibraryMode === 'videos' || currentLibraryMode === 'adult') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {!currentActiveVideo && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 32px 0 32px', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => handleSetLibraryMode('music')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Music size={13} />
                <span>Music ({songs.length})</span>
              </button>
              <button
                onClick={() => handleSetLibraryMode('videos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(124, 92, 191, 0.15)',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <DuoVideo size={13} active={true} />
                <span>Videos ({videoList.length})</span>
              </button>
            </div>
          </div>
        )}

        <VideoStreamingTab
          videos={videoList}
          activeVideo={currentActiveVideo}
          onPlayVideo={handlePlayVid}
          onClosePlayer={handleClosePlayer}
          onDeleteVideo={handleDeleteVid}
          onRefreshVideos={handleRefreshVid}
          onOpenFolder={onOpenFolder}
          downloadFolder={downloadFolder}
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
        />
      </div>
    );
  }

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px 40px 32px',
        backgroundColor: 'var(--bg-main, #f5f5f5)',
        overflowY: 'auto',
        gap: '20px',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Toolbar - Clean and Uncluttered */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
              title="Back to all folders"
            >
              <ArrowLeft size={14} />
              <span>Folders</span>
            </button>
          )}

          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {selectedFolder ? selectedFolder : 'Music Library'}
          </h1>

          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginLeft: '6px',
            }}
          >
            {selectedFolder
              ? `${filteredSongs.length} tracks`
              : `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'} • ${songs.length} tracks`}
          </span>
        </div>

        {!selectedFolder && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => handleSetLibraryMode('music')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(124, 92, 191, 0.15)',
                color: 'var(--primary, #7c5cbf)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <Music size={13} />
              <span>Music ({songs.length})</span>
            </button>
            <button
              onClick={() => handleSetLibraryMode('videos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <DuoVideo size={13} active={false} />
              <span>Videos ({videoList.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: FOLDERS OVERVIEW GRID (Playlist Style) */}
      {!selectedFolder ? (
        folders.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-medium)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Folder size={32} color="var(--primary, #7c5cbf)" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No music folders found
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
              Download music or add songs to your Music directory to browse them by folder here.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '14px',
            }}
          >
            {folders.map((f) => (
              <div
                key={f.name}
                onClick={() => setSelectedFolder(f.name)}
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                }}
              >
                {/* 1:1 Cover Art / Folder Icon */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {f.coverArt ? (
                    <img src={f.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Folder size={28} color="var(--primary, #7c5cbf)" />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={f.name}
                  >
                    {f.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {f.trackCount} {f.trackCount === 1 ? 'song' : 'songs'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VIEW 2: INSIDE FOLDER SONGS (TOGGLE LIST VS GRID) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Toolbar: Search input + View mode toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '0 12px',
                height: '36px',
                maxWidth: '320px',
                flex: 1,
              }}
            >
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks in folder..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '11px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* List vs Grid View Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => handleToggleFolderViewMode('list')}
                title="List View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: folderViewMode === 'list' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: folderViewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'background-color 0.15s ease',
                }}
              >
                <LayoutList size={14} />
                <span>List</span>
              </button>
              <button
                onClick={() => handleToggleFolderViewMode('grid')}
                title="Grid View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: folderViewMode === 'grid' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: folderViewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'background-color 0.15s ease',
                }}
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {filteredSongs.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px',
              }}
            >
              No songs found in this folder.
            </div>
          ) : folderViewMode === 'grid' ? (
            /* ========================================================================= */
            /* GRID VIEW: Responsive Album Art Cards */
            /* ========================================================================= */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredSongs.map((track, idx) => {
                const trackKey = track.id || track.filePath || idx;
                const isCurrent = currentTrack && (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                const isTrackPlaying = isCurrent && isPlaying;
                const isLiked = likedTracks.includes(track.id || track.filePath || track.title);
                const art = track.artworkUrl || track.coverArt;

                return (
                  <div
                    key={trackKey}
                    onContextMenu={(e) => handleContextMenu(e, track)}
                    onDoubleClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                    style={{
                      padding: '12px',
                      backgroundColor: isCurrent ? 'rgba(124, 92, 191, 0.08)' : 'var(--bg-card)',
                      borderRadius: '12px',
                      border: `1px solid ${isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredTrackId(trackKey);
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      setHoveredTrackId(null);
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    {/* Cover Art + Hover Play Overlay */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {art ? (
                        <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <CustomIcon name="music" size={32} color="var(--primary, #7c5cbf)" />
                      )}

                      {/* Play/Pause Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: hoveredTrackId === trackKey || isTrackPlaying ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrent && onTogglePlay) onTogglePlay();
                            else if (onPlaySong) onPlaySong(track, filteredSongs);
                          }}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary, #7c5cbf)',
                            border: 'none',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          }}
                        >
                          {isTrackPlaying ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                          )}
                        </button>
                      </div>

                      {/* Duration Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        {formatDuration(track.durationSeconds || track.duration)}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={track.title}
                      >
                        {track.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={track.artist}
                      >
                        {track.artist || 'Unknown Artist'}
                      </div>
                    </div>

                    {/* Quick action buttons row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: '4px',
                        borderTop: '1px solid var(--border-light, rgba(0,0,0,0.04))',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike && onToggleLike(track);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: isLiked ? '#ef4444' : 'var(--text-muted)',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPermanentDelete) onPermanentDelete(track);
                            else if (onTrashSong) onTrashSong(track);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete track"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleContextMenu(e, track)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="More Options"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================================= */
            /* LIST VIEW: Classic Table View */
            /* ========================================================================= */
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ width: '48px', textAlign: 'center', padding: '10px 0' }}>#</th>
                    <th style={{ padding: '10px 14px' }}>Title</th>
                    <th style={{ padding: '10px 14px' }}>Artist</th>
                    <th style={{ width: '80px', textAlign: 'center', padding: '10px 8px' }}>
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </th>
                    <th style={{ width: '100px', textAlign: 'center', padding: '10px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSongs.map((track, idx) => {
                    const trackKey = track.id || track.filePath || idx;
                    const isCurrent = currentTrack && (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                    const isTrackPlaying = isCurrent && isPlaying;
                    const isLiked = likedTracks.includes(track.id || track.filePath || track.title);
                    const art = track.artworkUrl || track.coverArt;

                    return (
                      <tr
                        key={trackKey}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                        onDoubleClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                        style={{
                          borderBottom: idx === filteredSongs.length - 1 ? 'none' : '1px solid var(--border-light, rgba(0,0,0,0.04))',
                          backgroundColor: isCurrent ? 'rgba(124, 92, 191, 0.08)' : 'transparent',
                          transition: 'background-color 0.12s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          setHoveredTrackId(trackKey);
                          if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(0,0,0,0.02))';
                        }}
                        onMouseLeave={(e) => {
                          setHoveredTrackId(null);
                          if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Index / Play indicator */}
                        <td style={{ textAlign: 'center', padding: '10px 0' }}>
                          <button
                            onClick={() => {
                              if (isCurrent && onTogglePlay) onTogglePlay();
                              else if (onPlaySong) onPlaySong(track, filteredSongs);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-muted)',
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isTrackPlaying ? (
                              <Pause size={13} fill="currentColor" />
                            ) : hoveredTrackId === trackKey ? (
                              <Play size={13} fill="currentColor" />
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 400 }}>{idx + 1}</span>
                            )}
                          </button>
                        </td>

                        {/* Title & Artwork */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-main)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {art ? (
                                <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <CustomIcon size={15} stroke="var(--primary, #7c5cbf)" />
                              )}
                            </div>
                            <span
                              style={{
                                fontWeight: isCurrent ? 700 : 600,
                                fontSize: '13px',
                                color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '300px',
                              }}
                            >
                              {track.title}
                            </span>
                          </div>
                        </td>

                        {/* Artist */}
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {track.artist || 'Unknown Artist'}
                          </div>
                        </td>

                        {/* Duration */}
                        <td style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                          {formatDuration(track.durationSeconds || track.duration)}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {onToggleLike && (
                              <button
                                onClick={() => onToggleLike(track)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: isLiked ? '#ef4444' : 'var(--text-muted)',
                                }}
                                title={isLiked ? 'Unlike' : 'Like'}
                              >
                                <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} />
                              </button>
                            )}

                            {/* Direct Delete button */}
                            <button
                              onClick={() => {
                                if (onPermanentDelete) onPermanentDelete(track);
                                else if (onTrashSong) onTrashSong(track);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)',
                              }}
                              title="Delete track"
                            >
                              <Trash2 size={14} />
                            </button>

                            <button
                              onClick={(e) => handleContextMenu(e, track)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)',
                              }}
                              title="More"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          isLiked={likedTracks.includes(contextMenu.track?.id || contextMenu.track?.filePath || contextMenu.track?.title)}
          playlists={playlists}
          onClose={() => setContextMenu(null)}
          onPlayNow={(t) => onPlaySong && onPlaySong(t, filteredSongs)}
          onOpenFolder={(path) => onOpenFolder && onOpenFolder(path)}
          onEditTrack={(t) => setEditingTrack(t)}
          onToggleLike={(t) => onToggleLike && onToggleLike(t)}
          onAddToPlaylist={(plId, t) => onAddToPlaylist && onAddToPlaylist(plId, t.id || t.filePath)}
          onDeleteTrack={(t) => {
            if (onPermanentDelete) onPermanentDelete(t);
            else if (onTrashSong) onTrashSong(t);
          }}
        />
      )}

      {/* Edit Metadata Modal */}
      {editingTrack && (
        <EditMetadataModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={(updates) => {
            onUpdateSong && onUpdateSong(editingTrack.id || editingTrack.filePath, updates);
            setEditingTrack(null);
          }}
        />
      )}
    </div>
  );
}
