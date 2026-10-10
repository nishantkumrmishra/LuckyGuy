import React, { useState, useMemo } from 'react';
import CustomVideoPlayer from './CustomVideoPlayer';
import {
  Film,
  Play,
  Search,
  FolderOpen,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Clock,
  HardDrive,
  CheckCircle2,
  X,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Eye,
  Video
} from 'lucide-react';
import { DuoVideo } from './DuoIcons';

export default function VideoStreamingTab({
  videos = [],
  activeVideo = null,
  onPlayVideo,
  onClosePlayer,
  onDeleteVideo,
  onRefreshVideos,
  onOpenFolder,
  downloadFolder = 'C:\\Users\
ishant\\Videos',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'size'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-scan / refresh video list on component mount
  useEffect(() => {
    if (onRefreshVideos) {
      onRefreshVideos();
    }
  }, []);

  // Total downloaded size calculation
  const totalSizeBytes = useMemo(() => {
    return videos.reduce((acc, v) => acc + (v.fileSize || 0), 0);
  }, [videos]);

  const totalFormattedSize = useMemo(() => {
    if (totalSizeBytes > 1024 * 1024 * 1024) {
      return (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    return (totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, [totalSizeBytes]);

  // Filter & Sort
  const filteredVideos = useMemo(() => {
    let list = [...videos];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          (v.title || '').toLowerCase().includes(q) ||
          (v.artist || '').toLowerCase().includes(q) ||
          (v.quality || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'size') {
      list.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    }

    return list;
  }, [videos, searchQuery, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshVideos) {
      await onRefreshVideos();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleDelete = (video, e) => {
    e?.stopPropagation();
    if (deleteConfirmId === video.id) {
      if (onDeleteVideo) onDeleteVideo(video);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(video.id);
      setTimeout(() => {
        setDeleteConfirmId((prev) => (prev === video.id ? null : prev));
      }, 4000);
    }
  };

  // =========================================================================
  // 1. IN-PAGE WATCH / STREAMING MODE
  // =========================================================================
  if (activeVideo) {
    const sideVideos = filteredVideos.filter((v) => v.id !== activeVideo.id);

    return (
      <div
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-main, #0f0f13)',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {/* Watch Top Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 28px',
            borderBottom: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-card, #141419)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <button
              onClick={() => onClosePlayer && onClosePlayer()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(124, 92, 191, 0.12)',
                border: '1px solid var(--primary, #7c5cbf)',
                color: 'var(--primary, #7c5cbf)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Return to Video Library"
            >
              <ArrowLeft size={15} />
              <span>Back to Library</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '750px',
                }}
                title={activeVideo.title}
              >
                {activeVideo.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Local Video Stream</span>
                <span>•</span>
                <span>{activeVideo.quality || '1080p'}</span>
                <span>•</span>
                <span>{activeVideo.formattedSize || 'HD'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeVideo.filePath && onOpenFolder && (
              <button
                onClick={() => onOpenFolder(activeVideo.filePath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                title="Open containing folder in File Explorer"
              >
                <FolderOpen size={14} />
                <span>Show in Explorer</span>
              </button>
            )}
          </div>
        </div>

        {/* Watch Content Columns */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '24px 28px',
            gap: '24px',
            maxWidth: '1800px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Column (74%): Player + Info */}
          <div style={{ flex: '0 0 74%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CustomVideoPlayer
              video={activeVideo}
              onBack={() => onClosePlayer && onClosePlayer()}
              initialQuality={activeVideo.quality || '1080p'}
            />

            {/* Video Details Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h1
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {activeVideo.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-light, rgba(255,255,255,0.06))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(124, 92, 191, 0.15)',
                      border: '1px solid var(--primary, #7c5cbf)',
                      color: 'var(--primary, #7c5cbf)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    <DuoVideo size={18} active={true} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {activeVideo.artist || 'Video Creator'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Indexed in {activeVideo.album || 'Videos'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(124, 92, 191, 0.12)',
                      color: 'var(--primary, #7c5cbf)',
                      border: '1px solid rgba(124, 92, 191, 0.25)',
                    }}
                  >
                    {activeVideo.quality || '1080p HD'}
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {activeVideo.formattedSize}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginLeft: '6px',
                    }}
                  >
                    Downloaded {activeVideo.dateFormatted}
                  </span>

                  {/* Delete button inside watch view */}
                  <button
                    onClick={(e) => handleDelete(activeVideo, e)}
                    style={{
                      marginLeft: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: deleteConfirmId === activeVideo.id ? '#ef4444' : 'transparent',
                      border: '1px solid ' + (deleteConfirmId === activeVideo.id ? '#ef4444' : 'var(--border-medium)'),
                      color: deleteConfirmId === activeVideo.id ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Delete downloaded video"
                  >
                    <Trash2 size={13} />
                    <span>{deleteConfirmId === activeVideo.id ? 'Confirm Delete?' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (26%): More Downloaded Videos List */}
          <div style={{ flex: '0 0 26%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>More Videos ({sideVideos.length})</span>
              <Film size={14} color="var(--primary, #7c5cbf)" />
            </div>

            {sideVideos.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px dashed var(--border-medium)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                No other videos downloaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sideVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onPlayVideo && onPlayVideo(item)}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.04))';
                      e.currentTarget.style.borderColor = 'var(--primary, #7c5cbf)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                    }}
                  >
                    {/* Mini Thumbnail */}
                    <div
                      style={{
                        width: '100px',
                        height: '58px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        flexShrink: 0,
                        position: 'relative',
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
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)',
                          }}
                        >
                          <Film size={20} color="var(--primary, #7c5cbf)" />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '3px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          color: '#ffffff',
                          fontSize: '9.5px',
                          fontWeight: 700,
                        }}
                      >
                        {item.quality || 'HD'}
                      </div>
                    </div>

                    {/* Mini Text Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {item.formattedSize}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. VIDEO LIBRARY OVERVIEW GRID VIEW
  // =========================================================================
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
      {/* Top Toolbar / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(124, 92, 191, 0.12)',
              border: '1px solid rgba(124, 92, 191, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #7c5cbf)',
            }}
          >
            <DuoVideo size={22} active={true} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                Videos
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(124, 92, 191, 0.15)',
                  color: 'var(--primary, #7c5cbf)',
                }}
              >
                {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Index of all downloaded videos ready for in-app playback • {totalFormattedSize} total storage
            </div>
          </div>
        </div>

        {/* Right Controls: Search, Sort, Open Folder, Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: '240px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '0 10px',
            }}
          >
            <Search size={14} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search downloaded videos..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: '34px',
              padding: '0 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="recent">Recently Downloaded</option>
            <option value="title">Title (A-Z)</option>
            <option value="size">File Size (Largest)</option>
          </select>

          {/* Open Folder Button */}
          {onOpenFolder && (
            <button
              onClick={() => onOpenFolder(downloadFolder)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Open Videos folder in Windows Explorer"
            >
              <FolderOpen size={14} />
              <span>Open Folder</span>
            </button>
          )}

          {/* Refresh Index Button */}
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              padding: '0 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Re-scan and update video index"
          >
            <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      {filteredVideos.length === 0 ? (
        <div
          style={{
            padding: '70px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(124, 92, 191, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #7c5cbf)',
            }}
          >
            <DuoVideo size={30} active={true} />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {searchQuery ? 'No matching videos found' : 'No Videos Downloaded Yet'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: '1.5' }}>
            {searchQuery
              ? `No videos match "${searchQuery}". Try a different search term or clear the filter.`
              : 'Whenever you download videos from video plugins or direct links, they will automatically be indexed here ready for seamless in-app playback.'}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                marginTop: '8px',
                padding: '7px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #7c5cbf)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '20px',
            width: '100%',
          }}
        >
          {filteredVideos.map((video) => {
            const isConfirmingDelete = deleteConfirmId === video.id;

            return (
              <div
                key={video.id}
                onClick={() => onPlayVideo && onPlayVideo(video)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 92, 191, 0.18)';
                  e.currentTarget.style.borderColor = 'var(--primary, #7c5cbf)';
                  const playOverlay = e.currentTarget.querySelector('.video-card-play-overlay');
                  if (playOverlay) playOverlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  const playOverlay = e.currentTarget.querySelector('.video-card-play-overlay');
                  if (playOverlay) playOverlay.style.opacity = '0';
                }}
              >
                {/* 16:9 Thumbnail Area */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                    backgroundColor: '#0a0a0f',
                    overflow: 'hidden',
                  }}
                >
                  {video.artworkUrl ? (
                    <img
                      src={video.artworkUrl}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #181824 0%, #291a3a 100%)',
                      }}
                    >
                      <Film size={34} color="var(--primary, #7c5cbf)" style={{ opacity: 0.8 }} />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        Local Video Stream
                      </span>
                    </div>
                  )}

                  {/* Play Button Overlay on Hover */}
                  <div
                    className="video-card-play-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary, #7c5cbf)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(124, 92, 191, 0.6)',
                        transform: 'scale(1)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Play size={24} fill="#ffffff" style={{ marginLeft: '3px' }} />
                    </div>
                  </div>

                  {/* Top-Left Quality Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      zIndex: 3,
                    }}
                  >
                    {video.quality || '1080p'}
                  </div>

                  {/* Bottom-Right Size / Indicator Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 600,
                      zIndex: 3,
                    }}
                  >
                    {video.formattedSize}
                  </div>
                </div>

                {/* Card Info Body */}
                <div
                  style={{
                    padding: '12px 14px 14px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: '1.35',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '36px',
                    }}
                    title={video.title}
                  >
                    {video.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: 'auto',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-light, rgba(255,255,255,0.05))',
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '140px',
                      }}
                    >
                      {video.artist || 'Creator'}
                    </span>

                    <span>{video.dateFormatted}</span>
                  </div>

                  {/* Action Icons Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onPlayVideo && onPlayVideo(video)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(124, 92, 191, 0.12)',
                        border: '1px solid rgba(124, 92, 191, 0.3)',
                        color: 'var(--primary, #7c5cbf)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Play</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {video.filePath && onOpenFolder && (
                        <button
                          onClick={() => onOpenFolder(video.filePath)}
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
                          title="Show in Folder"
                        >
                          <FolderOpen size={14} />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(video, e)}
                        style={{
                          background: isConfirmingDelete ? '#ef4444' : 'transparent',
                          border: isConfirmingDelete ? '1px solid #ef4444' : 'none',
                          color: isConfirmingDelete ? '#ffffff' : 'var(--text-muted)',
                          padding: isConfirmingDelete ? '2px 6px' : '4px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '11px',
                          gap: '3px',
                        }}
                        title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete video'}
                      >
                        <Trash2 size={13} />
                        {isConfirmingDelete && <span>Delete?</span>}
                      </button>
                    </div>
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
