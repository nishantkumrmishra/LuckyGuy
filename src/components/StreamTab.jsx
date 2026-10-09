import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Shield,
  ShieldAlert,
  Search,
  ExternalLink,
  Film,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Layers,
  ArrowDownToLine,
  Eye,
  RefreshCw,
  FolderDown,
  Sparkles,
  Info
} from 'lucide-react';

export default function StreamTab({
  onStartDownload,
  preferences = {},
  onOpenFolder
}) {
  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [activeStream, setActiveStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-adblock-enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [blockedAdsCount, setBlockedAdsCount] = useState(14);
  const [customAdFilters, setCustomAdFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-custom-adblock-rules');
      return saved ? JSON.parse(saved) : ['*://*.doubleclick.net/*', '*://*.googlesyndication.com/*', '*://*popunder*/*', '*://*adservice*/*'];
    } catch {
      return ['*://*.doubleclick.net/*', '*://*.googlesyndication.com/*', '*://*popunder*/*', '*://*adservice*/*'];
    }
  });
  const [filterInput, setFilterInput] = useState('');
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState(new Set());
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  // Installed Video & Media Extensions
  const [videoExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-extensions');
      const allExts = saved ? JSON.parse(saved) : [];
      return allExts.filter(ext => ext.capabilities?.includes('video') || ext.capabilities?.includes('stream') || ext.name?.toLowerCase().includes('video') || ext.name?.toLowerCase().includes('youtube'));
    } catch {
      return [];
    }
  });

  const toggleAdBlock = () => {
    setIsAdBlockEnabled(prev => {
      const updated = !prev;
      try {
        localStorage.setItem('luckyguy-adblock-enabled', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddCustomFilter = (e) => {
    e.preventDefault();
    if (!filterInput.trim()) return;
    const updated = [filterInput.trim(), ...customAdFilters];
    setCustomAdFilters(updated);
    try {
      localStorage.setItem('luckyguy-custom-adblock-rules', JSON.stringify(updated));
    } catch {}
    setFilterInput('');
  };

  const handleRemoveFilter = (rule) => {
    const updated = customAdFilters.filter(r => r !== rule);
    setCustomAdFilters(updated);
    try {
      localStorage.setItem('luckyguy-custom-adblock-rules', JSON.stringify(updated));
    } catch {}
  };

  const handleLoadStream = (url) => {
    const raw = (url || streamUrlInput).trim();
    if (!raw) return;

    setActiveStream({
      url: raw,
      title: raw.replace(/^https?:\/\//i, '').split('/')[0] + ' Stream',
      isDirectVideo: raw.endsWith('.mp4') || raw.endsWith('.webm') || raw.endsWith('.m3u8')
    });
    setIsPlaying(true);
  };

  // Demo Batch Scanner (Simulates Plugin crawlPage() capability)
  const handleScanWebpage = async () => {
    if (!streamUrlInput.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const dummyItems = Array.from({ length: 12 }).map((_, i) => ({
        id: 'vid-' + (i + 1),
        title: `Video Stream Source #${i + 1} - 1080p HD`,
        duration: '14:2' + (i % 9),
        size: (85 + i * 18) + ' MB',
        thumbnail: `https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=60`,
        url: streamUrlInput.trim() + `&track=${i + 1}`,
      }));
      setScanResult(dummyItems);
      setIsScanning(false);
    }, 1200);
  };

  const handleToggleSelectVideo = (id) => {
    setSelectedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVideos = () => {
    if (!scanResult) return;
    if (selectedVideoIds.size === scanResult.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(scanResult.map(v => v.id)));
    }
  };

  const handleDownloadSelected = () => {
    if (!scanResult || !onStartDownload) return;
    const toDownload = scanResult.filter(v => selectedVideoIds.has(v.id));
    toDownload.forEach(v => {
      onStartDownload(v.url, { format: 'MP4 1080p', quality: '1080p' });
    });
    setSelectedVideoIds(new Set());
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px',
        backgroundColor: 'var(--bg-main, #ffffff)',
        overflowY: 'auto',
        gap: '20px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={22} color="var(--primary, #7c5cbf)" />
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Stream Hub & Video Player</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Unified video stream viewer with backend Ad-Blocker, plugin crawlers, and bulk downloader.
          </p>
        </div>

        {/* Ad Blocker Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleAdBlock}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: `1px solid ${isAdBlockEnabled ? '#10b981' : 'var(--border-medium)'}`,
              backgroundColor: isAdBlockEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
              color: isAdBlockEnabled ? '#10b981' : 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isAdBlockEnabled ? <Shield size={14} color="#10b981" /> : <ShieldAlert size={14} color="var(--text-secondary)" />}
            <span>Ad Blocker: {isAdBlockEnabled ? 'Active' : 'Disabled'}</span>
            {isAdBlockEnabled && (
              <span style={{ fontSize: '10px', backgroundColor: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '10px' }}>
                {blockedAdsCount} Blocked
              </span>
            )}
          </button>

          <button
            onClick={() => setShowFilterSettings(prev => !prev)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Ad Filter Rules Drawer / Modal */}
      {showFilterSettings && (
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Custom Ad-Block Rules & Blacklists</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Blocks popunders, banners, and malicious redirects</span>
          </div>

          <form onSubmit={handleAddCustomFilter} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add ad domain filter (e.g. *://*.tracker.com/*)"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              style={{
                flex: 1,
                height: '32px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#fff',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Filter
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
            {customAdFilters.map((rule, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <code>{rule}</code>
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(rule)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stream Search & Scan Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Paste media stream link, video URL, or website to scan for videos..."
            value={streamUrlInput}
            onChange={(e) => setStreamUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadStream()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <button
          onClick={() => handleLoadStream()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--primary, #7c5cbf)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Play size={13} fill="#fff" />
          <span>Watch Stream</span>
        </button>

        <button
          onClick={handleScanWebpage}
          disabled={isScanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '6px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Layers size={13} />
          <span>{isScanning ? 'Scanning...' : 'Scan 100+ Videos'}</span>
        </button>
      </div>

      {/* Main Video Stream Player Container */}
      {activeStream && (
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            backgroundColor: '#000',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ height: '440px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeStream.isDirectVideo ? (
              <video
                ref={videoRef}
                src={activeStream.url}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                src={activeStream.url}
                title="Stream Player"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>

          <div
            style={{
              padding: '12px 18px',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-medium)',
            }}
          >
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{activeStream.title}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeStream.url}</span>
            </div>

            <button
              onClick={() => onStartDownload?.(activeStream.url, { format: 'MP4 1080p', quality: '1080p' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={13} />
              <span>Download Video</span>
            </button>
          </div>
        </div>
      )}

      {/* Scan Results (Batch Video Downloader) */}
      {scanResult && (
        <div
          style={{
            borderRadius: '10px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-card)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary, #7c5cbf)" />
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Discovered Video Streams ({scanResult.length} items)
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSelectAllVideos}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {selectedVideoIds.size === scanResult.length ? 'Deselect All' : 'Select All'}
              </button>

              {selectedVideoIds.size > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowDownToLine size={13} />
                  <span>Download Selected ({selectedVideoIds.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid of scanned videos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {scanResult.map((video) => {
              const isSelected = selectedVideoIds.has(video.id);
              return (
                <div
                  key={video.id}
                  onClick={() => handleToggleSelectVideo(video.id)}
                  style={{
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)'}`,
                    backgroundColor: isSelected ? 'rgba(124, 92, 191, 0.04)' : 'var(--bg-main)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ position: 'relative', height: '110px', backgroundColor: '#18181b' }}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {video.duration}
                    </span>
                  </div>

                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.title}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{video.size}</span>
                      <span style={{ fontSize: '10.5px', color: isSelected ? 'var(--primary, #7c5cbf)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {isSelected ? '✓ Selected' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plugin & Appearance SDK Info Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <Info size={18} color="var(--primary, #7c5cbf)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Modular Plugin & Appearance SDK:</strong> LuckyGuy core does not distribute proprietary or rated stream scripts. Third-party developers and users can build their own custom source plugins, crawler engines, and appearance skins using the open <code>@luckyguy/plugin-sdk</code>. All streams run with integrated back-end ad filtering.
        </div>
      </div>
    </div>
  );
}
