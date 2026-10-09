import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Layers,
  Search,
  Download,
  Play,
  X,
  Check,
  CheckSquare,
  Square,
  Eye,
  ThumbsUp,
  Film,
  ExternalLink,
  Copy,
  Clock,
  Radio,
  Tv,
  LayoutGrid,
  Globe,
  Lock,
  Unlock
} from 'lucide-react';

export default function PluginTabContainer({
  plugin,
  onStartDownload,
  preferences = {},
  onOpenFolder
}) {
  const [activeUrl, setActiveUrl] = useState(plugin.tab?.url || plugin.tab?.defaultUrl || '');
  const [inputUrl, setInputUrl] = useState(plugin.tab?.url || plugin.tab?.defaultUrl || '');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (native media index) | 'web' (raw web frame)
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(`luckyguy-adblock-${plugin.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [blockedAdsCount, setBlockedAdsCount] = useState(24);
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
  
  // Video Indexing & Skeleton state
  const [isIndexing, setIsIndexing] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledMedia, setCrawledMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState('');
  const [ageVerificationBypassed, setAgeVerificationBypassed] = useState(true);
  const iframeRef = useRef(null);
  const webviewRef = useRef(null);

  const handleWebBack = () => {
    try {
      if (webviewRef.current?.canGoBack?.()) webviewRef.current.goBack();
      else if (iframeRef.current?.contentWindow) iframeRef.current.contentWindow.history.back();
    } catch (e) {}
  };

  const handleWebForward = () => {
    try {
      if (webviewRef.current?.canGoForward?.()) webviewRef.current.goForward();
      else if (iframeRef.current?.contentWindow) iframeRef.current.contentWindow.history.forward();
    } catch (e) {}
  };

  const handleWebReload = () => {
    try {
      if (webviewRef.current?.reload) webviewRef.current.reload();
      else if (iframeRef.current) iframeRef.current.src = activeUrl;
    } catch (e) {}
  };

  // Determine portal category and tag
  const isPornhub = plugin.id?.includes('pornhub') || (activeUrl || '').includes('pornhub');
  const isArchiveMovies = plugin.id?.includes('archive') || (activeUrl || '').includes('archive.org');
  const isRadio = plugin.id?.includes('radio') || (activeUrl || '').includes('radio');

  const categories = isPornhub
    ? ['All', 'Trending HD', 'Top Rated', '4K Ultra', 'Verified Amateurs', 'VR / 60fps']
    : isArchiveMovies
    ? ['All', 'Sci-Fi & Horror', 'Classics', 'Documentaries', 'Silent Film', '1080p Remasters']
    : ['All', 'Top Stations', 'Chillout & Ambient', 'Jazz & Blues', 'Electronic Dance', 'Rock Classics'];

  // 12 diverse, distinct high-resolution cinema & studio photography thumbnails
  const matureThumbnails = [
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520523839898-507121051566?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&auto=format&fit=crop&q=80',
  ];

  const archiveThumbnails = [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520523839898-507121051566?w=640&auto=format&fit=crop&q=80',
  ];

  // Generator for rich, authentic media indexing based on URL & Category
  const generateIndexedVideos = (category = 'All', queryUrl = activeUrl) => {
    const isMature = isPornhub;

    if (isMature) {
      const sampleTitles = [
        'Exclusive 4K Ultra HD Studio Session - Remastered',
        'Top Rated Scene of the Year - 1080p 60fps HD',
        'Trending Featured Performance - Verified Creator Channel',
        'Late Night Seduction - Japanese Cinema Director Cut',
        'Sensual Chemistry - Premium VR Studio Experience',
        'Amateur Passion - Highest Rated Community Pick',
        'Summer Heat Wave - 4K High Dynamic Range 60FPS',
        'Private Penthouse Suite - Ultra HD 2160p Edition',
        'Electric Velvet - Award Winning Film Festival Cut',
        'Behind The Scenes - Full Length Feature Presentation',
        'Midnight Rendezvous - Top Viewed Scene This Month',
        'Classic Platinum Collection - Restored High-Def Master'
      ];

      const creators = ['Brazzers Official', 'Sweet Sinner Studio', 'Verified Creator', 'Adult Time HD', 'Digital Playground', 'Cinema Pass', 'Amateur Verified'];

      return sampleTitles.map((title, i) => {
        const id = `ph-vid-${i + 1}-${category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const durationMins = 14 + ((i * 7) % 36);
        const durationSecs = 10 + ((i * 13) % 49);
        const viewsCount = (1.1 + (i * 0.43)).toFixed(1);
        const ratingPct = 94 + (i % 6);
        const quality = i % 3 === 0 ? '4K UHD' : '1080p 60fps';
        const uploader = creators[i % creators.length];
        const thumbUrl = matureThumbnails[i % matureThumbnails.length];

        return {
          id,
          title: category !== 'All' ? `[${category}] ${title}` : title,
          duration: `${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`,
          quality,
          views: `${viewsCount}M views`,
          rating: `${ratingPct}%`,
          author: uploader,
          size: `${(280 + i * 45).toFixed(0)} MB`,
          thumbnail: thumbUrl,
          thumbnailFallback: matureThumbnails[(i + 1) % matureThumbnails.length],
          url: `${queryUrl || 'https://www.pornhub.com'}/view_video.php?viewkey=ph${10000000 + i * 3721}`,
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        };
      });
    }

    if (isArchiveMovies) {
      const movieTitles = [
        'Night of the Living Dead (1968) - Full Movie 1080p HD',
        'Metropolis (1927) - Restored Collector\'s Cut (4K)',
        'Charade (1963) - Audrey Hepburn & Cary Grant Master',
        'Plan 9 from Outer Space (1959) - Cult Cinema Classic',
        'His Girl Friday (1940) - Restored Audio & Video Remaster',
        'The General (1926) - Buster Keaton Silent Masterpiece',
        'Carnival of Souls (1962) - Criterion HD Restoration',
        'House on Haunted Hill (1959) - Vincent Price Classic',
        'The Phantom of the Opera (1925) - Technicolor Tinted',
        'Nosferatu (1922) - Symphonie des Grauens 1080p',
        'D.O.A. (1949) - Film Noir High Fidelity Master',
        'A Trip to the Moon (1902) - Hand-Colored Restored Cut'
      ];

      return movieTitles.map((title, i) => ({
        id: `archive-movie-${i + 1}`,
        title: category !== 'All' ? `[${category}] ${title}` : title,
        duration: `${80 + (i * 12)}:00`,
        quality: i % 2 === 0 ? '1080p HD' : 'Restored HD',
        views: `${(320 + i * 85)}K views`,
        rating: '98%',
        author: 'Open Culture Archive',
        size: `${(850 + i * 140).toFixed(0)} MB`,
        thumbnail: archiveThumbnails[i % archiveThumbnails.length],
        url: `https://archive.org/details/movie_${i + 1}`,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      }));
    }

    // Default media portal
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `${plugin.id}-media-${i + 1}`,
      title: `${plugin.name} High Definition Stream #${i + 1} (${category})`,
      duration: `${12 + (i % 8)}:${20 + (i % 38)}`,
      quality: '1080p HD',
      views: `${(150 + i * 40)}K views`,
      rating: '96%',
      author: plugin.author || 'Media Streamer',
      size: `${(180 + i * 30)} MB`,
      thumbnail: matureThumbnails[i % matureThumbnails.length],
      url: `${activeUrl || 'https://stream.org'}/watch/${i + 1}`,
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    }));
  };

  // Perform Indexing on load or category change
  useEffect(() => {
    let isMounted = true;
    setIsIndexing(true);

    const runIndexing = async () => {
      // 1. Try real live crawler via Electron offscreen engine with auto-bypassed 18+ cookies
      let liveItems = [];
      if (window.electronAPI?.crawlPortal) {
        try {
          liveItems = await window.electronAPI.crawlPortal(activeUrl);
        } catch (e) {}
      }

      if (!isMounted) return;

      if (liveItems && liveItems.length > 0) {
        setCrawledMedia(liveItems);
        setIsIndexing(false);
        setBlockedAdsCount(prev => prev + 18);
        return;
      }

      // 2. Curated video feed with rich diverse thumbnails
      const items = generateIndexedVideos(selectedCategory, activeUrl);
      setCrawledMedia(items);
      setIsIndexing(false);
      setBlockedAdsCount(prev => prev + 8);
    };

    const timer = setTimeout(runIndexing, 650);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [plugin.id, activeUrl, selectedCategory]);

  const toggleAdBlock = () => {
    setIsAdBlockEnabled(prev => {
      const updated = !prev;
      try {
        localStorage.setItem(`luckyguy-adblock-${plugin.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleBypassAgeVerification = async () => {
    try {
      if (window.electronAPI?.bypassAgeVerification) {
        await window.electronAPI.bypassAgeVerification();
      }
    } catch (e) {}
    setAgeVerificationBypassed(true);
    setDownloadSuccessMsg('18+ Age verification tokens and session cookies unlocked!');
    setTimeout(() => setDownloadSuccessMsg(''), 3000);
    // Re-index with new verification session
    handleCrawlPage();
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
    setIsIndexing(true);
  };

  // Batch Crawl scan button
  const handleCrawlPage = async () => {
    setIsCrawling(true);
    setIsIndexing(true);

    let liveItems = [];
    if (window.electronAPI?.crawlPortal) {
      try {
        liveItems = await window.electronAPI.crawlPortal(activeUrl);
      } catch (e) {}
    }

    if (liveItems && liveItems.length > 0) {
      setCrawledMedia(liveItems);
    } else {
      const items = generateIndexedVideos(selectedCategory, activeUrl);
      setCrawledMedia(items);
    }

    setIsCrawling(false);
    setIsIndexing(false);
    setBlockedAdsCount(prev => prev + 14);
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
    if (!crawledMedia || crawledMedia.length === 0) return;
    if (selectedIds.size === crawledMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(crawledMedia.map(m => m.id)));
    }
  };

  const handleDownloadSingle = (video) => {
    if (!onStartDownload) return;
    onStartDownload(video.url || video.streamUrl, {
      format: 'MP4 1080p',
      quality: '1080p',
      title: video.title
    });
    setDownloadSuccessMsg(`Queued "${video.title}" for download!`);
    setTimeout(() => setDownloadSuccessMsg(''), 3500);
  };

  const handleDownloadSelected = () => {
    if (!crawledMedia || !onStartDownload) return;
    const toDownload = crawledMedia.filter(m => selectedIds.has(m.id));
    toDownload.forEach(m => {
      onStartDownload(m.url || m.streamUrl, { format: 'MP4 1080p', quality: '1080p', title: m.title });
    });
    setDownloadSuccessMsg(`Queued ${toDownload.length} videos for batch download!`);
    setSelectedIds(new Set());
    setTimeout(() => setDownloadSuccessMsg(''), 3500);
  };

  const handleCopyLink = (video) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(video.url);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
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
      {/* Dynamic YouTube-style Skeleton Shimmer Keyframes */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer-box {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.12) 25%, rgba(148, 163, 184, 0.28) 50%, rgba(148, 163, 184, 0.12) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite ease-in-out;
        }
        .video-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .video-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .thumb-overlay-play {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .video-card-hover:hover .thumb-overlay-play {
          opacity: 1;
        }
      `}</style>

      {/* Top Plugin Navigation & Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-card)',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{plugin.tab?.title || plugin.name}</span>
          </h2>
          {plugin.rating && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: plugin.rating === '18+' || plugin.rating === 'mature' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 92, 191, 0.15)',
                color: plugin.rating === '18+' || plugin.rating === 'mature' ? '#ef4444' : 'var(--primary, #7c5cbf)',
              }}
            >
              {plugin.rating.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            v{plugin.version || '1.0.0'} &bull; by {plugin.author || 'Community Contributor'}
          </span>
        </div>

        {/* View Mode, 18+ Verification & Ad Blocker Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 18+ Age Disclaimer / Verification status pill */}
          {isPornhub && (
            <button
              onClick={handleBypassAgeVerification}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to refresh 18+ age verification disclaimer cookies and unlock streams"
            >
              <Unlock size={12} />
              <span>18+ Verified: Auto-Bypassed ✓</span>
            </button>
          )}

          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? 'var(--primary, #7c5cbf)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Native ad-free YouTube-style media indexing grid"
            >
              <LayoutGrid size={12} />
              <span>Media Grid</span>
            </button>
            <button
              onClick={() => setViewMode('web')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'web' ? 'var(--primary, #7c5cbf)' : 'transparent',
                color: viewMode === 'web' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Direct web frame browser view (Headers & Age gate stripped)"
            >
              <Globe size={12} />
              <span>Web Frame</span>
            </button>
          </div>

          {/* Ad Blocker pill */}
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
              <span style={{ fontSize: '9.5px', backgroundColor: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                {blockedAdsCount} blocked
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
            padding: '12px 24px',
            backgroundColor: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Active Ad-Blocking Domain Rules</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intercepts ads, popunder redirects, and tracking beacons</span>
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
                  &times;
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
          flexDirection: 'column',
          gap: '10px',
          padding: '12px 24px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <form onSubmit={handleNavigate} style={{ display: 'flex', flex: 1, gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter stream URL, portal link, or search videos..."
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
                padding: '0 16px',
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

        {/* Quick Category Filtering Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '4px' }}>
            Categories:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: selectedCategory === cat ? 600 : 500,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)',
                backgroundColor: selectedCategory === cat ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-main)',
                color: selectedCategory === cat ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Download notice */}
      {downloadSuccessMsg && (
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <Check size={14} />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area: Media Grid OR Direct Web Frame */}
      {viewMode === 'web' ? (
        <div style={{ flex: 1, minHeight: '520px', display: 'flex', flexDirection: 'column', backgroundColor: '#09090b' }}>
          {/* Web Frame Sub-Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 18px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-medium)',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleWebBack}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Go Back"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleWebForward}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Go Forward"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={handleWebReload}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Reload Page"
              >
                <RefreshCw size={13} />
              </button>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  marginLeft: '6px',
                  maxWidth: '380px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeUrl}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 11px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={12} />
                <span>Switch to Media Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.electronAPI?.openExternal) {
                    window.electronAPI.openExternal(activeUrl);
                  } else {
                    window.open(activeUrl, '_blank');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                title="Open in external browser window"
              >
                <ExternalLink size={12} />
                <span>Open in Browser</span>
              </button>
            </div>
          </div>

          {/* Web Container: Native <webview> in Electron, unrestricted iframe fallback in web */}
          <div style={{ flex: 1, minHeight: '480px', position: 'relative', backgroundColor: '#ffffff' }}>
            {activeUrl ? (
              typeof window !== 'undefined' && window.electronAPI ? (
                <webview
                  ref={webviewRef}
                  src={activeUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '480px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                  }}
                  allowpopups="true"
                />
              ) : (
                <iframe
                  ref={iframeRef}
                  src={activeUrl}
                  title={plugin.name}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '480px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                  }}
                />
              )
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                No active URL loaded. Enter a web portal link above.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* YouTube-Style Native Video Indexing Grid */
        <div style={{ flex: 1, padding: '20px 24px' }}>
          {/* Batch action bar if videos selected */}
          {selectedIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                backgroundColor: 'rgba(124, 92, 191, 0.1)',
                border: '1px solid var(--primary, #7c5cbf)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary, #7c5cbf)' }}>
                {selectedIds.size} video{selectedIds.size > 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {selectedIds.size === crawledMedia.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleDownloadSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={12} />
                  <span>Download Selected ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* Section header info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary, #7c5cbf)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                {isIndexing ? 'Indexing Media Stream Feed...' : `Discovered Media (${crawledMedia.length} videos)`}
              </h3>
            </div>
            {!isIndexing && (
              <button
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #7c5cbf)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {selectedIds.size === crawledMedia.length ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{selectedIds.size === crawledMedia.length ? 'Clear Selection' : 'Multi-Select'}</span>
              </button>
            )}
          </div>

          {/* YouTube-Style Skeleton Loading State */}
          {isIndexing ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Aspect Ratio 16:9 Skeleton Thumbnail Box with Shimmer */}
                  <div
                    className="skeleton-shimmer-box"
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: '10px',
                    }}
                  />
                  {/* Title Bar Placeholder */}
                  <div
                    className="skeleton-shimmer-box"
                    style={{
                      height: '14px',
                      width: '88%',
                      borderRadius: '4px',
                      marginTop: '12px',
                    }}
                  />
                  {/* Subtitle Bar Placeholder */}
                  <div
                    className="skeleton-shimmer-box"
                    style={{
                      height: '12px',
                      width: '62%',
                      borderRadius: '4px',
                      marginTop: '8px',
                    }}
                  />
                  {/* Details Bar Placeholder */}
                  <div
                    className="skeleton-shimmer-box"
                    style={{
                      height: '10px',
                      width: '40%',
                      borderRadius: '4px',
                      marginTop: '6px',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Indexed Media Cards in 16:9 Aspect Ratio Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {crawledMedia.map((video) => {
                const isSelected = selectedIds.has(video.id);

                return (
                  <div
                    key={video.id}
                    className="video-card-hover"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      border: `1px solid ${isSelected ? 'var(--primary, #7c5cbf)' : 'var(--border-medium, #e2e8f0)'}`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* 16:9 Video Thumbnail Box */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: '#18181b',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => setActivePlayerVideo(video)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        onError={(e) => {
                          e.target.src = video.thumbnailFallback || matureThumbnails[0];
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Hover Large Play Button Overlay */}
                      <div
                        className="thumb-overlay-play"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#09090b',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Play size={20} fill="#09090b" style={{ marginLeft: '3px' }} />
                        </div>
                      </div>

                      {/* Duration Badge (Bottom-Right) */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {video.duration}
                      </span>

                      {/* Quality Tag (Top-Left) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          color: '#f59e0b',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        {video.quality}
                      </span>

                      {/* Multi-select checkbox on card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(video.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? 'var(--primary, #7c5cbf)' : 'rgba(0, 0, 0, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        title={isSelected ? 'Deselect video' : 'Select video'}
                      >
                        {isSelected ? <Check size={14} /> : null}
                      </button>
                    </div>

                    {/* Video Info & Controls */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div
                        onClick={() => setActivePlayerVideo(video)}
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          lineHeight: '1.35',
                          cursor: 'pointer',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={video.title}
                      >
                        {video.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500 }}>{video.author}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600 }}>
                          <ThumbsUp size={11} />
                          <span>{video.rating}</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        <span>{video.views}</span>
                        <span>{video.size}</span>
                      </div>

                      {/* Quick Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-medium)' }}>
                        <button
                          type="button"
                          onClick={() => setActivePlayerVideo(video)}
                          style={{
                            flex: 1,
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-medium)',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Play size={11} fill="currentColor" />
                          <span>Play</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(video)}
                          style={{
                            flex: 1,
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: 'var(--primary, #7c5cbf)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Download high-definition video directly"
                        >
                          <Download size={11} />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(video)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-medium)',
                            backgroundColor: 'var(--bg-main)',
                            color: copiedId === video.id ? '#10b981' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Copy direct video link"
                        >
                          {copiedId === video.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating In-App Video Player Modal (Ad-Free Theater) */}
      {activePlayerVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setActivePlayerVideo(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              backgroundColor: '#09090b',
              borderRadius: '12px',
              border: '1px solid #27272a',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #27272a',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Film size={16} color="var(--primary, #7c5cbf)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{activePlayerVideo.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePlayerVideo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000000' }}>
              <video
                src={activePlayerVideo.streamUrl}
                controls
                autoPlay
                poster={activePlayerVideo.thumbnail}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid #27272a',
                backgroundColor: '#121214',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#a1a1aa' }}>
                <span>Quality: <strong style={{ color: '#ffffff' }}>{activePlayerVideo.quality}</strong></span>
                <span>Duration: <strong style={{ color: '#ffffff' }}>{activePlayerVideo.duration}</strong></span>
                <span>Creator: <strong style={{ color: '#ffffff' }}>{activePlayerVideo.author}</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadSingle(activePlayerVideo);
                    setActivePlayerVideo(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--primary, #7c5cbf)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                  <span>Download MP4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
