import React, { useState, useMemo, useEffect } from 'react';
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
  downloadFolder = 'C:\\Users\\nishant\\Videos',
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
    return mb.toFixed(1) + ' MB';
  };

  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          v.title?.toLowerCase().includes(q) ||
          v.artist?.toLowerCase().includes(q) ||
          v.author?.toLowerCase().includes(q) ||
          v.filePath?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
        return (b.dateModified || b.createdAt || 0) - (a.dateModified || a.createdAt || 0);
      });
  }, [videos, searchQuery, sortBy]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshVideos) {
      await onRefreshVideos();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main, #f8fafc)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
      }}
    >
      {/* If a video is playing in In-App Theater mode */}
      {activeVideo ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClosePlayer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Video Library</span>
            </button>

            {activeVideo.filePath && (
              <button
                onClick={() => onOpenFolder && onOpenFolder(activeVideo.filePath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={14} />
                <span>Show in Explorer</span>
              </button>
            )}
          </div>

          <CustomVideoPlayer
            video={activeVideo}
            onBack={onClosePlayer}
            initialQuality="1080p"
          />

          <div style={{ marginTop: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
              {activeVideo.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{activeVideo.author || activeVideo.artist || 'Downloaded Video'}</span>
              <span>•</span>
              <span>{formatFileSize(activeVideo.fileSize)}</span>
              {activeVideo.durationFormatted && (
                <>
                  <span>•</span>
                  <span>{activeVideo.durationFormatted}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Video Library Dashboard */
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DuoVideo size={24} active={true} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Video Library</h1>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Indexed local videos, downloaded adult content, and streaming media ({videos.length} videos • {formatFileSize(totalSizeBytes)})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleManualRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Scanning...' : 'Scan / Refresh'}</span>
              </button>

              <button
                onClick={() => onOpenFolder && onOpenFolder(downloadFolder)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={14} />
                <span>Open Videos Folder</span>
              </button>
            </div>
          </div>

          {/* Search & Sort Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                padding: '0 12px',
                height: '38px',
                gap: '8px',
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search videos by title or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="recent">Recently Added</option>
                <option value="title">Title (A-Z)</option>
                <option value="size">File Size (Largest)</option>
              </select>
            </div>
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px dashed var(--border-medium)',
              }}
            >
              <Film size={40} color="var(--text-muted)" />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No videos found in library</div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: 0 }}>
                Videos downloaded from plugins or placed into your Videos or Videos/Adult folders will automatically appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredVideos.map((video) => (
                <div
                  key={video.id || video.filePath}
                  onClick={() => onPlayVideo(video)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-medium)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                  className="clean-video-card"
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      backgroundColor: '#111',
                      overflow: 'hidden',
                    }}
                  >
                    {video.thumbnail || video.artworkUrl ? (
                      <img
                        src={video.thumbnail || video.artworkUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#18181b',
                          color: 'var(--primary)',
                        }}
                      >
                        <Film size={32} />
                      </div>
                    )}

                    {/* Play Overlay Icon */}
                    <div
                      className="thumb-play-icon"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary, #7c5cbf)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Play size={20} fill="#fff" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {video.durationFormatted && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {video.durationFormatted}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div
                      title={video.title}
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.35',
                      }}
                    >
                      {video.title}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{video.author || video.artist || 'Local Video'}</span>
                      <span>{formatFileSize(video.fileSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
