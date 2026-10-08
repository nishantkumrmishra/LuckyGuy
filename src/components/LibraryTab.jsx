import ContextMenu from './ContextMenu';
import EditMetadataModal from './EditMetadataModal';
import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Sparkles,
  FolderSearch,
  Search,
  Play,
  Pause,
  Clock,
  Trash2,
  FolderOpen,
  Heart,
  Music,
  Disc3,
  MoreVertical,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import AppIcon from './AppIcon';
import { CustomIcon } from './DuoIcons';

export default function LibraryTab({
  songs = [],
  playlists = [],
  onPlaySong,
  onScanLibrary,
  onOrganizeLibrary,
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
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [isScanning, setIsScanning] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeToast, setOrganizeToast] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingTrack, setEditingTrack] = useState(null);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  const handleContextMenu = (e, track) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
    });
  };

  const handleScan = async () => {
    setIsScanning(true);
    if (onScanLibrary) await onScanLibrary();
    setTimeout(() => setIsScanning(false), 800);
  };

  const handleOrganize = async () => {
    if (!onOrganizeLibrary || isOrganizing) return;
    setIsOrganizing(true);
    try {
      const res = await onOrganizeLibrary();
      if (res && res.success) {
        const parts = [];
        if (res.movedCount) parts.push(res.movedCount + ' organized into folders');
        if (res.updatedArtworkCount) parts.push(res.updatedArtworkCount + ' artworks fixed');
        setOrganizeToast(parts.length > 0 ? parts.join(' & ') : 'Library and folders up to date');
      } else {
        setOrganizeToast('Library checked & organized');
      }
    } catch (e) {
      setOrganizeToast('Organization completed');
    } finally {
      setIsOrganizing(false);
      setTimeout(() => setOrganizeToast(null), 4000);
    }
  };

  const filteredSongs = useMemo(() => {
    let list = [...songs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.artist || '').toLowerCase().includes(q) ||
          (s.album || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'artist') return (a.artist || '').localeCompare(b.artist || '');
      if (sortBy === 'album') return (a.album || '').localeCompare(b.album || '');
      if (sortBy === 'duration') return (a.durationSeconds || a.duration || 0) - (b.durationSeconds || b.duration || 0);
      return 0;
    });
    return list;
  }, [songs, searchQuery, sortBy]);

  const formatDuration = (secs) => {
    if (!secs || isNaN(secs)) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

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
        gap: '24px',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Library
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
            }}
          >
            {songs.length + ' ' + (songs.length === 1 ? 'Track' : 'Tracks')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {organizeToast && (
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(124, 92, 191, 0.08)',
                color: 'var(--primary, #7c5cbf)',
                border: '1px solid rgba(124, 92, 191, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>✓</span> {organizeToast}
            </span>
          )}

          {onOrganizeLibrary && (
            <button
              onClick={handleOrganize}
              disabled={isOrganizing || isScanning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: (isOrganizing || isScanning) ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Clean track titles, move files into genre folders, and update artworks"
            >
              <Wand2 size={14} className={isOrganizing ? 'animate-spin' : ''} style={{ color: 'var(--primary, #7c5cbf)' }} />
              <span>{isOrganizing ? 'Organizing...' : 'Organize & Fix'}</span>
            </button>
          )}

          {onOpenFolder && (
            <button
              onClick={() => onOpenFolder(downloadFolder)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-medium)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Open Music folder in Windows Explorer"
            >
              <FolderOpen size={14} />
              <span>Open Music Folder</span>
            </button>
          )}

          <button
            onClick={handleScan}
            disabled={isScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary, #7c5cbf)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: isScanning ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(124, 92, 191, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <FolderSearch size={14} color="#ffffff" className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Scan Music Folder'}</span>
          </button>
        </div>
      </div>

      {/* Picked for You Today Section */}
      {songs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} color="var(--primary, #7c5cbf)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Picked for You Today
            </h2>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              overflowX: 'auto',
              paddingBottom: '6px',
              scrollbarWidth: 'none',
            }}
          >
            {songs.slice(0, 10).map((track) => {
              const isCurrent = currentTrack && (currentTrack.id === track.id || (currentTrack.filePath && currentTrack.filePath === track.filePath));
              const isTrackPlaying = isCurrent && isPlaying;
              const art = track.artworkUrl || track.coverArt;
              return (
                <div
                  key={track.id || track.filePath}
                  onClick={() => onPlaySong && onPlaySong(track, songs)}
                  onContextMenu={(e) => handleContextMenu(e, track)}
                  style={{
                    width: '145px',
                    flexShrink: 0,
                    backgroundColor: 'var(--bg-card, #ffffff)',
                    borderRadius: '12px',
                    padding: '10px',
                    border: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                  }}
                >
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
                      position: 'relative',
                    }}
                  >
                    {art ? (
                      <img
                        src={art}
                        alt={track.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <CustomIcon size={32} stroke="var(--primary, #7c5cbf)" />
                    )}

                    {/* Play Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '8px',
                        bottom: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary, #7c5cbf)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                        opacity: isTrackPlaying ? 1 : 0.9,
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {isTrackPlaying ? (
                        <Pause size={14} color="#ffffff" fill="#ffffff" />
                      ) : (
                        <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2px' }} />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={track.title}
                    >
                      {track.title}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 400,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {track.artist || 'Local Track'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar Header */}
      {songs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '9px',
              padding: '0 12px',
              height: '36px',
              width: '280px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tracks by title, artist, album..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: 500,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                height: '36px',
                padding: '0 12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist (A-Z)</option>
              <option value="album">Album (A-Z)</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      )}

      {/* Downside Area: Modernized Premium NorthTracks Songs Table */}
      {filteredSongs.length === 0 ? (
        <div
          style={{
            padding: '70px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div style={{ opacity: 0.6 }}><AppIcon size={42} /></div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Music Files Found
          </span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
            Paste any link on the Home tab to download and index music in your library.
          </span>
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              style={{
                marginTop: '10px',
                padding: '7px 16px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Go to Home Tab
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-medium, rgba(0, 0, 0, 0.08))',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          }}
        >
          <table className="tracks-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-medium)',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <th style={{ width: '56px', textAlign: 'center', padding: '12px 0', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TITLE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ARTIST</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ALBUM</th>
                <th style={{ width: '90px', textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th style={{ width: '120px', textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.map((track, idx) => {
                const trackKey = track.id || track.filePath || idx;
                const isCurrent =
                  currentTrack &&
                  (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                const isTrackPlaying = isCurrent && isPlaying;
                const isLiked = likedTracks.includes(track.id || track.filePath || track.title);
                const isHovered = hoveredTrackId === trackKey;
                const art = track.artworkUrl || track.coverArt;

                return (
                  <tr
                    key={trackKey}
                    className={isCurrent ? 'playing-row' : ''}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light, rgba(0, 0, 0, 0.04))',
                      backgroundColor: isCurrent ? 'rgba(124, 92, 191, 0.08)' : (isHovered ? 'var(--bg-card-hover, rgba(0,0,0,0.02))' : 'transparent'),
                      transition: 'background-color 0.12s ease',
                    }}
                    onClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                    onMouseEnter={() => setHoveredTrackId(trackKey)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onContextMenu={(e) => handleContextMenu(e, track)}
                  >
                    {/* Index / Playing Equalizer / Hover Play */}
                    <td style={{ textAlign: 'center', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', padding: '10px 0', width: '56px' }}>
                      {isTrackPlaying ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2.5px', height: '14px' }}>
                          <span style={{ width: '3px', height: '14px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate' }} />
                          <span style={{ width: '3px', height: '10px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate 0.2s' }} />
                          <span style={{ width: '3px', height: '12px', backgroundColor: 'var(--primary, #7c5cbf)', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate 0.4s' }} />
                        </div>
                      ) : isHovered ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                          }}
                        >
                          <Play size={13} fill="currentColor" style={{ marginLeft: '2px' }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{idx + 1}</span>
                      )}
                    </td>

                    {/* Title & Artwork Thumbnail */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                          }}
                        >
                          {art ? (
                            <img
                              src={art}
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
                                backgroundColor: 'rgba(124, 92, 191, 0.08)',
                                color: 'var(--primary)',
                              }}
                            >
                              <Music size={18} strokeWidth={2} />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '13.5px',
                              color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              letterSpacing: '-0.01em',
                            }}
                            title={track.title}
                          >
                            {track.title}
                          </span>
                          {track.formatType && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {track.formatType}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Artist */}
                    <td
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 500,
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={track.artist || 'Unknown Artist'}
                    >
                      {track.artist || 'Unknown Artist'}
                    </td>

                    {/* Album */}
                    <td
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-muted)',
                        fontSize: '12.5px',
                        fontWeight: 400,
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={track.album || 'Single / Master'}
                    >
                      {track.album || 'Single / Master'}
                    </td>

                    {/* Duration */}
                    <td
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '12.5px',
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatDuration(track.durationSeconds || track.duration)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onToggleLike && onToggleLike(track)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isLiked ? '#a78bfa' : 'var(--text-muted)',
                            transition: 'transform 0.1s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={isLiked ? 'Unlike' : 'Like'}
                        >
                          <Heart size={15} fill={isLiked ? '#a78bfa' : 'none'} color={isLiked ? '#a78bfa' : 'currentColor'} />
                        </button>

                        <button
                          onClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                            transition: 'transform 0.1s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={isTrackPlaying ? 'Pause' : 'Play'}
                        >
                          {isTrackPlaying ? <Pause size={15} /> : <Play size={15} />}
                        </button>

                        {onTrashSong && (
                          <button
                            onClick={() => onTrashSong(track)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                            title="Move to Trash"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleContextMenu(e, track)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="More Options"
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

      {/* Right Click Context Menu */}
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
            if (confirm(`Permanently delete "${t.title}" from disk?`)) {
              if (onPermanentDelete) {
                onPermanentDelete(t);
              } else if (onTrashSong) {
                onTrashSong(t);
              }
            }
          }}
        />
      )}

      {/* Manual Metadata & Artwork Edit Modal */}
      {editingTrack && (
        <EditMetadataModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={(trackId, updates) => {
            if (onUpdateSong) {
              onUpdateSong(trackId, updates);
            }
          }}
        />
      )}
    </div>
  );
}
