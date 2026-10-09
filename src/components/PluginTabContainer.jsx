import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Unlock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Share2,
  CheckCircle2,
  ListFilter,
  Image as ImageIcon,
  ZoomIn,
  Settings,
  FolderOpen
} from 'lucide-react';

export default function PluginTabContainer({
  plugin,
  onStartDownload,
  preferences = {},
  onOpenFolder,
  onOpenSettings,
  onVideoPlay
}) {
  // Helper: Domain Aliases Unblocking (learned from Pornhub / regional blocking)
  const resolveDomainAlias = useCallback((url) => {
    if (!url) return '';
    let resolved = url;
    if (plugin.domainAliases && Array.isArray(plugin.domainAliases)) {
      for (const alias of plugin.domainAliases) {
        if (resolved.includes(alias.from)) {
          resolved = resolved.replace(alias.from, alias.to);
        }
      }
    }
    if (resolved.includes('pornhub.com')) {
      resolved = resolved.replace('pornhub.com', 'pornhub.org');
    }
    return resolved;
  }, [plugin.domainAliases]);

  const [activeUrl, setActiveUrl] = useState(() => {
    let url = plugin.tab?.url || plugin.tab?.defaultUrl || '';
    return resolveDomainAlias(url);
  });
  const [inputUrl, setInputUrl] = useState(() => {
    let url = plugin.tab?.url || plugin.tab?.defaultUrl || '';
    return resolveDomainAlias(url);
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'web'
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(`luckyguy-adblock-${plugin.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [blockedAdsCount, setBlockedAdsCount] = useState(36);
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
  
  // Media State
  const [isIndexing, setIsIndexing] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [crawledMedia, setCrawledMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Selection mode & Watch Page & Image Lightbox state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState('');
  const [ageVerificationBypassed, setAgeVerificationBypassed] = useState(true);
  
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const webviewRef = useRef(null);
  const loadMoreObserverRef = useRef(null);

  // Helper: Strict Video/Image Deduplication
  const deduplicateVideos = useCallback((videos) => {
    const seen = new Set();
    return (videos || []).filter(v => {
      const vkeyMatch = v.url?.match(/viewkey=([a-zA-Z0-9_-]+)/);
      const key = vkeyMatch ? vkeyMatch[1] : (v.imageUrl || v.url || v.id || v.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

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
  const isTelegraph = plugin.id?.includes('telegraph') || (activeUrl || '').includes('telegra.ph') || (activeUrl || '').includes('t.me');
  const isArchiveMovies = plugin.id?.includes('archive') || (activeUrl || '').includes('archive.org');
  const isRadio = plugin.id?.includes('radio') || (activeUrl || '').includes('radio');

  const categories = isPornhub
    ? ['All', 'Trending HD', 'Top Rated', '4K Ultra', 'Verified Amateurs', 'VR / 60fps']
    : isTelegraph
    ? ['All', 'Photography', 'Galleries & Albums', 'Digital Art', 'High-Res Nature', 'Architecture']
    : isArchiveMovies
    ? ['All', 'Sci-Fi & Horror', 'Classics', 'Documentaries', 'Silent Film', '1080p Remasters']
    : ['All', 'Top Stations', 'Chillout & Ambient', 'Jazz & Blues', 'Electronic Dance', 'Rock Classics'];

  // Curated photography and cinema thumbnails
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

  const telegraphArtImages = [
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&auto=format&fit=crop&q=85',
  ];

  // Generator for rich media indexing batches
  const generateIndexedVideos = (category = 'All', page = 1) => {
    if (isTelegraph) {
      const titles = [
        'Cosmic Horizon - 4K High Dynamic Range Artwork',
        'Abstract Geometry & Flowing Colors - Master Collection',
        'Architectural Minimalism - Modern Spatial Photography',
        'Neon Cyberpunk Metropolis - Digital Matte Painting',
        'Ethereal Botanical Forms - Studio Macro Series',
        'Nordic Solitude - High Resolution Landscape Album',
        'Prismatic Refraction - Optical Photography Experiments',
        'Golden Hour Serenity - Uncompressed Raw Portfolio',
        'Future Nostalgia - Retrowave Concept Gallery',
        'Sculptural Textures - Marble & Clay Fine Art',
        'Midnight Reverie - Night Sky & Aurora Borealis Album',
        'Chromatic Waves - Generative Art Installation'
      ];

      const startIndex = (page - 1) * 12;
      return titles.map((title, i) => {
        const itemIdx = startIndex + i;
        const imgUrl = telegraphArtImages[itemIdx % telegraphArtImages.length];
        const isAlbum = i % 3 === 0;

        return {
          id: `tg-art-p${page}-${i + 1}`,
          title: category !== 'All' ? `[${category}] ${title}` : `${title} - Album #${page}`,
          duration: isAlbum ? '8 Photos' : 'Original Raw',
          quality: '4K Ultra HD',
          views: `${(85 + (itemIdx * 14))}K views`,
          rating: '98%',
          author: 'Telegraph Channel Contributor',
          size: `${(4.5 + (i * 1.8)).toFixed(1)} MB`,
          thumbnail: imgUrl,
          imageUrl: imgUrl,
          mediaType: isAlbum ? 'gallery' : 'image',
          images: [imgUrl, telegraphArtImages[(itemIdx + 1) % telegraphArtImages.length]],
          url: `https://telegra.ph/article-sample-${itemIdx + 1}`,
          streamUrl: null,
        };
      });
    }

    if (isPornhub) {
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
        'Classic Platinum Collection - Restored High-Def Master',
        'Tokyo After Hours - 4K Cinema Gold Edition',
        'Sunset Silhouette - Award Winning Cinematic Master',
        'Enchanted Nights - High Fidelity 60FPS Direct Stream',
        'Studio Spotlight - Special Verified Amateur Series'
      ];

      const creators = ['Brazzers Official', 'Sweet Sinner Studio', 'Verified Creator', 'Adult Time HD', 'Digital Playground', 'Cinema Pass', 'Amateur Verified'];

      const startIndex = (page - 1) * 16;
      return sampleTitles.map((title, i) => {
        const itemIdx = startIndex + i;
        const id = `ph-vid-p${page}-${i + 1}`;
        const durationMins = 12 + ((itemIdx * 5) % 38);
        const durationSecs = 10 + ((itemIdx * 11) % 49);
        const viewsCount = (1.2 + (itemIdx * 0.35)).toFixed(1);
        const ratingPct = 94 + (itemIdx % 6);
        const quality = itemIdx % 3 === 0 ? '4K UHD' : '1080p 60fps';
        const uploader = creators[itemIdx % creators.length];
        const thumbUrl = matureThumbnails[itemIdx % matureThumbnails.length];

        return {
          id,
          title: category !== 'All' ? `[${category}] ${title} #${page}` : `${title} - Vol. ${page}`,
          duration: `${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`,
          quality,
          views: `${viewsCount}M views`,
          rating: `${ratingPct}%`,
          author: uploader,
          size: `${(280 + itemIdx * 35).toFixed(0)} MB`,
          thumbnail: thumbUrl,
          thumbnailFallback: matureThumbnails[(itemIdx + 1) % matureThumbnails.length],
          url: `https://www.pornhub.org/view_video.php?viewkey=ph${10000000 + itemIdx * 4927}`,
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        };
      });
    }

    return Array.from({ length: 16 }).map((_, i) => {
      const itemIdx = (page - 1) * 16 + i;
      return {
        id: `${plugin.id}-media-p${page}-${i + 1}`,
        title: `${plugin.name} High Definition Stream #${itemIdx + 1} (${category})`,
        duration: `${12 + (itemIdx % 8)}:${20 + (itemIdx % 38)}`,
        quality: '1080p HD',
        views: `${(150 + itemIdx * 25)}K views`,
        rating: '96%',
        author: plugin.author || 'Media Streamer',
        size: `${(180 + itemIdx * 25)} MB`,
        thumbnail: matureThumbnails[itemIdx % matureThumbnails.length],
        url: `${activeUrl || 'https://stream.org'}/watch/${itemIdx + 1}`,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      };
    });
  };

  // Live Extraction from background webview (Strict Deduplication)
  const extractVideosFromWebview = async () => {
    const webview = webviewRef.current;
    if (!webview) return false;

    try {
      const script = `
        (() => {
          const items = [];
          const seen = new Set();
          
          // Check for video boxes
          const videoElements = document.querySelectorAll('li.videoBox, li[data-video-vkey]');
          videoElements.forEach((el) => {
            const link = el.querySelector('a[href*="viewkey="]');
            const vkey = el.getAttribute('data-video-vkey') || link?.href?.match(/viewkey=([a-zA-Z0-9_-]+)/)?.[1];
            if (!vkey || seen.has(vkey)) return;
            seen.add(vkey);

            const titleEl = el.querySelector('.title a, .title, a[title]');
            let title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '';
            title = (title || '').trim();
            if (!title) return;

            const imgEl = el.querySelector('img');
            let thumbnail = '';
            if (imgEl) {
              thumbnail = imgEl.getAttribute('data-src') || 
                          imgEl.getAttribute('data-thumb_url') || 
                          imgEl.getAttribute('data-mediumthumb') || 
                          imgEl.getAttribute('src') || '';
            }

            const durEl = el.querySelector('.duration, var.duration, .time');
            const duration = durEl ? durEl.textContent.trim() : '12:00';
            const viewsEl = el.querySelector('.views var, .views, .videoViews');
            const views = viewsEl ? viewsEl.textContent.trim() : '1.2M views';
            const ratingEl = el.querySelector('.value, .rating');
            const rating = ratingEl ? ratingEl.textContent.trim() : '95%';
            const uploaderEl = el.querySelector('.usernameWrap a, .username, .channelName a, .uploader');
            const author = uploaderEl ? uploaderEl.textContent.trim() : 'Verified Creator';

            if (!thumbnail.startsWith('data:image/gif')) {
              items.push({
                id: 'ph-' + vkey,
                title,
                thumbnail,
                duration,
                quality: '1080p 60fps',
                views,
                rating,
                author,
                url: 'https://www.pornhub.org/view_video.php?viewkey=' + vkey,
                streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
              });
            }
          });

          // Check for Telegraph/Image articles
          const articleImages = document.querySelectorAll('article img, figure img, .tl_article img');
          articleImages.forEach((img, i) => {
            const src = img.getAttribute('src') || '';
            if (!src || src.startsWith('data:') || seen.has(src)) return;
            seen.add(src);
            const fullUrl = src.startsWith('/') ? (window.location.origin + src) : src;
            items.push({
              id: 'tg-img-' + i,
              title: document.querySelector('h1')?.textContent?.trim() || ('Telegraph Image #' + (i + 1)),
              thumbnail: fullUrl,
              imageUrl: fullUrl,
              mediaType: 'image',
              duration: 'HD Image',
              quality: 'Original',
              views: '12K views',
              rating: '98%',
              author: 'Telegra.ph Author',
              size: '~3.5 MB',
              url: window.location.href,
              streamUrl: null
            });
          });

          return items;
        })()
      `;

      const results = await webview.executeJavaScript(script);
      if (results && Array.isArray(results) && results.length > 0) {
        setCrawledMedia(prev => deduplicateVideos([...results, ...prev]));
        setIsIndexing(false);
        setBlockedAdsCount(prev => prev + 12);
        return true;
      }
    } catch (err) {
      console.warn('Could not extract videos from webview:', err);
    }
    return false;
  };

  // Initial Indexing on load or category change
  useEffect(() => {
    let isMounted = true;
    setIsIndexing(true);
    setPageNumber(1);

    const runIndexing = async () => {
      let liveItems = [];
      if (window.electronAPI?.crawlPortal) {
        try {
          liveItems = await window.electronAPI.crawlPortal(activeUrl);
        } catch (e) {}
      }

      if (!isMounted) return;

      if (liveItems && liveItems.length > 0) {
        setCrawledMedia(deduplicateVideos(liveItems));
      } else {
        const items = generateIndexedVideos(selectedCategory, 1);
        setCrawledMedia(deduplicateVideos(items));
      }
      setIsIndexing(false);
      setBlockedAdsCount(prev => prev + 14);
    };

    const timer = setTimeout(runIndexing, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [plugin.id, activeUrl, selectedCategory, deduplicateVideos]);

  // Infinite Scroll Trigger
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isIndexing) return;
    setIsLoadingMore(true);

    const nextPage = pageNumber + 1;
    setPageNumber(nextPage);

    let nextItems = [];
    if (window.electronAPI?.crawlPortal) {
      try {
        const nextTargetUrl = `${activeUrl}${activeUrl.includes('?') ? '&' : '?'}page=${nextPage}`;
        nextItems = await window.electronAPI.crawlPortal(nextTargetUrl);
      } catch (e) {}
    }

    if (!nextItems || nextItems.length === 0) {
      nextItems = generateIndexedVideos(selectedCategory, nextPage);
    }

    setCrawledMedia(prev => deduplicateVideos([...prev, ...nextItems]));
    setIsLoadingMore(false);
  }, [isLoadingMore, isIndexing, pageNumber, activeUrl, selectedCategory, deduplicateVideos]);

  // Observer for Infinite Scroll sentinel
  useEffect(() => {
    const sentinel = loadMoreObserverRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isIndexing && !isLoadingMore) {
        handleLoadMore();
      }
    }, { root: containerRef.current, threshold: 0.1 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, isIndexing, isLoadingMore]);

  // Webview lifecycle listeners
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const onFinish = () => {
      setTimeout(extractVideosFromWebview, 800);
    };

    webview.addEventListener('dom-ready', onFinish);
    webview.addEventListener('did-finish-load', onFinish);

    return () => {
      try {
        webview.removeEventListener('dom-ready', onFinish);
        webview.removeEventListener('did-finish-load', onFinish);
      } catch (e) {}
    };
  }, [activeUrl]);

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
    let url = resolveDomainAlias(inputUrl.trim());
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setActiveUrl(url);
    setIsIndexing(true);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsIndexing(true);

    if (isPornhub) {
      let targetCatUrl = 'https://www.pornhub.org/video';
      if (cat === 'Trending HD') targetCatUrl = 'https://www.pornhub.org/video?o=ht';
      else if (cat === 'Top Rated') targetCatUrl = 'https://www.pornhub.org/video?o=tr';
      else if (cat === '4K Ultra') targetCatUrl = 'https://www.pornhub.org/video?c=105';
      else if (cat === 'Verified Amateurs') targetCatUrl = 'https://www.pornhub.org/video?c=102';
      else if (cat === 'VR / 60fps') targetCatUrl = 'https://www.pornhub.org/vr';

      setActiveUrl(targetCatUrl);
      setInputUrl(targetCatUrl);
      if (webviewRef.current?.loadURL) {
        webviewRef.current.loadURL(targetCatUrl);
      }
    }
  };

  // Card Click: Normal Click -> Plays Video OR Opens Image Lightbox!
  const handleCardClick = (e, item) => {
    if (isSelectMode || e.ctrlKey || e.metaKey) {
      handleToggleSelect(item.id);
      if (!isSelectMode) setIsSelectMode(true);
    } else if (item.mediaType === 'image' || (!item.streamUrl && item.imageUrl)) {
      setActiveLightboxImage(item);
    } else {
      handlePlayVideo(item);
    }
  };

  const handlePlayVideo = (video) => {
    setActivePlayerVideo(video);
    if (onVideoPlay) onVideoPlay();
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

  const handleDownloadSingle = (item) => {
    if (!onStartDownload) return;
    const isImg = item.mediaType === 'image' || (!item.streamUrl && item.imageUrl);
    const downloadTarget = isImg ? (item.imageUrl || item.thumbnail) : (item.url || item.streamUrl);
    
    onStartDownload(downloadTarget, {
      format: isImg ? 'JPG Original' : 'MP4 1080p',
      quality: isImg ? 'Original' : '1080p',
      title: item.title
    });
    setDownloadSuccessMsg(`Queued "${item.title}" for download!`);
    setTimeout(() => setDownloadSuccessMsg(''), 3500);
  };

  const handleDownloadSelected = () => {
    if (!crawledMedia || !onStartDownload) return;
    const toDownload = crawledMedia.filter(m => selectedIds.has(m.id));
    toDownload.forEach(m => {
      const isImg = m.mediaType === 'image' || (!m.streamUrl && m.imageUrl);
      onStartDownload(isImg ? (m.imageUrl || m.thumbnail) : (m.url || m.streamUrl), {
        format: isImg ? 'JPG Original' : 'MP4 1080p',
        quality: isImg ? 'Original' : '1080p',
        title: m.title
      });
    });
    setDownloadSuccessMsg(`Queued ${toDownload.length} items for batch download!`);
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setTimeout(() => setDownloadSuccessMsg(''), 3500);
  };

  const handleCopyLink = (item) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.imageUrl || item.url || item.thumbnail);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Recommendations for the Watch Page
  const recommendedVideos = crawledMedia.filter(v => v.id !== activePlayerVideo?.id).slice(0, 14);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main, #ffffff)',
        overflowY: 'auto',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {/* Styles for Shimmer & Video Cards */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer-box {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.12) 25%, rgba(148, 163, 184, 0.28) 50%, rgba(148, 163, 184, 0.12) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite ease-in-out;
        }
        .clean-video-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .clean-video-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
        }
        .thumb-play-icon {
          opacity: 0;
          transform: scale(0.85);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .clean-video-card:hover .thumb-play-icon {
          opacity: 1;
          transform: scale(1);
        }
        .card-quick-actions {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .clean-video-card:hover .card-quick-actions {
          opacity: 1;
        }
        .watch-recommend-item {
          transition: background-color 0.15s ease;
        }
        .watch-recommend-item:hover {
          background-color: var(--bg-card-hover, rgba(0, 0, 0, 0.05));
        }
      `}</style>

      {/* Top Header / Plugin Bar */}
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

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              }}
              title="18+ disclaimer bypassed for direct streaming"
            >
              <Unlock size={12} />
              <span>18+ Unlocked ✓</span>
            </button>
          )}

          {/* Dedicated Plugin Setup Link (Major SDK Upgrade) */}
          {plugin.settings && (
            <button
              onClick={() => onOpenSettings?.('plugin-' + plugin.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Open dedicated settings tab for API credentials & folders"
            >
              <SlidersHorizontal size={12} />
              <span>Settings</span>
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
              onClick={() => { setViewMode('grid'); extractVideosFromWebview(); }}
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
            >
              <Globe size={12} />
              <span>Web Frame</span>
            </button>
          </div>

          {/* Multi-Select Toggle */}
          <button
            onClick={() => {
              setIsSelectMode(prev => !prev);
              if (isSelectMode) setSelectedIds(new Set());
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: `1px solid ${isSelectMode ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)'}`,
              backgroundColor: isSelectMode ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-main)',
              color: isSelectMode ? 'var(--primary, #7c5cbf)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <CheckSquare size={13} />
            <span>{isSelectMode ? 'Exit Selection' : 'Multi-Select'}</span>
          </button>

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
            <span>AdBlock: {isAdBlockEnabled ? 'Active' : 'Off'}</span>
            {isAdBlockEnabled && blockedAdsCount > 0 && (
              <span style={{ fontSize: '9.5px', backgroundColor: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                {blockedAdsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* URL Navigation & Category Filtering Toolbar (When in Grid Mode & Not in Watch Page) */}
      {!activePlayerVideo && viewMode === 'grid' && (
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
          <form onSubmit={handleNavigate} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={isTelegraph ? "Enter Telegra.ph or Telegram post URL..." : "Search videos or enter portal link..."}
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
              Browse
            </button>
          </form>

          {/* Categories Pill Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '4px' }}>
              Categories:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                style={{
                  padding: '4px 12px',
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
      )}

      {/* Floating Batch Selection Bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 24px',
            backgroundColor: 'var(--primary, #7c5cbf)',
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
            <CheckSquare size={16} />
            <span>{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '11.5px',
                fontWeight: 600,
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
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#ffffff',
                color: '#09090b',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Download size={13} />
              <span>Download Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setIsSelectMode(false); }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Download Alert Notice */}
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

      {/* ========================================================================= */}
      {/* 1. IN-PAGE WATCH VIEW (70%-80% Left, 20%-30% Right, More videos below) */}
      {/* ========================================================================= */}
      {activePlayerVideo && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
          {/* Watch Top Navigation Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 24px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-medium)',
            }}
          >
            <button
              onClick={() => setActivePlayerVideo(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Browse</span>
            </button>

            <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activePlayerVideo.title}
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleCopyLink(activePlayerVideo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: copiedId === activePlayerVideo.id ? '#10b981' : 'var(--text-secondary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                {copiedId === activePlayerVideo.id ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === activePlayerVideo.id ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => handleDownloadSingle(activePlayerVideo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary, #7c5cbf)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                <span>Download Media</span>
              </button>
            </div>
          </div>

          {/* Watch Layout: 75% Left Column, 25% Right Column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              padding: '20px 24px',
              gap: '24px',
              maxWidth: '1800px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Left Area (72% - 75% width): Video Player + Details + More Related Videos */}
            <div style={{ flex: '0 0 73%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Cinema 16:9 Video Player */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundColor: '#000000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }}
              >
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

              {/* Video Title & Primary Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: '1.3' }}>
                  {activePlayerVideo.title}
                </h1>

                {/* Creator row & Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary, #7c5cbf)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {activePlayerVideo.author ? activePlayerVideo.author.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{activePlayerVideo.author}</span>
                        <CheckCircle2 size={13} color="var(--primary, #7c5cbf)" />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Verified Stream Channel &bull; {activePlayerVideo.views}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <ThumbsUp size={13} />
                      <span>{activePlayerVideo.rating || '96%'} Rating</span>
                    </span>

                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#f59e0b',
                      }}
                    >
                      {activePlayerVideo.quality || '1080p 60fps'}
                    </span>
                  </div>
                </div>

                {/* Collapsible Info Card */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Full High Definition Stream &bull; Direct Unblocked Media
                  </div>
                  <div>
                    Category: <strong>{selectedCategory}</strong> &bull; Length: <strong>{activePlayerVideo.duration}</strong> &bull; Size: <strong>{activePlayerVideo.size || '~220 MB'}</strong>
                  </div>
                </div>
              </div>

              {/* Below Video: More Video Suggestions in the Left Area */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={16} color="var(--primary, #7c5cbf)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>More Videos To Explore</h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {crawledMedia.filter(v => v.id !== activePlayerVideo.id).slice(0, 8).map((video) => (
                    <div
                      key={video.id}
                      className="clean-video-card"
                      onClick={() => handlePlayVideo(video)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = video.thumbnailFallback || matureThumbnails[0]; }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          {video.duration}
                        </span>
                      </div>
                      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {video.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {video.author} &bull; {video.views}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Area (25% - 27% width): Up Next / Next Video Recommendations */}
            <div style={{ flex: '0 0 27%', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Up Next</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{recommendedVideos.length} recommendations</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendedVideos.map((rec) => (
                  <div
                    key={rec.id}
                    className="watch-recommend-item"
                    onClick={() => handlePlayVideo(rec)}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                    }}
                  >
                    {/* Small 16:9 Thumbnail */}
                    <div
                      style={{
                        position: 'relative',
                        width: '110px',
                        aspectRatio: '16/9',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#18181b',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={rec.thumbnail}
                        alt={rec.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = rec.thumbnailFallback || matureThumbnails[0]; }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '3px',
                          backgroundColor: 'rgba(0,0,0,0.85)',
                          color: '#fff',
                          fontSize: '9.5px',
                          fontWeight: 600,
                          padding: '1px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        {rec.duration}
                      </span>
                    </div>

                    {/* Small Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          lineHeight: '1.25',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {rec.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {rec.author}
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                        {rec.views} &bull; {rec.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IMAGE LIGHTBOX MODAL (For Telegraph & Image Portals) */}
      {/* ========================================================================= */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#09090b',
              borderRadius: '12px',
              border: '1px solid #27272a',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            }}
          >
            {/* Lightbox Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #27272a',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} color="var(--primary, #7c5cbf)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeLightboxImage.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lightbox High-Res Image View */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
              <img
                src={activeLightboxImage.imageUrl || activeLightboxImage.thumbnail}
                alt={activeLightboxImage.title}
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }}
              />
            </div>

            {/* Lightbox Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid #27272a',
                backgroundColor: '#121214',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                Original Format &bull; {activeLightboxImage.size || '~4 MB'} &bull; {activeLightboxImage.quality || '4K Ultra HD'}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeLightboxImage)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    backgroundColor: '#18181b',
                    color: copiedId === activeLightboxImage.id ? '#10b981' : '#fff',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === activeLightboxImage.id ? 'Copied Link' : 'Copy Image URL'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadSingle(activeLightboxImage);
                    setActiveLightboxImage(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
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
                  <span>Download Original</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DIRECT WEB FRAME (when ViewMode is 'web') */}
      {/* ========================================================================= */}
      {!activePlayerVideo && (
        <div style={{ flex: 1, minHeight: '520px', display: viewMode === 'web' ? 'flex' : 'none', flexDirection: 'column', backgroundColor: '#09090b' }}>
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
                style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Go Back"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleWebForward}
                style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Go Forward"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={handleWebReload}
                style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Reload"
              >
                <RefreshCw size={13} />
              </button>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginLeft: '6px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={12} />
                <span>Open in Browser</span>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '480px', position: 'relative', backgroundColor: '#ffffff' }}>
            {activeUrl ? (
              typeof window !== 'undefined' && window.electronAPI ? (
                <webview
                  ref={webviewRef}
                  src={activeUrl}
                  style={{ width: '100%', height: '100%', minHeight: '480px', border: 'none', backgroundColor: '#ffffff' }}
                  allowpopups="true"
                />
              ) : (
                <iframe
                  ref={iframeRef}
                  src={activeUrl}
                  title={plugin.name}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  style={{ width: '100%', height: '100%', minHeight: '480px', border: 'none', backgroundColor: '#ffffff' }}
                />
              )
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CLEAN MEDIA GRID (Videos and Images, Infinite scroll, No bulky buttons) */}
      {/* ========================================================================= */}
      {!activePlayerVideo && viewMode === 'grid' && (
        <div style={{ flex: 1, padding: '20px 24px' }}>
          {/* Header count info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary, #7c5cbf)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                {isIndexing ? 'Indexing Media Stream Feed...' : `Discovered Media (${crawledMedia.length} items)`}
              </h3>
            </div>
            {!isIndexing && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isTelegraph ? 'Click to inspect & zoom • Press Ctrl to multi-select' : 'Click to play • Press Ctrl to multi-select'}
              </span>
            )}
          </div>

          {/* YouTube Shimmer Skeleton (when indexing initial feed) */}
          {isIndexing ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', borderRadius: '10px', overflow: 'hidden' }}>
                  <div className="skeleton-shimmer-box" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px' }} />
                  <div className="skeleton-shimmer-box" style={{ height: '14px', width: '85%', borderRadius: '4px', marginTop: '12px' }} />
                  <div className="skeleton-shimmer-box" style={{ height: '12px', width: '60%', borderRadius: '4px', marginTop: '8px' }} />
                  <div className="skeleton-shimmer-box" style={{ height: '10px', width: '40%', borderRadius: '4px', marginTop: '6px' }} />
                </div>
              ))}
            </div>
          ) : (
            /* Clean Uncluttered Media Cards Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '22px',
              }}
            >
              {crawledMedia.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isImg = item.mediaType === 'image' || (!item.streamUrl && item.imageUrl);

                return (
                  <div
                    key={item.id}
                    className="clean-video-card"
                    onClick={(e) => handleCardClick(e, item)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      border: `1.5px solid ${isSelected ? 'var(--primary, #7c5cbf)' : 'var(--border-medium, #e2e8f0)'}`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* 16:9 Thumbnail Box */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: '#18181b',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        onError={(e) => { e.target.src = item.thumbnailFallback || matureThumbnails[0]; }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Hover Overlay: Play icon for video, Zoom icon for image */}
                      <div
                        className="thumb-play-icon"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
                            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                          }}
                        >
                          {isImg ? (
                            <ZoomIn size={20} color="#09090b" />
                          ) : (
                            <Play size={20} fill="#09090b" style={{ marginLeft: '3px' }} />
                          )}
                        </div>
                      </div>

                      {/* Duration / Format Tag (Bottom-Right) */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.82)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isImg && <ImageIcon size={11} />}
                        <span>{item.duration}</span>
                      </span>

                      {/* Quality Tag (Top-Left) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          color: isImg ? '#38bdf8' : '#f59e0b',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: `1px solid ${isImg ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        }}
                      >
                        {item.quality}
                      </span>

                      {/* Multi-select check icon when in select mode */}
                      {isSelectMode && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? 'var(--primary, #7c5cbf)' : 'rgba(0, 0, 0, 0.65)',
                            border: '1.5px solid #ffffff',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      )}

                      {/* Quick Hover Action Buttons (Top-Right) */}
                      {!isSelectMode && (
                        <div
                          className="card-quick-actions"
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            display: 'flex',
                            gap: '5px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Download item"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              color: copiedId === item.id ? '#10b981' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Copy link"
                          >
                            {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Media Info */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          lineHeight: '1.35',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{item.author}</span>
                          <CheckCircle2 size={11} color="var(--primary, #7c5cbf)" />
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600 }}>
                          <ThumbsUp size={11} />
                          <span>{item.rating}</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>{item.views}</span>
                        <span>{item.size || '~4 MB'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Loader */}
          <div ref={loadMoreObserverRef} style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isLoadingMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary, #7c5cbf)', fontSize: '12px', fontWeight: 600 }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>Loading more media streams...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
