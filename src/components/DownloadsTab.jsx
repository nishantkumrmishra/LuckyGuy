import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Play,
  FolderOpen,
  X,
  Pause,
  ArrowDownToLine,
  Search,
  Clipboard,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
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
  downloadFolder,
  onNavigateToHome,
  onNavigateToLibrary,
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('MP3 320k');
  const [selectedQuality, setSelectedQuality] = useState('320kbps');
  const [showConfig, setShowConfig] = useState(true);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const detectPlatform = (text) => {
    if (!text || !text.trim()) return { name: 'URL', color: 'var(--text-secondary)', bg: 'var(--bg-main)' };
    const lower = text.toLowerCase().trim();
    if (lower.includes('spotify.com')) {
      return { name: 'Spotify', color: '#1db954', bg: 'rgba(29, 185, 84, 0.12)' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { name: 'YouTube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
    }
    if (lower.includes('jiosaavn.com')) {
      return { name: 'JioSaavn', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
    }
    if (lower.includes('soundcloud.com')) {
      return { name: 'SoundCloud', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
    }
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return { name: 'Direct URL', color: 'var(--primary, #7c5cbf)', bg: 'rgba(124, 92, 191, 0.12)' };
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
              Music Downloader
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
            title={'Detected source: ' + platform.name}
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
                height: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 400,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />

            {urlInput ? (
              <button
                onClick={() => setUrlInput('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear input"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                onClick={handlePaste}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Paste from clipboard"
              >
                <Clipboard size={12} color="var(--primary, #7c5cbf)" />
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleTriggerDownload}
            disabled={!hasInput}
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              backgroundColor: hasInput ? 'var(--primary, #7c5cbf)' : 'var(--bg-main)',
              color: hasInput ? '#ffffff' : 'var(--text-muted)',
              border: hasInput ? 'none' : '1px solid var(--border-medium)',
              cursor: hasInput ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: hasInput ? '0 2px 10px rgba(124, 92, 191, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={15} />
            <span>Download</span>
          </button>
        </div>

        {/* Configuration Bar */}
        {showConfig && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-medium)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Format Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Format:
                </span>
                {['MP3 320k', 'FLAC', 'M4A 256k'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: selectedFormat === fmt ? 600 : 400,
                      backgroundColor: selectedFormat === fmt ? 'rgba(124, 92, 191, 0.15)' : 'var(--bg-main)',
                      color: selectedFormat === fmt ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
                      border: selectedFormat === fmt ? '1px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Quality Preset */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Bitrate:
                </span>
                {['320kbps', '256kbps', '192kbps'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: selectedQuality === q ? 600 : 400,
                      backgroundColor: selectedQuality === q ? 'rgba(124, 92, 191, 0.15)' : 'var(--bg-main)',
                      color: selectedQuality === q ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
                      border: selectedQuality === q ? '1px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>Length: Auto-detected from source</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Ongoing Active Downloads Header & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Tasks & History
          </h2>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: activeDownloads.length > 0 ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-card)',
              color: activeDownloads.length > 0 ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
            }}
          >
            {activeDownloads.length > 0 ? (activeDownloads.length + ' downloading') : 'Idle'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeDownloads.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={onPauseAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Pause all ongoing downloads"
              >
                <Pause size={13} />
                <span>Pause All</span>
              </button>

              <button
                onClick={onResumeAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(124, 92, 191, 0.1)',
                  border: '1px solid var(--primary, #7c5cbf)',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Resume/continue all downloads"
              >
                <Play size={13} fill="currentColor" />
                <span>Resume All</span>
              </button>
            </div>
          )}

          {onOpenFolder && (
            <button
              onClick={() => onOpenFolder(downloadFolder)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title="Open Music folder in Windows Explorer"
            >
              <FolderOpen size={13} />
              <span>Open Music Folder</span>
            </button>
          )}

          {completedDownloads.length > 0 && (
            <button
              onClick={onClearCompleted}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Move completed downloads to Trash"
            >
              <Trash2 size={13} />
              <span>Trash Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. ACTIVE DOWNLOAD TASKS */}
      {activeDownloads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {'Active Tasks (' + activeDownloads.length + ')'}
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(124, 92, 191, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Download size={15} color="var(--primary, #7c5cbf)" />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {(task.artist || 'Downloading...') + ' • ' + (task.speed || 'Downloading') + ' • ' + (task.size || '')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary, #7c5cbf)' }}>
                      {(task.progress || 0) + '%'}
                    </span>

                    <button
                      onClick={() => onCancelDownload?.(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Cancel download"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: (task.progress || 0) + '%',
                      height: '100%',
                      backgroundColor: 'var(--primary, #7c5cbf)',
                      borderRadius: '999px',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. COMPLETED DOWNLOADS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {'Completed (' + completedDownloads.length + ')'}
        </div>

        {completedDownloads.length === 0 && activeDownloads.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px dashed var(--border-medium)',
            }}
          >
            <ArrowDownToLine size={28} color="var(--primary, #7c5cbf)" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>
              No downloads yet
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
              Paste a link in the box above to download your first song directly to your computer.
            </span>
          </div>
        ) : completedDownloads.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Download in progress... Completed files will appear here and in your Library.
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              overflow: 'hidden',
            }}
          >
            {completedDownloads.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: idx === completedDownloads.length - 1 ? 'none' : '1px solid var(--border-light, rgba(0,0,0,0.04))',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
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
                    {item.artworkUrl ? (
                      <img src={item.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <CustomIcon size={16} stroke="var(--primary, #7c5cbf)" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {item.artist + ' • ' + (item.size || '8.5 MB') + ' • ' + (item.format || 'MP3 320k')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => onPlayTrack?.(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(124, 92, 191, 0.1)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--primary, #7c5cbf)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Play track"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Play</span>
                  </button>

                  {onOpenFolder && (
                    <button
                      onClick={() => onOpenFolder(item.filePath)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Show file in Windows Explorer"
                    >
                      <FolderOpen size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteDownload?.(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Move to Trash"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
