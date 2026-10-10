import React, { useState, useEffect, useRef, useCallback } from 'react';
import CustomVideoPlayer from './CustomVideoPlayer';
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
  FolderOpen,
  Home,
  ListPlus,
  Bookmark
} from 'lucide-react';

export default function PluginTabContainer({
  plugin,
  onStartDownload,
  preferences = {},
  onOpenFolder,
  onOpenSettings,
  onVideoPlay,
  onNavRegister
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
  // ViewMode permanently set to grid as requested
  const viewMode = 'grid';
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
  const [quickSearchText, setQuickSearchText] = useState('');
  const [isIndexing, setIsIndexing] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [crawledMedia, setCrawledMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Selection mode & Watch Page & Image Lightbox state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [watchHistory, setWatchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('luckyguy-video-history-' + plugin.id) || '[]');
    } catch (e) {
      return [];
    }
  });
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [playlistModalVideo, setPlaylistModalVideo] = useState(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const isSavedInVideos = (v) => Array.isArray(savedOnlineVideos) && savedOnlineVideos.some(sv => (sv.id && sv.id === v?.id) || (sv.url && sv.url === v?.url));
  const [ageVerificationBypassed, setAgeVerificationBypassed] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [customDownloadFolder, setCustomDownloadFolder] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-plugin-folder-' + plugin.id);
      if (saved) return saved;
      const settings = JSON.parse(localStorage.getItem('luckyguy-plugin-settings-' + plugin.id) || '{}');
      return settings.customFolder || '';
    } catch {
      return '';
    }
  });
  
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
    if (activePlayerVideo) {
      setActivePlayerVideo(null);
      setInputUrl(activeUrl);
      return;
    }
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

  const handleWebReload = async () => {
    setIsIndexing(true);
    try {
      if (webviewRef.current?.reload) webviewRef.current.reload();
      else if (iframeRef.current) iframeRef.current.src = activeUrl;
    } catch (e) {}

    let liveItems = [];
    if (isYouTube && window.electronAPI?.ytdlpSearch) {
      try {
        const query = (quickSearchText || '').trim() || 'trending';
        liveItems = await window.electronAPI.ytdlpSearch(query, 25);
      } catch (e) {}
    } else if (window.electronAPI?.crawlPortal) {
      try {
        liveItems = await window.electronAPI.crawlPortal(activeUrl);
      } catch (e) {}
    }

    const cleanLive = Array.isArray(liveItems) ? deduplicateVideos(liveItems.filter(isRealMediaItem)) : [];
    if (cleanLive.length > 0) {
      setCrawledMedia(cleanLive);
      if (window.electronAPI?.savePortalCache) {
        window.electronAPI.savePortalCache(cachePortalId, cleanLive);
      }
    }
    setIsIndexing(false);
  };

  // Determine portal category and tag
  const isPornhub = plugin.id?.includes('pornhub') || (activeUrl || '').includes('pornhub');
  const isYouTube = plugin.id?.includes('youtube') || (activeUrl || '').includes('youtube.com') || (activeUrl || '').includes('youtu.be');
  const isTelegram = plugin.id?.includes('telegram') || (activeUrl || '').includes('t.me') || (activeUrl || '').includes('telesco.pe');
  const isTelegraph = plugin.id?.includes('telegraph') || (activeUrl || '').includes('telegra.ph');
  const isArchiveMovies = plugin.id?.includes('archive') || (activeUrl || '').includes('archive.org');
  const isRadio = plugin.id?.includes('radio') || (activeUrl || '').includes('radio');

  const categories = isYouTube
    ? ['All', 'Trending Music', 'Top Charts', 'Live Streams', 'Gaming', 'News']
    : isPornhub
    ? ['All', 'Trending HD', 'Top Rated', '4K Ultra', 'Verified Amateurs', 'VR / 60fps']
    : isTelegram
    ? ['All', 'Channel Videos', 'HD Clips', 'Wallpapers & Photos', 'Audio & Voice', 'Media Files']
    : isArchiveMovies
    ? ['All', 'Sci-Fi & Horror', 'Classics', 'Documentaries', 'Silent Film', '1080p Remasters']
    : ['All', 'Top Stations', 'Chillout & Ambient', 'Jazz & Blues', 'Electronic Dance', 'Rock Classics'];

  // Curated photography and cinema thumbnails
    const defaultFallbackThumb = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180' fill='%2318181b'%3E%3Crect width='320' height='180'/%3E%3Cpolygon points='135,65 135,115 185,90' fill='%2352525b'/%3E%3C/svg%3E";

  const isRealMediaItem = useCallback((item) => {
    if (!item || !item.url) return false;
    const id = String(item.id || '');
    const thumb = String(item.thumbnail || '');
    const title = String(item.title || '');
    if (id.startsWith('ph-vid-') || id.startsWith('tg-art-')) return false;
    if (thumb.includes('images.unsplash.com')) return false;
    if (title.includes('Exclusive 4K Ultra HD Studio Session') || title.includes('Top Rated Scene of the Year')) return false;
    return true;
  }, []);

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

    if (isYouTube) {
      let query = 'trending';
      if (cat === 'Trending Music') query = 'trending music';
      else if (cat === 'Top Charts') query = 'top music charts 2024';
      else if (cat === 'Live Streams') query = 'live stream music';
      else if (cat === 'Gaming') query = 'trending gaming';
      else if (cat === 'News') query = 'news live';
      let targetCatUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
      setActiveUrl(targetCatUrl);
      setInputUrl(targetCatUrl);
      if (window.electronAPI?.ytdlpSearch) {
        window.electronAPI.ytdlpSearch(query, 25).then(items => {
          if (items && items.length > 0) {
            setCrawledMedia(deduplicateVideos(items));
            if (window.electronAPI?.savePortalCache) {
              window.electronAPI.savePortalCache(cachePortalId, items);
            }
          }
          setIsIndexing(false);
        }).catch(() => setIsIndexing(false));
      }
    } else if (isPornhub) {
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
          streamUrl: null,
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
        streamUrl: null,
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

            const titleEl = el.querySelector('span.title a, .thumbnailTitle, .title a, .videoTitle');
            const imgEl = el.querySelector('img');
            let title = titleEl?.getAttribute('title') || titleEl?.textContent?.trim() || imgEl?.getAttribute('title') || imgEl?.getAttribute('alt') || '';
            if (!title || /^\d+:\d+(:\d+)?$/.test(title.trim())) {
              const alt = imgEl?.getAttribute('alt') || imgEl?.getAttribute('title');
              if (alt && !/^\d+:\d+(:\d+)?$/.test(alt.trim())) {
                title = alt;
              }
            }
            title = (title || '')
              .replace(/&amp;/g, '&')
              .replace(/&#039;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/^Video\s*\d+:\d+\s*/i, '')
              .replace(/^\d+:\d+(:\d+)?\s*[-–:]?\s*/, '')
              .trim();
            if (!title || /^\d+:\d+(:\d+)?$/.test(title)) {
              title = 'Featured Video ' + (vkey ? vkey.substring(0, 8) : '');
            }

            let thumbnail = imgEl?.getAttribute('data-mediumthumb') || imgEl?.getAttribute('data-image') || imgEl?.getAttribute('data-thumb_url') || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';
            if (thumbnail.startsWith('data:image/gif') || !thumbnail.startsWith('http')) {
              if (imgEl && imgEl.attributes) {
                for (let a = 0; a < imgEl.attributes.length; a++) {
                  const attr = imgEl.attributes[a];
                  if (attr.value && attr.value.startsWith('http') && (attr.name.includes('thumb') || attr.name.includes('image') || attr.name.includes('src'))) {
                    thumbnail = attr.value;
                    break;
                  }
                }
              }
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
                streamUrl: null
              });
            }
          });

          // Check for Telegram posts/videos/photos
          const tgMessages = document.querySelectorAll('.tgme_widget_message_wrap');
          tgMessages.forEach((msg, i) => {
            const vid = msg.querySelector('video');
            const photo = msg.querySelector('.tgme_widget_message_photo_wrap');
            const textEl = msg.querySelector('.tgme_widget_message_text');
            const durEl = msg.querySelector('.message_video_duration');
            const viewsEl = msg.querySelector('.tgme_widget_message_views');
            const linkEl = msg.querySelector('.tgme_widget_message_date');

            let videoSrc = vid ? vid.getAttribute('src') : null;
            let photoSrc = '';
            if (photo) {
              const bg = photo.style.backgroundImage || '';
              const m = bg.match(/url\(["\x27]?(.*?)[\"\x27]?\)/);
              if (m) photoSrc = m[1];
            }

            if (!videoSrc && !photoSrc) return;
            const key = videoSrc || photoSrc;
            if (seen.has(key)) return;
            seen.add(key);

            const title = textEl ? textEl.textContent.trim().substring(0, 90) : (videoSrc ? 'Telegram Video Post' : 'Telegram Photo Post');
            items.push({
              id: 'tg-live-' + i + '-' + Date.now().toString(36),
              title,
              thumbnail: photoSrc || '',
              imageUrl: photoSrc || null,
              mediaType: videoSrc ? 'video' : 'image',
              formatType: videoSrc ? 'VIDEO' : 'IMAGE',
              duration: durEl ? durEl.textContent.trim() : (videoSrc ? 'HD Video' : 'Original Photo'),
              quality: '1080p HD',
              views: viewsEl ? viewsEl.textContent.trim() + ' views' : 'Telegram Post',
              rating: '99%',
              author: 'Telegram Channel',
              url: linkEl?.href || window.location.href,
              streamUrl: videoSrc || null,
              directStreamUrl: videoSrc || null,
              ext: videoSrc ? '.mp4' : '.jpg'
            });
          });

          // Check for article images
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

  // Register navigation controls with mainframe TitleBar
  useEffect(() => {
    if (onNavRegister) {
      onNavRegister({
        url: activeUrl,
        isLoading: isIndexing || isLoadingMore,
        viewMode: viewMode,
        onBack: handleWebBack,
        onForward: handleWebForward,
        onReload: handleWebReload,
        onNavigate: (newUrl) => {
          let resolved = resolveDomainAlias(newUrl);
          if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
            resolved = 'https://www.pornhub.org/video/search?search=' + encodeURIComponent(resolved);
          }
          setActiveUrl(resolved);
          setInputUrl(resolved);
          if (webviewRef.current) {
            try { webviewRef.current.loadURL(resolved); } catch(e) {}
          }
        },
        onToggleViewMode: (mode) => {
          setViewMode(mode);
          if (mode === 'grid') {
            extractVideosFromWebview();
          }
        }
      });
    }
  }, [activeUrl, viewMode, onNavRegister, resolveDomainAlias, handleWebBack, handleWebForward, handleWebReload]);


  // Persistent Disk Caching & Smart Content Blending
  // Pause webview when other media plays
  useEffect(() => {
    const handleGlobalMedia = (e) => {
      if (webviewRef.current) {
        try {
          webviewRef.current.executeJavaScript('document.querySelectorAll("video, audio").forEach(m => m.pause())');
        } catch (err) {}
      }
    };
    window.addEventListener('luckyguy-media-playback', handleGlobalMedia);
    return () => window.removeEventListener('luckyguy-media-playback', handleGlobalMedia);
  }, []);

  const cachePortalId = plugin.id || 'pornhub';

  useEffect(() => {
    let isMounted = true;
    setPageNumber(1);

    const loadCachedOrFresh = async () => {
      try {
        let cached = null;
        if (window.electronAPI?.getPortalCache) {
          try {
            cached = await window.electronAPI.getPortalCache(cachePortalId);
          } catch (e) {}
        }

        if (!isMounted) return;

        // Clean any cached items so that mock items with random artwork are permanently purged
        const cleanCached = Array.isArray(cached) ? deduplicateVideos(cached.filter(isRealMediaItem)) : [];

        if (cleanCached.length > 0) {
          // If clean real cached videos exist, load them immediately with ZERO delay
          setCrawledMedia(cleanCached);
          setIsIndexing(false);

          // Update cache on disk if any polluted items were pruned
          if (cached.length !== cleanCached.length && window.electronAPI?.savePortalCache) {
            window.electronAPI.savePortalCache(cachePortalId, cleanCached);
          }

          // Fetch fresh live videos in the background and update seamlessly
          if (window.electronAPI?.crawlPortal) {
            try {
              const liveItems = await window.electronAPI.crawlPortal(activeUrl);
              const cleanLive = Array.isArray(liveItems) ? deduplicateVideos(liveItems.filter(isRealMediaItem)) : [];
              if (isMounted && cleanLive.length > 0) {
                const merged = deduplicateVideos([...cleanLive, ...cleanCached]);
                setCrawledMedia(merged);
                if (window.electronAPI?.savePortalCache) {
                  window.electronAPI.savePortalCache(cachePortalId, merged);
                }
              }
            } catch (e) {}
          }
          return;
        }

        // Cache was empty: show clean skeletons while crawler fetches real website videos
        setIsIndexing(true);

        if (isYouTube && window.electronAPI?.ytdlpSearch) {
          try {
            const liveItems = await window.electronAPI.ytdlpSearch('trending', 25);
            const cleanLive = Array.isArray(liveItems) ? deduplicateVideos(liveItems.filter(isRealMediaItem)) : [];
            if (isMounted && cleanLive.length > 0) {
              setCrawledMedia(cleanLive);
              if (window.electronAPI?.savePortalCache) {
                window.electronAPI.savePortalCache(cachePortalId, cleanLive);
              }
              return;
            }
          } catch (e) {}
        } else if (window.electronAPI?.crawlPortal) {
          try {
            const liveItems = await window.electronAPI.crawlPortal(activeUrl);
            const cleanLive = Array.isArray(liveItems) ? deduplicateVideos(liveItems.filter(isRealMediaItem)) : [];
            if (isMounted && cleanLive.length > 0) {
              setCrawledMedia(cleanLive);
              setBlockedAdsCount(prev => prev + 14);
              if (window.electronAPI?.savePortalCache) {
                window.electronAPI.savePortalCache(cachePortalId, cleanLive);
              }
              return;
            }
          } catch (e) {}
        }

        // Fallback for non-video / Telegraph plugins if crawler is not applicable
        if (isMounted && isTelegraph) {
          const artItems = deduplicateVideos(generateIndexedVideos(selectedCategory, 1));
          setCrawledMedia(artItems);
        }
      } catch (err) {
        console.warn('Error loading media portal items:', err);
      } finally {
        if (isMounted) {
          setIsIndexing(false);
        }
      }
    };

    loadCachedOrFresh();

    return () => {
      isMounted = false;
    };
  }, [plugin.id, selectedCategory, deduplicateVideos, cachePortalId, activeUrl, isRealMediaItem, isTelegraph]);

  // Infinite Scroll Trigger
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isIndexing) return;
    setIsLoadingMore(true);

    const nextPage = pageNumber + 1;
    setPageNumber(nextPage);

    let nextItems = [];
    if (isYouTube && window.electronAPI?.ytdlpSearch) {
      try {
        const query = (quickSearchText || '').trim() || (selectedCategory !== 'All' ? selectedCategory : 'popular music');
        nextItems = await window.electronAPI.ytdlpSearch(`${query} ${nextPage}`, 20);
      } catch (e) {}
    } else if (window.electronAPI?.crawlPortal) {
      try {
        const nextTargetUrl = `${activeUrl}${activeUrl.includes('?') ? '&' : '?'}page=${nextPage}`;
        nextItems = await window.electronAPI.crawlPortal(nextTargetUrl);
      } catch (e) {}
    }

    const cleanNext = Array.isArray(nextItems) ? deduplicateVideos(nextItems.filter(isRealMediaItem)) : [];

    if (cleanNext.length > 0) {
      setCrawledMedia(prev => {
        const updated = deduplicateVideos([...prev.filter(isRealMediaItem), ...cleanNext]);
        if (window.electronAPI?.savePortalCache) {
          window.electronAPI.savePortalCache(cachePortalId, updated);
        }
        return updated;
      });
    } else if (isTelegraph) {
      const artNext = generateIndexedVideos(selectedCategory, nextPage);
      setCrawledMedia(prev => deduplicateVideos([...prev, ...artNext]));
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, isIndexing, pageNumber, activeUrl, deduplicateVideos, cachePortalId, isRealMediaItem, isTelegraph, selectedCategory]);

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

  // Webview lifecycle listeners (no auto-refresh disruption)
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // Only extract if completely empty to populate initial state
    const onFinish = () => {
      if (crawledMedia.length === 0) {
        extractVideosFromWebview();
      }
    };

    webview.addEventListener('did-finish-load', onFinish);

    return () => {
      try {
        webview.removeEventListener('did-finish-load', onFinish);
      } catch (e) {}
    };
  }, [crawledMedia.length]);

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
    if (isTelegram || url.includes('t.me') || url.startsWith('@')) {
      if (url.startsWith('@')) {
        url = 'https://t.me/s/' + url.substring(1);
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://t.me/s/' + url;
      }
      if (/^https?:\/\/t\.me\/[a-zA-Z0-9_]+$/.test(url) && !url.includes('/s/')) {
        url = url.replace('t.me/', 't.me/s/');
      }
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
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
      if (viewMode === 'web' && webviewRef.current?.loadURL) {
        try { webviewRef.current.loadURL(targetCatUrl); } catch (e) {}
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
    if (video.url) {
      setInputUrl(video.url);
    }
    if (onVideoPlay) onVideoPlay();
    window.dispatchEvent(new CustomEvent('luckyguy-media-playback', {
      detail: { source: 'video', playerId: 'plugin-player-' + (video.id || '') }
    }));

    // Dynamically resolve full metadata and direct streams from official page
    if (video.url && window.electronAPI?.extractUrl) {
      window.electronAPI.extractUrl(video.url)
        .then((res) => {
          if (res && !res.error) {
            setActivePlayerVideo((prev) => {
              if (prev && (prev.id === video.id || prev.url === video.url)) {
                return {
                  ...prev,
                  title: (res.title && !/^\d+:\d+(:\d+)?$/.test(res.title)) ? res.title : prev.title,
                  author: res.artist || prev.author,
                  streamUrl: res.streamUrl || prev.streamUrl,
                  streams: res.streams || prev.streams,
                  thumbnail: res.artworkUrl || prev.thumbnail,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }

    // Save to Watch History & adapt recommendations
    try {
      const historyKey = 'luckyguy-video-history-' + plugin.id;
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const filtered = existing.filter(v => v.id !== video.id && v.url !== video.url);
      const updated = [{
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        url: video.url,
        author: video.author,
        watchedAt: Date.now()
      }, ...filtered].slice(0, 50);
      localStorage.setItem(historyKey, JSON.stringify(updated));
      setWatchHistory(updated);
    } catch(e) {}
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

  const handlePickCustomFolder = async () => {
    if (window.electronAPI?.pickFolder) {
      try {
        const folder = await window.electronAPI.pickFolder();
        if (folder) {
          setCustomDownloadFolder(folder);
          try {
            localStorage.setItem('luckyguy-plugin-folder-' + plugin.id, folder);
          } catch (e) {}
        }
      } catch (e) {}
    }
  };

  const isAdultPlugin = (plugin?.id || '').toLowerCase().includes('pornhub') ||
    (plugin?.category || '').toLowerCase() === 'adult' ||
    (plugin?.name || '').toLowerCase().includes('pornhub');

  const handleDownloadSingle = (item, qualityOverride) => {
    if (!onStartDownload) return;
    const isImg = item.mediaType === 'image' || (!item.streamUrl && item.imageUrl);
    const chosenQuality = qualityOverride || selectedQuality || item.quality || (isImg ? 'Original' : '1080p');
    const directStream = (item.streams && item.streams[chosenQuality]) || item.streamUrl || item.url;
    const downloadTarget = isImg ? (item.imageUrl || item.thumbnail) : directStream;
    
    onStartDownload(downloadTarget, {
      format: isImg ? 'JPG ' + chosenQuality : 'MP4 ' + chosenQuality,
      formatType: isImg ? 'IMAGE' : 'VIDEO',
      mediaType: isImg ? 'image' : 'video',
      quality: chosenQuality,
      qualityLabel: chosenQuality,
      title: item.title,
      author: item.author || plugin.name,
      thumbnail: item.thumbnail || item.imageUrl || '',
      isAdult: isAdultPlugin,
      category: isAdultPlugin ? 'adult' : (plugin?.category || 'media'),
      customFolder: customDownloadFolder || (plugin.id?.includes('telegram') ? preferences?.telegramDownloadFolder : null)
    });

  };

  const handleDownloadSelected = () => {
    if (!crawledMedia || !onStartDownload) return;
    const toDownload = crawledMedia.filter(m => selectedIds.has(m.id));
    toDownload.forEach(m => {
      const isImg = m.mediaType === 'image' || (!m.streamUrl && m.imageUrl);
      const chosenQuality = selectedQuality || (isImg ? 'Original' : '1080p');
      const directStream = (m.streams && m.streams[chosenQuality]) || m.streamUrl || m.url;
      onStartDownload(isImg ? (m.imageUrl || m.thumbnail) : directStream, {
        format: isImg ? 'JPG ' + chosenQuality : 'MP4 ' + chosenQuality,
        formatType: isImg ? 'IMAGE' : 'VIDEO',
        mediaType: isImg ? 'image' : 'video',
        quality: chosenQuality,
        qualityLabel: chosenQuality,
        title: m.title,
        author: m.author || plugin.name,
        thumbnail: m.thumbnail || m.imageUrl || '',
        isAdult: isAdultPlugin,
        category: isAdultPlugin ? 'adult' : (plugin?.category || 'media'),
        customFolder: customDownloadFolder || null
      });
    });
    setSelectedIds(new Set());
    setIsSelectMode(false);
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

      {/* Sleek Top Navigation Toolbar inside Tab (Always visible on grid & video watch views) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border-medium, #e2e8f0)',
          gap: '8px',
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        {/* Back, Forward, Home, Reload buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleWebBack}
            title={activePlayerVideo ? "Back to Videos Grid" : "Go Back"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleWebForward}
            title="Go Forward"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activePlayerVideo) {
                setActivePlayerVideo(null);
                setInputUrl(activeUrl);
              } else if (onNavigateHome) {
                onNavigateHome();
              }
            }}
            title={activePlayerVideo ? "Back to Videos Grid" : "Go to Home"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Home size={15} />
          </button>
          <button
            type="button"
            onClick={handleWebReload}
            title="Reload"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleWebForward}
              title="Go Forward"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleWebReload}
              title="Refresh"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* URL Address Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              let target = (inputUrl || '').trim();
              if (target) {
                let resolved = resolveDomainAlias(target);
                if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
                  resolved = isPornhub ? ('https://www.pornhub.org/video/search?search=' + encodeURIComponent(resolved)) : ('https://' + resolved);
                }
                setActiveUrl(resolved);
                setInputUrl(resolved);
                if (webviewRef.current) {
                  try { webviewRef.current.loadURL(resolved); } catch(err) {}
                }
              }
            }}
            style={{
              flex: 1,
              maxWidth: '480px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                height: '34px',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                borderRadius: '6px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                padding: '0 12px',
                gap: '8px',
              }}
            >
              <Globe size={13} color="var(--text-muted)" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.pornhub.org"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </form>

          {/* Quick Search Bar Beside Address Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (quickSearchText || '').trim();
              if (!q) return;
              let targetSearchUrl;
              if (isPornhub) {
                targetSearchUrl = 'https://www.pornhub.org/video/search?search=' + encodeURIComponent(q);
              } else if (isYouTube) {
                targetSearchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
              } else if (isTelegram) {
                targetSearchUrl = 'https://t.me/s/' + encodeURIComponent(q.replace('@', ''));
              } else {
                targetSearchUrl = `${activeUrl}${activeUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`;
              }
              setActiveUrl(targetSearchUrl);
              setInputUrl(targetSearchUrl);
              setIsIndexing(true);
              if (webviewRef.current?.loadURL) {
                try { webviewRef.current.loadURL(targetSearchUrl); } catch(err) {}
              }
              if (isYouTube && window.electronAPI?.ytdlpSearch) {
                window.electronAPI.ytdlpSearch(q, 25).then(items => {
                  if (items && items.length > 0) {
                    setCrawledMedia(deduplicateVideos(items));
                    if (window.electronAPI?.savePortalCache) {
                      window.electronAPI.savePortalCache(cachePortalId, items);
                    }
                  }
                  setIsIndexing(false);
                }).catch(() => setIsIndexing(false));
              } else if (window.electronAPI?.crawlPortal) {
                window.electronAPI.crawlPortal(targetSearchUrl).then(items => {
                  if (items && items.length > 0) {
                    setCrawledMedia(deduplicateVideos(items));
                    if (window.electronAPI?.savePortalCache) {
                      window.electronAPI.savePortalCache(cachePortalId, items);
                    }
                  }
                  setIsIndexing(false);
                }).catch(() => setIsIndexing(false));
              }
            }}
            style={{
              flex: 1,
              maxWidth: '340px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                height: '34px',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                borderRadius: '6px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                padding: '0 10px',
                gap: '8px',
              }}
            >
              <Search size={14} color="var(--primary, #7c5cbf)" />
              <input
                type="text"
                value={quickSearchText}
                onChange={(e) => setQuickSearchText(e.target.value)}
                placeholder={isPornhub ? "Search Pornhub videos..." : "Search media..."}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              {quickSearchText && (
                <button
                  type="button"
                  onClick={() => setQuickSearchText('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </form>

      </div>

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



      {/* ========================================================================= */}
      {/* 1. IN-PAGE WATCH VIEW (70%-80% Left, 20%-30% Right, More videos below) */}
      {activePlayerVideo && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
          {/* Watch Layout: 75% Left Column, 25% Right Column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              padding: '12px 24px',
              gap: '24px',
              maxWidth: '1800px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Left Area (72% - 75% width): Custom Video Player + Details + More Related Videos */}
            <div style={{ flex: '0 0 73%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Breadcrumb Navigation directly above Player */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => { setActivePlayerVideo(null); setInputUrl(activeUrl); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={15} />
                  <span>Back to Videos Grid</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(124, 92, 191, 0.12)',
                      color: 'var(--primary, #7c5cbf)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    <Globe size={11} />
                    <span>Online Stream &bull; No Download Required</span>
                  </span>
                </div>
              </div>

              {/* Custom Native Video Player with In-Player Quality & Download */}
              <CustomVideoPlayer
                video={activePlayerVideo}
                onBack={() => { setActivePlayerVideo(null); setInputUrl(activeUrl); }}
                onDownload={(quality) => handleDownloadSingle(activePlayerVideo, quality)}
                onQualityChange={(q) => setSelectedQuality(q)}
                initialQuality={selectedQuality || '1080p'}
              />

              {/* Video Title & Primary Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: '1.3' }}>
                  {activePlayerVideo.title && !/^\d+:\d+(:\d+)?$/.test(activePlayerVideo.title)
                    ? activePlayerVideo.title
                    : (activePlayerVideo.author ? `${activePlayerVideo.author} Video` : 'Featured Video')}
                </h1>

                {/* Clean Creator / Channel Row */}
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
                        <span>{activePlayerVideo.author || 'Verified Creator'}</span>
                        <CheckCircle2 size={13} color="var(--primary, #7c5cbf)" />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Verified Stream Channel &bull; {activePlayerVideo.views || 'HQ Stream'}
                      </div>
                    </div>
                  </div>

                  {/* Online Actions: Save to Videos & Add to Playlist */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveToVideos) {
                          onSaveToVideos(activePlayerVideo);
                          const isNowSaved = !isSavedInVideos(activePlayerVideo);
                          setToastMsg(isNowSaved ? 'Saved to Videos Library (Streaming Mode)!' : 'Removed from Videos Library');
                          setTimeout(() => setToastMsg(''), 3000);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '7px',
                        border: isSavedInVideos(activePlayerVideo) ? '1px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                        backgroundColor: isSavedInVideos(activePlayerVideo) ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-card)',
                        color: isSavedInVideos(activePlayerVideo) ? 'var(--primary, #7c5cbf)' : 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Save this online video into your Videos tab to stream anytime without downloading"
                    >
                      {isSavedInVideos(activePlayerVideo) ? <Check size={14} /> : <Film size={14} />}
                      <span>{isSavedInVideos(activePlayerVideo) ? 'Saved in Videos' : 'Save to Videos'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlaylistModalVideo(activePlayerVideo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '7px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Add to a playlist to play over the internet anytime"
                    >
                      <ListPlus size={14} />
                      <span>Add to Playlist</span>
                    </button>
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
                          onError={(e) => { e.target.src = defaultFallbackThumb; }}
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
                        onError={(e) => { e.target.src = defaultFallbackThumb; }}
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

      {/* Headless Background Webview for media extraction only (No visible webframe) */}
      <div style={{ display: 'none' }}>
        {activeUrl && typeof window !== 'undefined' && window.electronAPI && (
          <webview
            ref={webviewRef}
            src={activeUrl}
            style={{ width: 0, height: 0 }}
            allowpopups="true"
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CLEAN MEDIA GRID (Videos and Images, Infinite scroll, No bulky buttons) */}
      {/* ========================================================================= */}
      {!activePlayerVideo && (
        <div style={{ flex: 1, padding: '20px 24px' }}>
          {/* YouTube Shimmer Skeleton (when indexing initial feed) */}
          {isIndexing ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
                gap: '14px',
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
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      border: `1px solid ${isSelected ? 'var(--primary, #7c5cbf)' : 'var(--border-medium, #e2e8f0)'}`,
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Artwork / Thumbnail Box */}
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
                        onError={(e) => { e.target.src = defaultFallbackThumb; }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Small subtle duration tag in bottom corner */}
                      {item.duration && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          {item.duration}
                        </span>
                      )}

                      {/* Hover Overlay: Play icon */}
                      <div
                        className="thumb-play-icon"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#09090b',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Play size={16} fill="#09090b" style={{ marginLeft: '2px' }} />
                        </div>
                      </div>

                      {/* Hover Download button in top-right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingle(item);
                        }}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: 'none',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Download"
                      >
                        <Download size={12} />
                      </button>
                    </div>

                    {/* Artwork Title / Name ONLY */}
                    <div style={{ padding: '8px 10px 10px 10px', display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          lineHeight: '1.35',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: 'var(--text-primary)',
                        }}
                        title={item.title}
                      >
                        {item.title && !/^\d+:\d+(:\d+)?$/.test(item.title) ? item.title : (item.author ? `${item.author} Video` : 'Featured Video')}
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
