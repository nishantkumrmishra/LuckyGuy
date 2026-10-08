import ContextMenu from './ContextMenu';
import EditMetadataModal from './EditMetadataModal';
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  FolderSearch,
  Search,
  Play,
  Pause,
  Clock,
  Trash2,
  FolderOpen,
  Heart
} from 'lucide-react';
import AppIcon from './AppIcon';
import { CustomIcon } from './DuoIcons';

export default function LibraryTab({
  songs = [],
  playlists = [],
  onPlaySong,
  onScanLibrary,
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
  const [contextMenu, setContextMenu] = useState(null);
  const [editingTrack, setEditingTrack] = useState(null);

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
      if (sortBy === 'duration') return (a.duration || 0) - (b.duration || 0);
      return 0;
    });
    return list;
  }, [songs, searchQuery, sortBy]);

  const formatDuration = (secs) => {
    if (!secs) return '3:30';
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
        gap: '20px',
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
              fontWeight: 500,
              padding: '2px 8px',
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

      {/* Filter and Search Bar */}
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
              gap: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '0 10px',
              height: '34px',
              width: '240px',
            }}
          >
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tracks..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: 400,
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: '34px',
              padding: '0 10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="title">Title (A-Z)</option>
            <option value="artist">Artist (A-Z)</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      )}

      {/* NorthTracks Exact Tracks Table */}
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
            borderRadius: '10px',
            border: '1px solid var(--border-medium, rgba(0, 0, 0, 0.08))',
            overflow: 'hidden',
          }}
        >
          <table className="tracks-table">
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Album</th>
                <th style={{ width: '100px', textAlign: 'center' }}>
                  <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.map((track, idx) => {
                const isCurrent =
                  currentTrack &&
                  (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                const isTrackPlaying = isCurrent && isPlaying;
                const isLiked = likedTracks.includes(track.id || track.filePath || track.title);
                const art = track.artworkUrl || track.coverArt;

                return (
                  <tr
                    key={track.id || track.filePath || idx}
                    className={isCurrent ? 'playing-row' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                    onContextMenu={(e) => handleContextMenu(e, track)}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {isTrackPlaying ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ width: '3px', height: '12px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                          <span style={{ width: '3px', height: '16px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                          <span style={{ width: '3px', height: '10px', backgroundColor: '#7c5cbf', borderRadius: '1px' }} />
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </td>

                    <td className="track-title-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-light, rgba(0,0,0,0.05))',
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
                            <CustomIcon size={18} stroke="var(--primary, #7c5cbf)" />
                          )}
                        </div>

                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: isCurrent ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {track.title}
                        </span>
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {track.artist || 'Unknown Artist'}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      {track.album || 'Single / Master'}
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      {formatDuration(track.duration)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onToggleLike && onToggleLike(track)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                          title={isLiked ? 'Unlike' : 'Like'}
                        >
                          <Heart size={15} fill={isLiked ? '#a78bfa' : 'none'} color={isLiked ? '#a78bfa' : 'var(--text-muted)'} />
                        </button>

                        <button
                          onClick={() => onPlaySong && onPlaySong(track, filteredSongs)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                          }}
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
                              padding: '4px',
                              color: 'var(--text-muted)',
                            }}
                            title="Move to Trash"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
