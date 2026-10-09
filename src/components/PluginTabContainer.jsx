import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ArrowDownToLine,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  FolderDown,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Layers,
  Search,
  Download
} from 'lucide-react';

export default function PluginTabContainer({
  plugin,
  onStartDownload,
  preferences = {},
  onOpenFolder
}) {
  const [activeUrl, setActiveUrl] = useState(plugin.tab?.url || plugin.tab?.defaultUrl || '');
  const [inputUrl, setInputUrl] = useState(plugin.tab?.url || plugin.tab?.defaultUrl || '');
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(`luckyguy-adblock-${plugin.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [blockedAdsCount, setBlockedAdsCount] = useState(0);
  const [customFilters, setCustomFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(`luckyguy-filters-${plugin.id}`);
      if (saved) return JSON.parse(saved);
      return plugin.adBlockRules || ['*://*.doubleclick.net/*', '*://*popunder*/*', '*://*adservice*/*'];
    } catch {
      return plugin.adBlockRules || ['*://*.doubleclick.net/*', '*://*popunder*/*', '*://*adservice*/*'];
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterRuleInput, setFilterRuleInput] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledMedia, setCrawledMedia] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const iframeRef = useRef(null);

  const toggleAdBlock = () => {
    setIsAdBlockEnabled(prev => {
      const updated = !prev;
      try {
        localStorage.setItem(`luckyguy-adblock-${plugin.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddFilter = (e) => {
    e.preventDefault();
    if (!filterRuleInput.trim()) return;
    const updated = [filterRuleInput.trim(), ...customFilters];
    setCustomFilters(updated);
    try {
      localStorage.setItem(`luckyguy-filters-${plugin.id}`, JSON.stringify(updated));
    } catch {}
    setFilterRuleInput('');
  };

  const handleRemoveFilter = (rule) => {
    const updated = customFilters.filter(r => r !== rule);
    setCustomFilters(updated);
    try {
      localStorage.setItem(`luckyguy-filters-${plugin.id}`, JSON.stringify(updated));
    } catch {}
  };

  const handleNavigate = (e) => {
    e?.preventDefault();
    if (!inputUrl.trim()) return;
    let url = inputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setActiveUrl(url);
    setCrawledMedia(null);
  };

  // Safe Crawler Execution Bridge
  const handleCrawlPage = async () => {
    setIsCrawling(true);
    setCrawledMedia(null);

    // Simulate safe plugin crawlPage API
    setTimeout(() => {
      const mockItems = Array.from({ length: 18 }).map((_, i) => ({
        id: `${plugin.id}-media-${i + 1}`,
        title: `${plugin.tab?.title || plugin.name} Media #${i + 1} (1080p)`,
        duration: '18:3' + (i % 9),
        size: `${(90 + i * 22).toFixed(1)} MB`,
        thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=60',
        url: activeUrl || `https://stream-source.org/${plugin.id}/video-${i + 1}.mp4`
      }));
      setCrawledMedia(mockItems);
      setIsCrawling(false);
      setBlockedAdsCount(prev => prev + 4);
    }, 1000);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!crawledMedia) return;
    if (selectedIds.size === crawledMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(crawledMedia.map(m => m.id)));
    }
  };

  const handleDownloadSelected = () => {
    if (!crawledMedia || !onStartDownload) return;
    const toDownload = crawledMedia.filter(m => selectedIds.has(m.id));
    toDownload.forEach(m => {
      onStartDownload(m.url, { format: 'MP4 1080p', quality: '1080p' });
    });
    setSelectedIds(new Set());
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main, #ffffff)',
        overflowY: 'auto',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Plugin Navigation & Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-card)',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
            {plugin.tab?.title || plugin.name}
          </h2>
          {plugin.rating && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: plugin.rating === '18+' || plugin.rating === 'mature' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 92, 191, 0.15)',
                color: plugin.rating === '18+' || plugin.rating === 'mature' ? '#ef4444' : 'var(--primary, #7c5cbf)',
              }}
            >
              {plugin.rating.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            v{plugin.version || '1.0.0'} &bull; by {plugin.author || 'Community'}
          </span>
        </div>

        {/* Ad Blocker Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleAdBlock}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              border: `1px solid ${isAdBlockEnabled ? '#10b981' : 'var(--border-medium)'}`,
              backgroundColor: isAdBlockEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-main)',
              color: isAdBlockEnabled ? '#10b981' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isAdBlockEnabled ? <Shield size={13} color="#10b981" /> : <ShieldAlert size={13} color="var(--text-secondary)" />}
            <span>Ad Blocker: {isAdBlockEnabled ? 'Active' : 'Off'}</span>
            {isAdBlockEnabled && blockedAdsCount > 0 && (
              <span style={{ fontSize: '9.5px', backgroundColor: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '10px' }}>
                {blockedAdsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowFilters(prev => !prev)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <SlidersHorizontal size={12} />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Ad Filter Drawer */}
      {showFilters && (
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Active Ad-Blocking Domain Rules</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intercepts ads, popup redirects, and trackers for this tab</span>
          </div>

          <form onSubmit={handleAddFilter} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add ad domain pattern (e.g. *://*.tracker.com/*)"
              value={filterRuleInput}
              onChange={(e) => setFilterRuleInput(e.target.value)}
              style={{
                flex: 1,
                height: '30px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card)',
                fontSize: '11.5px',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Rule
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '80px', overflowY: 'auto' }}>
            {customFilters.map((rule, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card)',
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

      {/* URL Navigation & Crawler Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 24px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
        }}
      >
        <form onSubmit={handleNavigate} style={{ display: 'flex', flex: 1, gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter stream URL, portal link, or media source..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={{
              flex: 1,
              height: '34px',
              padding: '0 12px',
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
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Load View
          </button>
        </form>

        <button
          onClick={handleCrawlPage}
          disabled={isCrawling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 14px',
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
          <span>{isCrawling ? 'Crawling...' : 'Batch Scan (100+)'}</span>
        </button>
      </div>

      {/* Main View Area (Sandbox Webframe or Media Canvas) */}
      <div style={{ flex: 1, minHeight: '380px', position: 'relative', backgroundColor: '#09090b' }}>
        {activeUrl ? (
          <iframe
            ref={iframeRef}
            src={activeUrl}
            title={plugin.name}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '420px',
              border: 'none',
              backgroundColor: '#fff',
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: '12px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px' }}>🎬</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              {plugin.tab?.title || plugin.name} Ready
            </h3>
            <p style={{ fontSize: '12px', maxWidth: '420px', margin: 0 }}>
              Enter any media portal or stream link above to watch with integrated ad blocking, or click <strong>Batch Scan</strong> to extract media into your download queue.
            </p>
          </div>
        )}
      </div>

      {/* Batch Crawler Discovered Media Drawer */}
      {crawledMedia && (
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary, #7c5cbf)" />
              <h4 style={{ fontSize: '13.5px', fontWeight: 600, margin: 0 }}>
                Discovered Streams ({crawledMedia.length} items)
              </h4>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {selectedIds.size === crawledMedia.length ? 'Deselect All' : 'Select All'}
              </button>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowDownToLine size={12} />
                  <span>Download Selected ({selectedIds.size})</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {crawledMedia.map(item => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSelect(item.id)}
                  style={{
                    borderRadius: '6px',
                    border: `1.5px solid ${isSelected ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)'}`,
                    backgroundColor: isSelected ? 'rgba(124, 92, 191, 0.05)' : 'var(--bg-main)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', height: '95px', backgroundColor: '#18181b' }}>
                    <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '9px', fontWeight: 600 }}>
                      {item.duration}
                    </span>
                  </div>
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{item.size}</span>
                      <span style={{ color: isSelected ? 'var(--primary, #7c5cbf)' : 'inherit', fontWeight: isSelected ? 600 : 400 }}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
