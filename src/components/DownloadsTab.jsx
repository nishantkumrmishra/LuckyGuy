import React, { useState, useEffect, useRef } from 'react';
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
  CheckSquare,
  Square
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
  downloadFolder = 'C:\\Users\
ishant\\Music',
  onNavigateToHome,
  onNavigateToLibrary,
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('MP3 320k');
  const [selectedQuality, setSelectedQuality] = useState('320kbps');
  const [showConfig, setShowConfig] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const containerRef = useRef(null);

  // Read installed extensions
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

    for (const ext of installedExtensions) {
      if (ext.enabled) {
        const extNameLower = (ext.name || '').toLowerCase();
        if (extNameLower.includes('youtube') && (lower.includes('youtube.com') || lower.includes('youtu.be'))) {
          return { name: ext.name || 'YouTube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
        }
        if (extNameLower.includes('spotify') && lower.includes('spotify.com')) {
          return { name: ext.name || 'Spotify', color: '#1db954', bg: 'rgba(29, 185, 84, 0.12)' };
        }
        if (extNameLower.includes('jiosaavn') && lower.includes('jiosaavn.com')) {
          return { name: ext.name || 'JioSaavn', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
        }
        if (extNameLower.includes('soundcloud') && lower.includes('soundcloud.com')) {
          return { name: ext.name || 'SoundCloud', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
        }
      }
    }

    if (lower.includes('spotify.com')) return { name: 'Spotify', color: '#1db954', bg: 'rgba(29, 185, 84, 0.12)' };
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return { name: 'YouTube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
    if (lower.includes('jiosaavn.com')) return { name: 'JioSaavn', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
    if (lower.includes('soundcloud.com')) return { name: 'SoundCloud', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
    if (lower.startsWith('http://') || lower.startsWith('https://')) return { name: 'Direct Stream', color: 'var(--primary, #7c5cbf)', bg: 'rgba(124, 92, 191, 0.12)' };
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

  // Format date helper
  const formatDate = (item) => {
    if (item.downloadedAt && item.downloadedAt !== 'Already Exists') {
      try {
        const d = new Date(item.downloadedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {}
      return String(item.downloadedAt);
    }
    if (item.timestamp) {
      try {
        return new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }
    return 'Recent';
  };

  // Keyboard listeners: Ctrl+A (Select All), Delete (Delete selected), Escape (Deselect)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allIds = new Set(completedDownloads.map((d) => d.id));
        setSelectedIds(allIds);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completedDownloads, selectedIds]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Selection handlers
  const handleItemClick = (e, item) => {
    const id = item.id;
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastSelectedId(id);
    } else if (e.shiftKey && lastSelectedId) {
      const currentIndex = completedDownloads.findIndex((d) => d.id === id);
      const lastIndex = completedDownloads.findIndex((d) => d.id === lastSelectedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          rangeIds.add(completedDownloads[i].id);
        }
        setSelectedIds(rangeIds);
      }
    } else {
      setSelectedIds(new Set([id]));
      setLastSelectedId(id);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.size === completedDownloads.length && completedDownloads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(completedDownloads.map((d) => d.id)));
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    let idsToOperate = Array.from(selectedIds);
    if (!selectedIds.has(item.id)) {
      setSelectedIds(new Set([item.id]));
      idsToOperate = [item.id];
    }

    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 150),
      ids: idsToOperate,
      targetItem: item,
    });
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (onDeleteDownload) {
      onDeleteDownload(ids);
    }
    setSelectedIds(new Set());
    setContextMenu(null);
  };

  const isAllSelected = completedDownloads.length > 0 && selectedIds.size === completedDownloads.length;

  return (
    <div
      ref={containerRef}
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
        userSelect: 'none',
      }}
    >
      {/* 1. Downloader Header & URL Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Downloads Manager
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginTop: '3px',
                marginBottom: 0,
              }}
            >
              Download audio tracks and playlists with automatic 320kbps high fidelity audio stream conversion.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <span>{showConfig ? 'Hide Config' : 'Audio Options'}</span>
            </button>
          </div>
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
              height: '40px',
              padding: '0 14px',
              borderRadius: '9px',
              backgroundColor: platform.bg,
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: platform.color,
              flexShrink: 0,
              minWidth: '80px',
              transition: 'all 0.2s ease',
            }}
            title={'Engine: ' + platform.name}
          >
            <span>{platform.name}</span>
          </div>

          {/* Main URL Text Field */}
          <div
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '9px',
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
            <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />

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
                  fontSize: '11px',
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
              height: '40px',
              padding: '0 18px',
              borderRadius: '9px',
              backgroundColor: hasInput ? 'var(--primary, #7c5cbf)' : 'var(--bg-main)',
              color: hasInput ? '#ffffff' : 'var(--text-muted)',
              border: hasInput ? 'none' : '1px solid var(--border-medium)',
              cursor: hasInput ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: hasInput ? '0 2px 8px rgba(124, 92, 191, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={14} />
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
              paddingTop: '10px',
              borderTop: '1px solid var(--border-medium)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Format:
                </span>
                {['MP3 320k', 'FLAC', 'M4A 256k'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Bitrate:
                </span>
                {['320kbps', '256kbps', '192kbps'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
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

            {onOpenFolder && (
              <button
                onClick={() => onOpenFolder(downloadFolder)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
                title="Open destination folder"
              >
                <FolderOpen size={13} />
                <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {downloadFolder}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Ongoing Active Downloads */}
      {activeDownloads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Downloading
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(124, 92, 191, 0.12)',
                  color: 'var(--primary, #7c5cbf)',
                }}
              >
                {activeDownloads.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onPauseAll && (
                <button
                  onClick={onPauseAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Pause all"
                >
                  <Pause size={12} />
                  <span>Pause</span>
                </button>
              )}
              {onResumeAll && (
                <button
                  onClick={onResumeAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(124, 92, 191, 0.1)',
                    border: '1px solid var(--primary, #7c5cbf)',
                    color: 'var(--primary, #7c5cbf)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Resume all"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Resume</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeDownloads.map((task) => (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
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
                      <Download size={14} color="var(--primary, #7c5cbf)" />
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
                        {(task.artist || 'Downloading...') + ' \u2022 ' + (task.speed || 'Downloading') + ' \u2022 ' + (task.size || '')}
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

      {/* 3. Completed Downloads Manager Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {'Downloaded Files (' + completedDownloads.length + ')'}
            </span>

            {selectedIds.size > 0 && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--primary, #7c5cbf)',
                  backgroundColor: 'rgba(124, 92, 191, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {selectedIds.size + ' selected'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedIds.size > 0 ? (
              <>
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Delete selected items (or press Delete key)"
                >
                  <Trash2 size={13} />
                  <span>{'Delete Selected (' + selectedIds.size + ')'}</span>
                </button>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Deselect
                </button>
              </>
            ) : (
              completedDownloads.length > 0 && (
                <button
                  onClick={onClearCompleted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title="Delete all completed downloads"
                >
                  <Trash2 size={13} />
                  <span>Delete All</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Clean Downloads Table */}
        {completedDownloads.length === 0 && activeDownloads.length === 0 ? (
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
            <ArrowDownToLine size={32} color="var(--primary, #7c5cbf)" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No downloads yet
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
              Paste a link above to download music directly into your library.
            </div>
          </div>
        ) : completedDownloads.length > 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12.5px',
              }}
            >
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
                  <th style={{ width: '40px', padding: '10px 12px', textAlign: 'center' }}>
                    <div
                      onClick={handleSelectAllToggle}
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={isAllSelected ? 'Deselect all' : 'Select all (Ctrl+A)'}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={15} color="var(--primary, #7c5cbf)" />
                      ) : selectedIds.size > 0 ? (
                        <Square size={15} color="var(--primary, #7c5cbf)" fill="rgba(124, 92, 191, 0.2)" />
                      ) : (
                        <Square size={15} color="var(--text-muted)" />
                      )}
                    </div>
                  </th>
                  <th style={{ padding: '10px 12px' }}>Name / Title</th>
                  <th style={{ padding: '10px 12px' }}>Artist</th>
                  <th style={{ padding: '10px 12px', width: '130px' }}>Date</th>
                  <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>Format</th>
                  <th style={{ padding: '10px 12px', width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedDownloads.map((item, idx) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id || idx}
                      onClick={(e) => handleItemClick(e, item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      style={{
                        borderBottom: idx === completedDownloads.length - 1 ? 'none' : '1px solid var(--border-light, rgba(0,0,0,0.04))',
                        backgroundColor: isSelected
                          ? 'rgba(124, 92, 191, 0.09)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(0,0,0,0.02))';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td
                        style={{ textAlign: 'center', padding: '10px 12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                          setLastSelectedId(item.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={15} color="var(--primary, #7c5cbf)" />
                        ) : (
                          <Square size={15} color="var(--text-muted)" />
                        )}
                      </td>

                      {/* Title & Artwork */}
                      <td style={{ padding: '10px 12px' }}>
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
                            {item.artworkUrl ? (
                              <img src={item.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <CustomIcon size={15} stroke="var(--primary, #7c5cbf)" />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '320px',
                              }}
                            >
                              {item.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          {item.artist || 'Unknown Artist'}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {formatDate(item)}
                      </td>

                      {/* Format */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.format || 'MP3 320k'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onPlayTrack && onPlayTrack(item)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary, #7c5cbf)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Play track"
                          >
                            <Play size={14} fill="currentColor" />
                          </button>

                          {onOpenFolder && (
                            <button
                              onClick={() => onOpenFolder(item.filePath || item.destinationPath)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Show in folder"
                          >
                            <FolderOpen size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteDownload && onDeleteDownload(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete download"
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
      ) : null}
    </div>

    {/* Right-click Context Menu */}
    {contextMenu && (
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 9999,
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '160px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '6px 10px',
            borderBottom: '1px solid var(--border-medium)',
          }}
        >
          {contextMenu.ids.length === 1
            ? contextMenu.targetItem?.title || '1 Item'
            : contextMenu.ids.length + ' Items Selected'}
        </div>

        {contextMenu.ids.length === 1 && onPlayTrack && (
          <button
            onClick={() => {
              onPlayTrack(contextMenu.targetItem);
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Play size={13} fill="currentColor" />
            <span>Play</span>
          </button>
        )}

        {contextMenu.ids.length === 1 && onOpenFolder && (
          <button
            onClick={() => {
              onOpenFolder(contextMenu.targetItem?.filePath || contextMenu.targetItem?.destinationPath);
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <FolderOpen size={13} />
            <span>Show in Folder</span>
          </button>
        )}

        <button
          onClick={() => {
            handleDeleteSelected();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            border: 'none',
            background: 'transparent',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 500,
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Trash2 size={13} />
          <span>{contextMenu.ids.length > 1 ? 'Delete ' + contextMenu.ids.length + ' Items' : 'Delete'}</span>
        </button>
      </div>
    )}
  </div>
);
}