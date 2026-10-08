import React from 'react';
import { ListMusic, X, Trash2 } from 'lucide-react';
import { CustomIcon } from './DuoIcons';

export default function QueueDrawer({
  isOpen,
  onClose,
  queue = [],
  currentIndex = 0,
  onSelectTrack,
  onClearQueue
}) {
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <aside
      className={`queue-drawer ${isOpen ? 'queue-drawer-open' : 'queue-drawer-closed'}`}
      style={{
        width: isOpen ? '320px' : '0px',
        borderLeft: isOpen ? '1px solid #e2e8f0' : 'none',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 260ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 40,
        boxShadow: isOpen ? '-4px 0 20px rgba(15, 23, 42, 0.05)' : 'none',
      }}
    >
      {/* Header */}
      <div
        className="queue-drawer-header"
        style={{
          height: '52px',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListMusic size={18} color="#7c5cbf" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Play Queue
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: '#f5f3ff',
              color: '#7c5cbf',
              border: '1px solid #ddd6fe',
            }}
          >
            {queue.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          title="Close Queue"
        >
          <X size={16} />
        </button>
      </div>

      {/* Queue items list */}
      <div
        className="queue-drawer-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {queue.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 16px',
              color: '#94a3b8',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CustomIcon size={28} stroke="#cbd5e1" />
            <span>Queue is empty. Play any track to start listening.</span>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={track.id || track.filePath || idx}
                onClick={() => onSelectTrack?.(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isCurrent ? '#f5f3ff' : 'transparent',
                  border: isCurrent ? '1px solid #ede9fe' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: isCurrent ? '#7c5cbf' : '#94a3b8',
                    width: '18px',
                    textAlign: 'center',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {idx + 1}
                </span>

                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {track.artworkUrl || track.coverArt ? (
                    <img
                      src={track.artworkUrl || track.coverArt}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <CustomIcon size={16} stroke="#7c5cbf" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? '#7c5cbf' : '#0f172a',
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
                      fontSize: '11px',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px',
                    }}
                  >
                    {track.artist || 'Unknown Artist'}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                  }}
                >
                  {formatTime(track.duration)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {queue.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClearQueue}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={13} />
            <span>Clear Queue</span>
          </button>
        </div>
      )}
    </aside>
  );
}
