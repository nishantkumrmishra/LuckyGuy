import React, { useRef, useLayoutEffect, useEffect } from 'react';
import {
  Play,
  FolderOpen,
  Pencil,
  Heart,
  Trash2,
  ListPlus,
  Copy
} from 'lucide-react';

export default function ContextMenu({
  x,
  y,
  track,
  isLiked = false,
  playlists = [],
  onClose,
  onPlayNow,
  onOpenFolder,
  onEditTrack,
  onToggleLike,
  onAddToPlaylist,
  onDeleteTrack,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Viewport boundary clamping
  const menuWidth = 210;
  const menuHeight = 240;
  const clampedX = Math.min(Math.max(8, x), window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(Math.max(8, y), window.innerHeight - menuHeight - 8);

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    userSelect: 'none',
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: clampedX + 'px',
        top: clampedY + 'px',
        width: menuWidth + 'px',
        backgroundColor: 'var(--bg-card, #161616)',
        border: '1px solid var(--border-medium)',
        borderRadius: '10px',
        padding: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Play Now */}
      <div
        style={itemStyle}
        onClick={() => { onPlayNow?.(track); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Play size={14} color="var(--primary, #7c5cbf)" fill="currentColor" />
        <span>Play Track</span>
      </div>

      {/* 2. Locate File in Explorer */}
      <div
        style={itemStyle}
        onClick={() => {
          const filePath = track.filePath || track.destinationPath;
          if (filePath && onOpenFolder) onOpenFolder(filePath);
          onClose();
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <FolderOpen size={14} color="var(--text-secondary)" />
        <span>Locate in Explorer</span>
      </div>

      {/* 3. Modify / Edit Metadata & Artwork */}
      <div
        style={itemStyle}
        onClick={() => { onEditTrack?.(track); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Pencil size={14} color="var(--text-secondary)" />
        <span>Modify / Edit Details</span>
      </div>

      {/* 4. Add to Playlist */}
      {playlists.length > 0 && (
        <div
          style={itemStyle}
          onClick={() => {
            if (playlists.length > 0 && onAddToPlaylist) {
              onAddToPlaylist(playlists[0].id || playlists[0].name, track);
            }
            onClose();
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ListPlus size={14} color="var(--text-secondary)" />
          <span>Add to Playlist</span>
        </div>
      )}

      {/* 5. Like / Favorite */}
      <div
        style={itemStyle}
        onClick={() => { onToggleLike?.(track); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Heart size={14} color={isLiked ? '#ef4444' : 'var(--text-secondary)'} fill={isLiked ? '#ef4444' : 'none'} />
        <span>{isLiked ? 'Remove from Liked' : 'Save to Liked'}</span>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border-medium)', margin: '4px 0' }} />

      {/* 6. Delete File Permanently */}
      <div
        style={{ ...itemStyle, color: '#ef4444' }}
        onClick={() => { onDeleteTrack?.(track); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Trash2 size={14} color="#ef4444" />
        <span>Delete File</span>
      </div>
    </div>
  );
}
