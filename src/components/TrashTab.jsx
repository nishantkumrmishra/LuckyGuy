import React from 'react';
import {
  Trash2,
  RotateCcw,
  Clock,
  X
} from 'lucide-react';
import { CustomIcon, DuoTrash } from './DuoIcons';

export default function TrashTab({
  trashItems = [],
  onRestoreTrack,
  onPermanentDelete,
  onEmptyTrash,
  onNavigateToHome,
}) {
  const formatDuration = (secs) => {
    if (!secs) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px 40px 32px',
        backgroundColor: 'var(--bg-main)',
        overflowY: 'auto',
        gap: '20px',
        fontFamily: 'inherit',
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Trash
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
            {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {trashItems.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Permanently delete all items from Trash? This cannot be undone.')) {
                onEmptyTrash?.();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--danger, #ef4444)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Permanently remove all trashed tracks"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
            }}
          >
            <Trash2 size={14} color="var(--danger, #ef4444)" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {trashItems.length === 0 ? (
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
            <DuoTrash size={38} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Trash is Empty
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Tracks removed from your library will appear here until permanently deleted.
            </div>
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                style={{
                  marginTop: '8px',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Go to Home
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Unified Tracks Table matching LibraryTab */
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
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
                <th>Album</th>
                <th style={{ width: '100px', textAlign: 'center' }}>
                  <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </th>
                <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashItems.map((track, idx) => {
                const art = track.artworkUrl || track.coverArt;

                return (
                  <tr key={track.id || track.filePath || idx}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {idx + 1}
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
                            <CustomIcon size={18} stroke="var(--primary)" />
                          )}
                        </div>

                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: 'var(--text-primary)',
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
                          gap: '6px',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => onRestoreTrack?.(track)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '14px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--primary)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                          title="Restore track back to Library"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete "${track.title}" from disk?`)) {
                              onPermanentDelete?.(track);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            transition: 'color 0.12s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger, #ef4444)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Delete permanently from disk"
                        >
                          <Trash2 size={14} />
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
  );
}
