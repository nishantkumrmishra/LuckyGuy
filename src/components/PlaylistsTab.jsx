import React, { useState } from 'react';
import {
  ChevronLeft,
  Play,
  Trash2,
  Music2,
  Clock,
  Pencil,
  Shuffle,
  ListMusic,
  Plus,
  X,
  Check,
  Heart,
  FolderOpen,
  Image,
  Upload
} from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function PlaylistsTab({
  playlists = [],
  songs = [],
  onPlaySong,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onUpdatePlaylistCover,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  onBack,
  onNavigateToHome,
  currentTrack,
  isPlaying,
  onTogglePlay,
  likedTracks = [],
  onToggleLike,
}) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [addSongSearch, setAddSongSearch] = useState('');
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const MUSIC_GENRES = ['Indie', 'Rock', 'Pop', 'K-Pop', 'Hip Hop', 'EDM', 'Acoustic', 'Lo-Fi', 'Metal', 'Jazz'];

  const currentPlaylist = playlists.find(
    (p) => p.id === selectedPlaylistId || p.name === selectedPlaylistId
  );

  // Helper to resolve track references (ID or filepath) into song objects
  const resolveSong = (trackRef) => {
    if (!trackRef) return null;
    if (typeof trackRef === 'object' && trackRef.title) return trackRef;
    const pathOrId = typeof trackRef === 'string' ? trackRef : (trackRef.filePath || trackRef.id);
    
    // Check in loaded library songs
    const found = songs.find(
      (s) => s.id === pathOrId || s.filePath === pathOrId || s.title === pathOrId
    );
    if (found) return found;

    // Fallback if song is directly on disk in playlist folder
    if (typeof pathOrId === 'string' && (pathOrId.includes('/') || pathOrId.includes('\\'))) {
      const parts = pathOrId.replace(/\\/g, '/').split('/');
      const filename = parts[parts.length - 1];
      const titleWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const splitted = titleWithoutExt.split(' - ');
      return {
        id: pathOrId,
        filePath: pathOrId,
        title: splitted.length > 1 ? splitted.slice(1).join(' - ') : titleWithoutExt,
        artist: splitted.length > 1 ? splitted[0] : 'Local Artist',
        album: currentPlaylist?.name || 'Playlist',
        duration: 215,
        artworkUrl: null,
      };
    }
    return null;
  };

  const playlistTracks = currentPlaylist
    ? (currentPlaylist.tracks || currentPlaylist.songIds || [])
        .map(resolveSong)
        .filter(Boolean)
    : [];

  const handleCreateNew = () => {
    let trimmed = newPlaylistName.trim();
    if (selectedCategory && !trimmed.toLowerCase().includes(selectedCategory.toLowerCase())) {
      trimmed = trimmed ? `${trimmed} (${selectedCategory})` : selectedCategory;
    }
    if (trimmed && onCreatePlaylist) {
      onCreatePlaylist(trimmed);
      setNewPlaylistName('');
      setSelectedCategory('');
      setIsCreatingNew(false);
    }
  };

  const handleSaveName = () => {
    if (!currentPlaylist) return;
    const trimmed = editingNameValue.trim();
    if (trimmed && onRenamePlaylist) {
      onRenamePlaylist(currentPlaylist.id, trimmed);
    }
    setIsEditingName(false);
  };

  const handlePlayAll = () => {
    if (playlistTracks.length > 0 && onPlaySong) {
      onPlaySong(playlistTracks[0], playlistTracks);
    }
  };

  const handleShuffleAll = () => {
    if (playlistTracks.length > 0 && onPlaySong) {
      const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
      onPlaySong(shuffled[0], shuffled);
    }
  };

  const handleOpenFolder = (folderPath) => {
    if (folderPath && window.electronAPI?.openInFolder) {
      window.electronAPI.openInFolder(folderPath);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // VIEW 1: SINGLE PLAYLIST DETAIL VIEW
  // ==========================================
  if (currentPlaylist) {
    const coverTrack = playlistTracks.find((t) => t.artworkUrl || t.coverArt);
    const coverUrl = currentPlaylist.coverArt || coverTrack?.artworkUrl || coverTrack?.coverArt;

    return (
      <div
        className="content-area fade-in"
        style={{
          padding: 0,
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        {/* Detail Hero Header */}
        <div
          style={{
            position: 'relative',
            height: '220px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '24px 32px',
            flexShrink: 0,
          }}
        >
          {/* Subtle Neutral Dark Background (No Purple Hue) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%)',
              zIndex: 1,
            }}
          />

          {/* Back Button */}
          <button
            onClick={() => setSelectedPlaylistId(null)}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            title="Back to Playlists"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Header Info */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {/* Playlist Artwork */}
            <div
              onClick={() => {
                setCoverInputUrl(currentPlaylist.coverArt || '');
                setIsEditingCover(true);
              }}
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--border-medium)',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Click to Change Cover Artwork"
            >
              {coverUrl ? (
                <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ListMusic size={44} color="var(--primary)" />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.15s ease',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  gap: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Pencil size={13} />
                <span>Edit</span>
              </div>
            </div>

            {/* Playlist Title & Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    style={{
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {currentPlaylist.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditingNameValue(currentPlaylist.name);
                      setIsEditingName(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Rename Playlist"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}
                  </span>
                  {currentPlaylist.folderPath && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-medium)',
                      }}
                    >
                      Folder on Disk
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {playlistTracks.length > 0 && (
                    <>
                      <button
                        onClick={handlePlayAll}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 20px',
                          borderRadius: '24px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={15} fill="#ffffff" />
                        <span>Play</span>
                      </button>

                      <button
                        onClick={handleShuffleAll}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          padding: '8px 20px',
                          borderRadius: '24px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <Shuffle size={15} />
                        <span>Shuffle</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setIsAddSongsModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                      padding: '8px 16px',
                      borderRadius: '24px',
                      fontWeight: 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Songs</span>
                  </button>

                  {currentPlaylist.folderPath && (
                    <button
                      onClick={() => handleOpenFolder(currentPlaylist.folderPath)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        padding: '8px 14px',
                        borderRadius: '24px',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                      title="Open Playlist Folder in Explorer"
                    >
                      <FolderOpen size={15} />
                      <span>Folder</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Delete playlist "${currentPlaylist.name}"?`)) {
                        onDeletePlaylist && onDeletePlaylist(currentPlaylist.id);
                        setSelectedPlaylistId(null);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '8px',
                    }}
                    title="Delete Playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks Table */}
        <div style={{ padding: '24px 32px 40px 32px', flex: 1 }}>
          {playlistTracks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '36px 40px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '16px',
                  maxWidth: '380px',
                  textAlign: 'center',
                }}
              >
                <Music2 size={36} color="var(--primary)" />
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  This Playlist is Empty
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Add songs or drop music files into this playlist folder.
                </div>
                <button
                  onClick={() => setIsAddSongsModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  <Plus size={15} />
                  <span>Add Songs</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '10px',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden',
              }}
            >
              <table className="tracks-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th>Title</th>
                    <th>Artist</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>
                      <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {playlistTracks.map((track, idx) => {
                    const isCurrent =
                      currentTrack &&
                      (currentTrack.id === track.id || currentTrack.filePath === track.filePath);
                    const isLiked = likedTracks.includes(track.id || track.filePath || track.title);

                    return (
                      <tr
                        key={track.id || track.filePath || idx}
                        className={isCurrent ? 'playing-row' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onPlaySong && onPlaySong(track, playlistTracks)}
                      >
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          {idx + 1}
                        </td>
                        <td className="track-title-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-main)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {track.artworkUrl || track.coverArt ? (
                                <img
                                  src={track.artworkUrl || track.coverArt}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <CustomIcon size={16} stroke="var(--primary)" />
                              )}
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                              }}
                            >
                              {track.title}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {track.artist || 'Unknown Artist'}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                          {formatTime(track.duration)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
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
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                              title={isLiked ? 'Unlike' : 'Like'}
                            >
                              <Heart size={15} fill={isLiked ? 'var(--primary)' : 'none'} color={isLiked ? 'var(--primary)' : 'var(--text-muted)'} />
                            </button>
                            <button
                              onClick={() =>
                                onRemoveTrackFromPlaylist &&
                                onRemoveTrackFromPlaylist(currentPlaylist.id, track.id || track.filePath)
                              }
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)',
                              }}
                              title="Remove from playlist"
                            >
                              <X size={15} />
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

        {/* Modal: Edit Playlist Cover Artwork */}
        {isEditingCover && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsEditingCover(false)}
          >
            <div
              style={{
                width: '420px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-medium)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Change Playlist Cover
                </h3>
                <button
                  onClick={() => setIsEditingCover(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preview */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  {coverInputUrl ? (
                    <img src={coverInputUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Image size={40} color="var(--text-muted)" />
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://... or paste image URL"
                  value={coverInputUrl}
                  onChange={(e) => setCoverInputUrl(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Local File Upload */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 500,
                }}
              >
                <Upload size={14} />
                <span>Upload image file from device</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setCoverInputUrl(evt.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setIsEditingCover(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (currentPlaylist && onUpdatePlaylistCover) {
                      onUpdatePlaylistCover(currentPlaylist.id, coverInputUrl);
                    }
                    setIsEditingCover(false);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  Save Artwork
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Songs from Library */}
        {isAddSongsModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsAddSongsModalOpen(false)}
          >
            <div
              style={{
                width: '500px',
                maxHeight: '600px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-medium)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-medium)',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Add Songs to Playlist
                </h3>
                <button
                  onClick={() => setIsAddSongsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '12px 20px' }}>
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={addSongSearch}
                  onChange={(e) => setAddSongSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 20px 16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {songs
                  .filter((s) => {
                    const q = addSongSearch.toLowerCase();
                    return (
                      !q ||
                      (s.title || '').toLowerCase().includes(q) ||
                      (s.artist || '').toLowerCase().includes(q)
                    );
                  })
                  .map((track) => {
                    const trackIdentifier = track.id || track.filePath || track.title;
                    const isAlreadyIn = (currentPlaylist.tracks || currentPlaylist.songIds || []).some(
                      (t) => t === trackIdentifier || (typeof t === 'string' && track.filePath && t.includes(track.title))
                    );

                    return (
                      <div
                        key={track.id || track.filePath}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-main)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {track.title}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {track.artist}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (isAlreadyIn) {
                              onRemoveTrackFromPlaylist &&
                                onRemoveTrackFromPlaylist(currentPlaylist.id, track.id || track.filePath);
                            } else {
                              onAddTrackToPlaylist &&
                                onAddTrackToPlaylist(currentPlaylist.id, track.id || track.filePath);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            backgroundColor: isAlreadyIn ? 'var(--border-medium)' : 'var(--primary)',
                            color: isAlreadyIn ? 'var(--text-secondary)' : '#ffffff',
                          }}
                        >
                          {isAlreadyIn ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ALL PLAYLISTS OVERVIEW GRID
  // ==========================================
  return (
    <div
      className="content-area fade-in"
      style={{
        padding: '24px 32px',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Playlists
          </h2>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
            }}
          >
            {playlists.length}
          </span>
        </div>

        {/* Action: New Playlist or Open Folder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (window.electronAPI?.openInFolder) {
                window.electronAPI.openInFolder('C:\\Users\\nishant\\Music\\Playlists');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Open Playlists folder in Music"
          >
            <FolderOpen size={14} />
            <span>Folder</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Creation Modal / Inline Creator */}
      {isCreatingNew && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '480px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Playlist name (creates folder in Music\\Playlists)..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '13px',
                }}
              />
            </div>
            {/* Music Genre Categories */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Category:</span>
              {MUSIC_GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === genre ? '' : genre)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid ' + (selectedCategory === genre ? 'var(--primary)' : 'var(--border-medium)'),
                    backgroundColor: selectedCategory === genre ? 'var(--primary)' : 'var(--bg-main)',
                    color: selectedCategory === genre ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Create
          </button>
          <button
            onClick={() => setIsCreatingNew(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '320px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '40px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              maxWidth: '380px',
              textAlign: 'center',
            }}
          >
            <ListMusic size={40} color="var(--primary)" />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No Playlists Found
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Create a playlist or add folders inside your <b>Music\Playlists</b> directory.
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              <Plus size={15} />
              <span>Create Playlist</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
          }}
        >
          {playlists.map((pl) => {
            const firstTrack = (pl.tracks || pl.songIds || [])
              .map(resolveSong)
              .find((t) => t && (t.artworkUrl || t.coverArt));
            const art = pl.coverArt || firstTrack?.artworkUrl || firstTrack?.coverArt;
            const count = (pl.tracks || pl.songIds || []).length;

            return (
              <div
                key={pl.id || pl.name}
                onClick={() => setSelectedPlaylistId(pl.id || pl.name)}
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                }}
              >
                {/* 1:1 Aspect ratio Cover Art */}
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
                  {art ? (
                    <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ListMusic size={26} color="var(--primary)" />
                  )}
                </div>

                {/* Playlist Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {pl.name || pl.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {count} {count === 1 ? 'song' : 'songs'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
