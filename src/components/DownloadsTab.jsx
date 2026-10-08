import React, { useState } from 'react';
import {
  Download,
  Search,
  SlidersHorizontal,
  Clock,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Blocks
} from 'lucide-react';
import AppIcon from './AppIcon';
import { CustomIcon } from './DuoIcons';

export default function DownloadsTab({
  activeDownloads = [],
  completedDownloads = [],
  onStartDownload,
  onPauseAll,
  onResumeAll,
  onCancelDownload,
  onClearCompleted,
  onDeleteDownload,
  onPlayTrack,
  onOpenFolder,
  downloadFolder = 'C:\\Users\\nishant\\Music',
  onNavigateToHome,
  onNavigateToLibrary,
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('MP3 320k');
  const [selectedQuality, setSelectedQuality] = useState('320kbps');
  const [showConfig, setShowConfig] = useState(true);

  // Read installed extensions from storage to match dynamic plugins
  const [installedExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const detectPlatform = (text) => {
    if (!text || !text.trim()) return { name: 'Stream', color: 'var(--text-secondary)', bg: 'var(--bg-main)' };
    const lower = text.toLowerCase().trim();

    // Check against installed extensions first
    for (const ext of installedExtensions) {
      if (ext.enabled) {
        const extNameLower = (ext.name || '').toLowerCase();
        if (extNameLower.includes('youtube') && (lower.includes('youtube.com') || lower.includes('youtu.be'))) {
          return { name: ext.name || 'Extension', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
        }
        if (extNameLower.includes('spotify') && lower.includes('spotify.com')) {
          return { name: ext.name || 'Extension', color: '#1db954', bg: 'rgba(29, 185, 84, 0.12)' };
        }
        if (extNameLower.includes('jiosaavn') && lower.includes('jiosaavn.com')) {
          return { name: ext.name || 'Extension', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
        }
        if (extNameLower.includes('soundcloud') && lower.includes('soundcloud.com')) {
          return { name: ext.name || 'Extension', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
        }
      }
    }

    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return { name: 'Extension URL', color: 'var(--primary, #7c5cbf)', bg: 'rgba(124, 92, 191, 0.12)' };
    }
    return { name: 'Search', color: 'var(--text-secondary)', bg: 'var(--bg-main)' };
  };

  const platform = detectPlatform(urlInput);

  const handleTriggerDownload = () => {
    const raw = urlInput.trim();
    if (!raw) return;

    if (onStartDownload) {
      onStartDownload(raw, {
        format: selectedFormat,
        quality: selectedQuality,
      });
    }
    setUrlInput('');
  };

  const hasInput = urlInput.trim().length > 0;

  return (
    <div
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 36px 40px 36px',
        backgroundColor: 'var(--bg-main, #f5f5f5)',
        overflowY: 'auto',
        gap: '24px',
        fontFamily: 'inherit',
      }}
    >
      {/* 1. Downloader Input Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Media Downloader
            </h2>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Download streams, audio tracks, and media playlists using installed extension engines.
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: showConfig ? 'rgba(124, 92, 191, 0.1)' : 'var(--bg-main)',
              color: showConfig ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={13} />
            <span>{showConfig ? 'Hide Config' : 'Configure Audio'}</span>
          </button>
        </div>

        {/* Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
          }}
        >
          {/* Platform Badge */}
          <div
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              backgroundColor: platform.bg,
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12.5px',
              fontWeight: 600,
              color: platform.color,
              flexShrink: 0,
              minWidth: '82px',
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
            title={'Detected engine: ' + platform.name}
          >
            <span>{platform.name}</span>
          </div>

          {/* Main URL Text Field */}
          <div
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-main)',
              border: isFocused ? '1.5px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
              boxShadow: isFocused ? '0 0 0 3px rgba(124, 92, 191, 0.15)' : 'none',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px 0 14px',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
            }}
          >
            <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleTriggerDownload()}
              placeholder="Paste media stream URL, audio link, or search track title..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                height: '100%',
                fontWeight: 500,
              }}
            />

            {!hasInput && (
              <button
                onClick={handlePaste}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Paste
              </button>
            )}
          </div>

          {/* Download Action Button */}
          <button
            onClick={handleTriggerDownload}
            disabled={!hasInput}
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              backgroundColor: hasInput ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: hasInput ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
              flexShrink: 0,
              boxShadow: hasInput ? '0 2px 8px rgba(124, 92, 191, 0.25)' : 'none',
            }}
          >
            <Download size={15} />
            <span>Download</span>
          </button>
        </div>

        {/* Audio Quality Configuration Dropdown Box */}
        {showConfig && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Audio Config:</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                style={{
                  height: '28px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="MP3 320k">MP3 320k (Studio)</option>
                <option value="FLAC Lossless">FLAC Lossless</option>
                <option value="AAC 256k">AAC 256k</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Parallel Chunks:</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--primary, #7c5cbf)',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                8x Threads
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <FolderOpen size={13} />
              <span style={{ fontSize: '11.5px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {downloadFolder}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Active Tasks Section */}
      {activeDownloads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Active Queue ({activeDownloads.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onPauseAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                Pause All
              </button>
              <button
                onClick={onResumeAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                Resume All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeDownloads.map((task) => (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {task.artworkUrl ? (
                        <img src={task.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <CustomIcon size={18} stroke="var(--primary)" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {task.artist} • {task.format}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {task.speed || 'Downloading...'}
                    </span>
                    <button
                      onClick={() => onCancelDownload(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--border-medium)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${task.progress || 10}%`,
                      backgroundColor: 'var(--primary, #7c5cbf)',
                      borderRadius: '2px',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Completed Downloads Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Saved Media ({completedDownloads.length})
          </h3>
          {completedDownloads.length > 0 && (
            <button
              onClick={onClearCompleted}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Clear Finished
            </button>
          )}
        </div>

        {completedDownloads.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Download size={28} color="var(--primary)" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No completed downloads yet
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
              Paste a stream URL or music search query above to download high quality tracks directly to your device.
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
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
                  <th style={{ width: '90px', textAlign: 'center' }}>Format</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedDownloads.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td className="track-title-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {item.artworkUrl ? (
                            <img src={item.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <CustomIcon size={16} stroke="var(--primary)" />
                          )}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.artist}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{item.album}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-medium)', fontSize: '11px' }}>
                        {item.format || 'MP3'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onPlayTrack && onPlayTrack(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Play"
                        >
                          <Play size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteDownload && onDeleteDownload(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
