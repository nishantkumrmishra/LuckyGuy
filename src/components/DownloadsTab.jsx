import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Square,
  Music,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key
} from 'lucide-react';

export default function DownloadsTab({
  activeDownloads = [],
  completedDownloads = [],
  onStartDownload,
  onPauseDownload,
  onResumeDownload,
  onPauseAll,
  onResumeAll,
  onCancelDownload,
  onCancelAll,
  onClearCompleted,
  onDeleteDownload,
  onPlayTrack,
  onOpenFolder,
  downloadFolder = 'C:\\Users\\nishant\\Music',
  onNavigateToHome,
  onNavigateToLibrary,
  preferences = {},
  onSavePreferences,
  installedExtensions = [],
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('MP3 320k');
  const [mediaDownloadMode, setMediaDownloadMode] = useState('auto'); // 'auto' | 'audio' | 'video'
  const [selectedQuality, setSelectedQuality] = useState('320kbps');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'downloading' | 'completed'

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const containerRef = useRef(null);

  // Uses active installedExtensions passed from App state

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch (e) {}
  };

  const detectPlatform = (text, mode = 'auto') => {
    if (!text || !text.trim()) {
      if (mode === 'audio') return { name: 'Audio (Music)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', detectedType: 'audio' };
      if (mode === 'video') return { name: 'Video (MP4)', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', detectedType: 'video' };
      return { name: 'Stream', color: 'var(--text-secondary)', bg: 'var(--bg-main)', detectedType: 'audio' };
    }
    const lower = text.toLowerCase().trim();

    if (lower.includes('spotify.com')) {
      return { name: 'Spotify Music', color: '#1db954', bg: 'rgba(29, 185, 84, 0.12)', detectedType: 'audio' };
    }
    if (lower.includes('jiosaavn.com')) {
      return { name: 'JioSaavn 320k', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', detectedType: 'audio' };
    }
    if (lower.includes('pornhub.com') || lower.includes('phncdn.com')) {
      return { name: 'Pornhub Video', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', detectedType: 'video' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      if (mode === 'audio' || lower.includes('music.youtube.com')) {
        return { name: 'YouTube Audio', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', detectedType: 'audio' };
      }
      return { name: 'YouTube Video', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', detectedType: 'video' };
    }
    if (lower.includes('soundcloud.com')) {
      return { name: 'SoundCloud Audio', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', detectedType: 'audio' };
    }
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      if (mode === 'video' || /\.(mp4|mkv|webm|avi|mov)(\?|$)/i.test(lower)) {
        return { name: 'Video Stream', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', detectedType: 'video' };
      }
      return { name: 'Audio Stream', color: 'var(--primary, #7c5cbf)', bg: 'rgba(124, 92, 191, 0.12)', detectedType: 'audio' };
    }
    return { name: 'Search Song', color: 'var(--text-secondary)', bg: 'var(--bg-main)', detectedType: 'audio' };
  };

  const platform = detectPlatform(urlInput, mediaDownloadMode);

  const handleTriggerDownload = () => {
    const raw = urlInput.trim();
    if (!raw) return;

    const plat = detectPlatform(raw, mediaDownloadMode);
    const effectiveType = mediaDownloadMode === 'auto'
      ? (plat.detectedType || 'audio')
      : mediaDownloadMode;

    const isVideo = effectiveType === 'video';

    if (onStartDownload) {
      onStartDownload(raw, {
        formatType: isVideo ? 'VIDEO' : 'AUDIO',
        mediaType: isVideo ? 'video' : 'audio',
        format: isVideo ? 'MP4 1080p' : 'MP3 320k',
        quality: isVideo ? '1080p HD' : '320kbps',
      });
    }
    setUrlInput('');
  };

  const hasInput = urlInput.trim().length > 0;

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB';
    }
    return mb.toFixed(1) + ' MB';
  };

  // Determine media type for thumbnail & badge
  const getMediaType = (item) => {
    if (item.formatType === 'AUDIO' || (item.format && /mp3|m4a|flac|320k/i.test(item.format))) {
      return { type: 'audio', label: 'MP3', Icon: Music, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    if (item.formatType === 'VIDEO' || (item.format && /mp4|1080p|720p|video/i.test(item.format))) {
      return { type: 'video', label: 'MP4', Icon: Film, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
    }
    const raw = (item.filePath || item.destinationPath || item.title || '').toLowerCase();
    if (raw.endsWith('.m4a') || raw.endsWith('.mp3') || (item.destinationPath && item.destinationPath.includes('Music'))) {
      return { type: 'audio', label: 'MP3', Icon: Music, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    if (raw.endsWith('.mp4') || raw.endsWith('.mkv') || raw.endsWith('.webm')) {
      return { type: 'video', label: 'MP4', Icon: Film, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
    }
    if (raw.endsWith('.jpg') || raw.endsWith('.jpeg') || raw.endsWith('.png') || raw.endsWith('.webp')) {
      return { type: 'image', label: 'IMAGE', Icon: ImageIcon, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    return { type: 'audio', label: item.format || 'MP3', Icon: Music, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  };

  // Normalized list of items according to current tab filter
  const allVisibleItems = useMemo(() => {
    const activeList = activeDownloads.map((task) => ({
      ...task,
      isActive: true,
      displayStatus: task.status === 'paused' ? 'paused' : 'downloading',
    }));
    const completedList = completedDownloads.map((item) => ({
      ...item,
      isActive: false,
      displayStatus: 'completed',
    }));

    if (filterTab === 'downloading') return activeList;
    if (filterTab === 'completed') return completedList;
    return [...activeList, ...completedList];
  }, [activeDownloads, completedDownloads, filterTab]);

  // Keyboard listeners: Ctrl+A, Delete, Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allIds = new Set(allVisibleItems.map((d) => d.id));
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
  }, [allVisibleItems, selectedIds]);

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
      const currentIndex = allVisibleItems.findIndex((d) => d.id === id);
      const lastIndex = allVisibleItems.findIndex((d) => d.id === lastSelectedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          rangeIds.add(allVisibleItems[i].id);
        }
        setSelectedIds(rangeIds);
      }
    } else {
      setSelectedIds(new Set([id]));
      setLastSelectedId(id);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.size === allVisibleItems.length && allVisibleItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleItems.map((d) => d.id)));
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
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200),
      ids: idsToOperate,
      targetItem: item,
    });
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const completedIds = ids.filter((id) => completedDownloads.some((c) => c.id === id));
    const activeIds = ids.filter((id) => activeDownloads.some((a) => a.id === id));

    if (completedIds.length > 0 && onDeleteDownload) {
      onDeleteDownload(completedIds);
    }
    if (activeIds.length > 0 && onCancelDownload) {
      activeIds.forEach((id) => onCancelDownload(id));
    }

    setSelectedIds(new Set());
    setContextMenu(null);
  };

  const isAllSelected = allVisibleItems.length > 0 && selectedIds.size === allVisibleItems.length;

  return (
    <div
      ref={containerRef}
      className="content-area fade-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px 160px 32px',
        boxSizing: 'border-box',
        maxHeight: '100%',
        scrollBehavior: 'smooth',
        backgroundColor: 'var(--bg-main, #f5f5f5)',
        overflowY: 'auto',
        height: '100%',
        minHeight: 0,
        gap: '20px',
        fontFamily: 'inherit',
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
              Download and manage media files with high speed multi-threaded transfer.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Segmented Media Download Mode Selector */}
            <div style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: '9px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => setMediaDownloadMode('audio')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: mediaDownloadMode === 'audio' ? 700 : 500,
                  backgroundColor: mediaDownloadMode === 'audio' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: mediaDownloadMode === 'audio' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: mediaDownloadMode === 'audio' ? '0 1px 4px rgba(124, 92, 191, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Save as Audio (Music Library)"
              >
                <Music size={13} />
                <span>Audio (Music)</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaDownloadMode('video')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: mediaDownloadMode === 'video' ? 700 : 500,
                  backgroundColor: mediaDownloadMode === 'video' ? 'var(--primary, #7c5cbf)' : 'transparent',
                  color: mediaDownloadMode === 'video' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: mediaDownloadMode === 'video' ? '0 1px 4px rgba(124, 92, 191, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Save as Video (Videos Folder)"
              >
                <Film size={13} />
                <span>Video (MP4)</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaDownloadMode('auto')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: mediaDownloadMode === 'auto' ? 700 : 500,
                  backgroundColor: mediaDownloadMode === 'auto' ? 'var(--bg-card)' : 'transparent',
                  color: mediaDownloadMode === 'auto' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: mediaDownloadMode === 'auto' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Smart Auto-Detect based on link"
              >
                <Sparkles size={12} color="var(--primary, #7c5cbf)" />
                <span>Auto</span>
              </button>
            </div>

            {onOpenFolder && (
              <button
                onClick={() => onOpenFolder(downloadFolder)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Open Music Folder in File Explorer"
              >
                <FolderOpen size={13} color="var(--primary, #7c5cbf)" />
                <span>Open Folder</span>
              </button>
            )}
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

        </div>

   {/* 2. Download Manager Controls & Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setFilterTab('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filterTab === 'all' ? 'var(--bg-card)' : 'transparent',
              color: filterTab === 'all' ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              border: filterTab === 'all' ? '1px solid var(--border-medium)' : '1px solid transparent',
              boxShadow: filterTab === 'all' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {'All (' + (activeDownloads.length + completedDownloads.length) + ')'}
          </button>

          <button
            onClick={() => setFilterTab('downloading')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filterTab === 'downloading' ? 'var(--bg-card)' : 'transparent',
              color: filterTab === 'downloading' ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              border: filterTab === 'downloading' ? '1px solid var(--border-medium)' : '1px solid transparent',
              boxShadow: filterTab === 'downloading' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {'Downloading (' + activeDownloads.length + ')'}
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: filterTab === 'completed' ? 'var(--bg-card)' : 'transparent',
              color: filterTab === 'completed' ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              border: filterTab === 'completed' ? '1px solid var(--border-medium)' : '1px solid transparent',
              boxShadow: filterTab === 'completed' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {'Completed (' + completedDownloads.length + ')'}
          </button>
        </div>

        {/* Batch Operations */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 1. Single Toggle Button for Pause / Resume All */}
          {activeDownloads.length > 0 && (() => {
            const isAnyActiveRunning = activeDownloads.some(
              (d) => d.status === 'downloading' || d.status === 'queued'
            );
            return isAnyActiveRunning ? (
              <button
                onClick={onPauseAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Pause all active tasks"
              >
                <Pause size={13} />
                <span>Pause All</span>
              </button>
            ) : (
              <button
                onClick={onResumeAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(124, 92, 191, 0.12)',
                  border: '1px solid var(--primary, #7c5cbf)',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Resume all tasks"
              >
                <Play size={13} fill="currentColor" />
                <span>Resume All</span>
              </button>
            );
          })()}

          {/* 2. Cancel Button: Cancel Selected or Cancel All */}
          {selectedIds.size > 0 ? (
            <>
              <button
                onClick={handleDeleteSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Cancel or delete selected items"
              >
                <X size={13} />
                <span>Cancel Selected ({selectedIds.size})</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
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
            activeDownloads.length > 0 && onCancelAll ? (
              <button
                onClick={onCancelAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Cancel all downloading and queued tasks"
              >
                <X size={13} />
                <span>Cancel All</span>
              </button>
            ) : (
              completedDownloads.length > 0 && (
                <button
                  onClick={onClearCompleted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title="Clear all completed download history"
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* 3. Universal Download Manager Table */}
      {allVisibleItems.length === 0 ? (
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
            {filterTab === 'downloading' ? 'No active downloads' : 'No downloads recorded'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
            Paste a media link above to start downloading directly into your library.
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
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
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-main, #f5f5f5)' }}>
              <tr
                style={{
                  borderBottom: '1.5px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {/* Checkbox */}
                <th style={{ width: '40px', padding: '12px 14px', textAlign: 'center' }}>
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

                {/* File Column */}
                <th style={{ padding: '12px 14px' }}>File</th>

                {/* Size & Progress Column */}
                <th style={{ padding: '12px 14px', width: '280px' }}>Size & Progress</th>

                {/* Status Column */}
                <th style={{ padding: '12px 14px', width: '130px', textAlign: 'center' }}>Status</th>

                {/* Actions Column */}
                <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {allVisibleItems.map((item, idx) => {
                const isSelected = selectedIds.has(item.id);
                const isTaskActive = item.isActive;
                const isPaused = item.status === 'paused';
                const isFailed = item.status === 'failed';
                const isQueued = item.status === 'queued';
                const media = getMediaType(item);
                const MediaIcon = media.Icon;

                // Calculate downloaded MB and percentage
                const pct = item.progress !== undefined ? Math.min(100, Math.max(0, Math.round(item.progress))) : (isTaskActive ? 0 : 100);
                const downloadedStr = formatBytes(item.downloadedBytes || 0);
                const totalStr = item.totalBytes && item.totalBytes > 0 ? formatBytes(item.totalBytes) : (item.size || 'Saved');

                return (
                  <tr
                    key={item.id || idx}
                    onClick={(e) => handleItemClick(e, item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    style={{
                      borderBottom: idx === allVisibleItems.length - 1 ? 'none' : '1px solid var(--border-light, rgba(0,0,0,0.04))',
                      backgroundColor: isSelected
                        ? 'rgba(124, 92, 191, 0.09)'
                        : isTaskActive
                        ? 'rgba(124, 92, 191, 0.02)'
                        : 'var(--bg-card, #ffffff)',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(0,0,0,0.02))';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = isTaskActive ? 'rgba(124, 92, 191, 0.02)' : 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <td
                      style={{ textAlign: 'center', padding: '12px 14px' }}
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

                    {/* File / Title with Artwork */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Thumbnail / Artwork */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                        >
                          {item.artworkUrl ? (
                            <img
                              src={item.artworkUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <MediaIcon size={16} color={media.color} />
                          )}
                        </div>

                        {/* Title & File Type Badge */}
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '340px',
                              }}
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: media.bg,
                                color: media.color,
                                letterSpacing: '0.02em',
                              }}
                            >
                              {media.label}
                            </span>
                          </div>

                          {/* File path or speed info */}
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '380px',
                            }}
                          >
                            {isTaskActive
                              ? (isPaused
                                  ? 'Paused'
                                  : (item.speed
                                      ? `${item.speed} • ${item.destinationPath ? 'Folder: ' + item.destinationPath.split(/\\|\//).slice(-2, -1)[0] : 'Processing...'}`
                                      : 'Transferring data...'))
                              : (item.filePath || item.destinationPath || 'Downloaded to Library')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Size & Progress */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {isQueued ? 'In Queue' : isTaskActive ? (downloadedStr + ' / ' + totalStr) : totalStr}
                          </span>
                          <span style={{ fontWeight: 600, color: isPaused ? '#f59e0b' : 'var(--primary, #7c5cbf)' }}>
                            {pct + '%'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            backgroundColor: 'var(--bg-main)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <div
                            style={{
                              width: pct + '%',
                              height: '100%',
                              backgroundColor: isFailed
                                ? '#ef4444'
                                : isPaused
                                ? '#f59e0b'
                                : 'var(--primary, #7c5cbf)',
                              borderRadius: '999px',
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {isFailed ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                          }}
                        >
                          <AlertCircle size={11} />
                          <span>Failed</span>
                        </span>
                      ) : isPaused ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                          }}
                        >
                          <Pause size={11} />
                          <span>Paused</span>
                        </span>
                      ) : isQueued ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Clock size={11} />
                          <span>Queued</span>
                        </span>
                      ) : isTaskActive ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(124, 92, 191, 0.12)',
                            color: 'var(--primary, #7c5cbf)',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary, #7c5cbf)',
                              display: 'inline-block',
                            }}
                          />
                          <span>Downloading</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                          }}
                        >
                          <CheckCircle2 size={11} />
                          <span>Completed</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isTaskActive ? (
                          <>
                            {/* Pause / Resume Button */}
                            {isPaused ? (
                              <button
                                onClick={() => onResumeDownload && onResumeDownload(item.id)}
                                style={{
                                  background: 'rgba(124, 92, 191, 0.1)',
                                  border: '1px solid var(--primary, #7c5cbf)',
                                  color: 'var(--primary, #7c5cbf)',
                                  cursor: 'pointer',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Resume download"
                              >
                                <Play size={13} fill="currentColor" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onPauseDownload && onPauseDownload(item.id)}
                                style={{
                                  background: 'var(--bg-main)',
                                  border: '1px solid var(--border-medium)',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Pause download"
                              >
                                <Pause size={13} />
                              </button>
                            )}

                            {/* Cancel Task Button */}
                            <button
                              onClick={() => onCancelDownload && onCancelDownload(item.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '5px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Cancel download"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Play / Open Button */}
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
                              title={item.formatType === "VIDEO" || item.format?.includes("MP4") ? "Play Video" : "Play"}
                            >
                              <Play size={14} fill="currentColor" />
                            </button>

                            {/* Open in Folder */}
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

                            {/* Delete Button */}
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
                          </>
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

          {contextMenu.ids.length === 1 && !contextMenu.targetItem?.isActive && onPlayTrack && (
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

          {contextMenu.ids.length === 1 && contextMenu.targetItem?.isActive && (
            contextMenu.targetItem?.status === 'paused' ? (
              <button
                onClick={() => {
                  onResumeDownload?.(contextMenu.targetItem.id);
                  setContextMenu(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Play size={13} fill="currentColor" />
                <span>Resume Download</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onPauseDownload?.(contextMenu.targetItem.id);
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
                <Pause size={13} />
                <span>Pause Download</span>
              </button>
            )
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
