import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Download,
  FolderOpen,
  Key,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Copy,
  Check,
  Play,
  Pause,
  Image as ImageIcon,
  Film,
  FileText,
  Music,
  Eye,
  RefreshCw,
  X,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Shield,
  SlidersHorizontal,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export default function TelegramTab({
  plugin,
  onStartDownload,
  preferences = {},
  onOpenFolder,
}) {
  // --- Telegram Bot API Authentication State ---
  const [botToken, setBotToken] = useState(() => {
    try {
      return localStorage.getItem('luckyguy-telegram-bot-token') || '';
    } catch {
      return '';
    }
  });

  const [botInfo, setBotInfo] = useState(null);
  const [isVerifyingBot, setIsVerifyingBot] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- Channel & Feed State ---
  const [channelInput, setChannelInput] = useState('https://t.me/s/telegram');
  const [activeChannel, setActiveChannel] = useState({
    title: 'Telegram News',
    username: '@telegram',
    avatar: 'https://cdn1.telesco.pe/file/LZaBnkmJysf1vJNnyGXtqQwL1Nwet0LtcX7xNPv7aMqXrm0IudT3aSCh2Jbjgk5lQqZ00DeDl6L0TY_Dt5p5hIuoZ9rUUsYK5o9l4ad0K6D3HGbz7eKptoBAEoI7pvrNbUAH5NKSBV9vGvW8fHcK5fTi303obPtJcH65ejeUnfCLtIG1SnI4QaWDNj3KVAeE3uUx1_x4qrhDyjdrm55fYn4ntIGuuZ_5QvsOamUilhEtY7EdSbXu7AiWkishMc_flfy_VnHbAucluiXkyUZRr6oT3q5lsgNVp30E2xyAwkhDu8mbaeLjKAsWe4MQVUAIbpxvggQWQX7zK5RIMdNbmg.jpg',
    subscribers: '9.37M subscribers',
    description: 'Official channel of Telegram Messenger. Updates, announcements, and new features.',
    verified: true,
  });

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // --- Layout & Filter States ---
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'photos' | 'videos' | 'files' | 'audio'
  const [viewLayout, setViewLayout] = useState('feed'); // 'feed' (Telegram posts) | 'grid' (Media gallery)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState('');

  // --- Destination Folder ---
  const [customFolder, setCustomFolder] = useState(() => {
    try {
      const saved = localStorage.getItem('luckyguy-telegram-folder');
      if (saved) return saved;
      return 'C:\\Users\\nishant\\Downloads\\Telegram';
    } catch {
      return 'C:\\Users\\nishant\\Downloads\\Telegram';
    }
  });

  // Lightbox modal for full preview of photo or video
  const [lightboxItem, setLightboxItem] = useState(null);

  // Quick Channel Presets
  const popularChannels = [
    { name: 'Telegram News', handle: '@telegram' },
    { name: 'Pavel Durov', handle: '@durov' },
    { name: 'Wallpapers HD', handle: '@wallpapers' },
    { name: 'Telegram Tips', handle: '@telegramtips' },
    { name: 'Tech Radar', handle: '@techguide' },
  ];

  // Verify stored bot token on startup
  useEffect(() => {
    if (botToken) {
      verifyBotToken(botToken, false);
    }
  }, []);

  // Fetch initial channel
  useEffect(() => {
    fetchChannelFeed(channelInput);
  }, []);

  const verifyBotToken = async (token, isManual = true) => {
    if (!token || !token.trim()) {
      if (isManual) setAuthError('Please enter a valid Bot Token.');
      return;
    }
    const cleanToken = token.trim();
    setIsVerifyingBot(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const resp = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await resp.json();

      if (data.ok && data.result) {
        setBotInfo(data.result);
        setBotToken(cleanToken);
        try {
          localStorage.setItem('luckyguy-telegram-bot-token', cleanToken);
        } catch (e) {}
        if (isManual) {
          setAuthSuccess(`Authenticated successfully as @${data.result.username}!`);
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthSuccess('');
          }, 1500);
        }
      } else {
        setBotInfo(null);
        if (isManual) setAuthError(data.description || 'Invalid Bot Token. Check @BotFather.');
      }
    } catch (err) {
      setBotInfo(null);
      if (isManual) setAuthError(`Connection error: ${err.message}`);
    } finally {
      setIsVerifyingBot(false);
    }
  };

  const handleDisconnectBot = () => {
    setBotToken('');
    setBotInfo(null);
    try {
      localStorage.removeItem('luckyguy-telegram-bot-token');
    } catch (e) {}
    setShowAuthModal(false);
  };

  const handlePickFolder = async () => {
    if (window.electronAPI?.pickFolder) {
      try {
        const folder = await window.electronAPI.pickFolder();
        if (folder) {
          setCustomFolder(folder);
          try {
            localStorage.setItem('luckyguy-telegram-folder', folder);
          } catch (e) {}
        }
      } catch (e) {}
    }
  };

  // Channel parser: crawls Telegram channel preview
  const fetchChannelFeed = async (inputQuery) => {
    let query = (inputQuery || '').trim();
    if (!query) return;

    let targetUrl = query;
    if (query.startsWith('@')) {
      targetUrl = 'https://t.me/s/' + query.substring(1);
    } else if (!query.startsWith('http://') && !query.startsWith('https://')) {
      targetUrl = 'https://t.me/s/' + query;
    }
    if (/^https?:\/\/t\.me\/[a-zA-Z0-9_]+$/.test(targetUrl) && !targetUrl.includes('/s/')) {
      targetUrl = targetUrl.replace('t.me/', 't.me/s/');
    }

    setIsLoading(true);
    setFetchError('');
    setSelectedIds(new Set());

    try {
      const resp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://t.me/'
        }
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: Could not load channel (${resp.statusText})`);
      }

      const html = await resp.text();

      // 1. Parse Channel Header Details
      const avatarMatch = html.match(/class="tgme_page_photo_image[^"]*"[^>]*src="([^"]+)"/i);
      const titleMatch = html.match(/class="tgme_channel_info_header_title"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                         html.match(/<title>([^<]+)– Telegram<\/title>/i);
      const usernameMatch = html.match(/class="tgme_channel_info_header_username"[^>]*>[\s\S]*?>([@a-zA-Z0-9_]+)</i);
      const subCounterMatch = html.match(/class="tgme_channel_info_counter"[\s\S]*?<span class="counter_value">([^<]+)<\/span>\s*<span class="counter_type">([^<]+)<\/span>/i);
      const isVerified = html.includes('class="verified-icon"');
      const descMatch = html.match(/class="tgme_channel_info_description"[^>]*>([\s\S]*?)<\/div>/i);

      const parsedTitle = titleMatch ? titleMatch[1].trim() : (query.replace(/https?:\/\/t\.me\/(s\/)?/, '') || 'Telegram Channel');
      const parsedUsername = usernameMatch ? usernameMatch[1].trim() : (query.startsWith('@') ? query : '@' + parsedTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const parsedSubs = subCounterMatch ? `${subCounterMatch[1]} ${subCounterMatch[2]}` : 'Public Channel';

      setActiveChannel({
        title: parsedTitle,
        username: parsedUsername,
        avatar: avatarMatch ? avatarMatch[1] : null,
        subscribers: parsedSubs,
        description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : 'Public Telegram broadcast feed.',
        verified: isVerified,
      });

      // 2. Parse Posts & Messages
      const msgBlocks = html.split(/class="tgme_widget_message_wrap/);
      const parsedPosts = [];
      const seen = new Set();

      for (let i = 1; i < msgBlocks.length; i++) {
        const block = msgBlocks[i];
        const vidMatch = block.match(/<video[^>]*src="([^"]+)"/i);
        const thumbMatch = block.match(/background-image:url\(\x27([^\x27]+)\x27\)/i);
        const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        const linkMatch = block.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/i);
        const dateMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>([^<]+)<\/time>/i);
        const viewsMatch = block.match(/class="tgme_widget_message_views">([^<]+)</i);
        const durMatch = block.match(/class="message_video_duration">([^<]+)</i);
        const docNameMatch = block.match(/class="tgme_widget_message_document_title">([^<]+)</i);
        const docSizeMatch = block.match(/class="tgme_widget_message_document_extra">([^<]+)</i);
        const voiceDurMatch = block.match(/class="message_audio_duration">([^<]+)</i);

        const videoUrl = vidMatch ? vidMatch[1] : null;
        const photoUrl = thumbMatch ? thumbMatch[1] : null;
        const rawText = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const postUrl = linkMatch ? linkMatch[1] : targetUrl;
        const postId = postUrl.split('/').pop() || String(i);

        // Determine media type
        let mediaType = 'text';
        let mediaUrl = null;
        let fileName = null;
        let fileSize = null;

        if (videoUrl) {
          mediaType = 'video';
          mediaUrl = videoUrl;
        } else if (photoUrl) {
          mediaType = 'photo';
          mediaUrl = photoUrl;
        } else if (docNameMatch) {
          mediaType = 'file';
          fileName = docNameMatch[1].trim();
          fileSize = docSizeMatch ? docSizeMatch[1].trim() : 'File';
        } else if (voiceDurMatch) {
          mediaType = 'audio';
        }

        const key = postUrl + (mediaUrl || rawText);
        if (seen.has(key)) continue;
        seen.add(key);

        parsedPosts.push({
          id: `tg-post-${postId}-${i}`,
          postId,
          postUrl,
          channel: parsedUsername,
          text: rawText,
          mediaType,
          mediaUrl,
          thumbnail: photoUrl || '',
          videoDuration: durMatch ? durMatch[1].trim() : null,
          fileName,
          fileSize,
          date: dateMatch ? dateMatch[2] : 'Recently',
          dateTimeIso: dateMatch ? dateMatch[1] : null,
          views: viewsMatch ? viewsMatch[1].trim() : null,
        });
      }

      setPosts(parsedPosts.reverse()); // latest first
    } catch (err) {
      console.warn('[TelegramTab] Fetch error:', err);
      setFetchError(`Could not load Telegram feed: ${err.message}. Try another channel or public link.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedFilter === 'photos') return p.mediaType === 'photo';
      if (selectedFilter === 'videos') return p.mediaType === 'video';
      if (selectedFilter === 'files') return p.mediaType === 'file';
      if (selectedFilter === 'audio') return p.mediaType === 'audio';
      return true; // 'all'
    });
  }, [posts, selectedFilter]);

  // Download Single Post Media
  const handleDownloadPost = (post) => {
    if (!onStartDownload) return;

    const downloadTarget = post.mediaUrl || post.postUrl;
    const isVideo = post.mediaType === 'video';
    const isPhoto = post.mediaType === 'photo';
    const isFile = post.mediaType === 'file';

    const safeTitle = (post.text ? post.text.substring(0, 60) : (post.fileName || `Telegram_${post.postId}`))
      .replace(/[\/\\?%*:|"<>]/g, '_');

    onStartDownload(downloadTarget, {
      title: safeTitle,
      author: activeChannel.username || 'Telegram',
      formatType: isVideo ? 'VIDEO' : (isPhoto ? 'IMAGE' : 'FILE'),
      format: isVideo ? 'MP4 HD' : (isPhoto ? 'JPG Original' : 'Binary'),
      quality: isVideo ? '1080p' : 'Original',
      thumbnail: post.thumbnail || activeChannel.avatar || '',
      customFolder,
      id: post.id,
    });

    setDownloadNotice(`Queued "${safeTitle}" for download into ${customFolder.split(/[\\/]/).pop()}!`);
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  // Batch Download Selected Posts
  const handleDownloadBatch = () => {
    const selectedList = posts.filter((p) => selectedIds.has(p.id) && (p.mediaUrl || p.postUrl));
    if (selectedList.length === 0 || !onStartDownload) return;

    selectedList.forEach((post) => {
      handleDownloadPost(post);
    });

    setDownloadNotice(`Queued ${selectedList.length} Telegram items for download!`);
    setSelectedIds(new Set());
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleCopyLink = (url, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main, #f8fafc)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* 1. TOP HEADER & TELEGRAM CONTROLS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
          gap: '14px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {/* Left: Telegram Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#229ED9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(34, 158, 217, 0.3)',
            }}
          >
            <Send size={18} style={{ transform: 'rotate(-10deg) translate(1px, -1px)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Telegram
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(34, 158, 217, 0.12)',
                  color: '#229ED9',
                }}
              >
                Media Downloader
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Download photos, HD videos, files & voice notes from Telegram
            </div>
          </div>
        </div>

        {/* Center: Search & Channel Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchChannelFeed(channelInput);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: '540px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: '8px',
            border: '1px solid var(--border-medium)',
            padding: '2px 4px 2px 12px',
            gap: '8px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Enter Telegram channel (@channel or t.me/s/name) or post link..."
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '12px',
              color: 'var(--text-primary)',
              outline: 'none',
              height: '32px',
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#229ED9',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
            <span>Fetch Feed</span>
          </button>
        </form>

        {/* Right: Bot Token Auth Status + Folder Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Bot Token Authentication Pill */}
          <button
            type="button"
            onClick={() => {
              setTokenInput(botToken);
              setAuthError('');
              setAuthSuccess('');
              setShowAuthModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: botInfo ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-main)',
              color: botInfo ? '#10b981' : 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={botInfo ? `Authenticated as @${botInfo.username}` : 'Configure Telegram Bot Token'}
          >
            <Key size={13} color={botInfo ? '#10b981' : 'var(--text-muted)'} />
            <span>{botInfo ? `@${botInfo.username}` : 'Authenticate Bot'}</span>
            {botInfo && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />}
          </button>

          {/* Folder Destination Selector */}
          <button
            type="button"
            onClick={handlePickFolder}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`Download Destination: ${customFolder}`}
          >
            <FolderOpen size={13} color="var(--primary, #229ED9)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {customFolder.split(/[\\/]/).pop() || 'Telegram Folder'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Channel Suggestions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 24px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
          overflowX: 'auto',
          fontSize: '11.5px',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
          Popular Channels:
        </span>
        {popularChannels.map((c) => (
          <button
            key={c.handle}
            type="button"
            onClick={() => {
              setChannelInput(c.handle);
              fetchChannelFeed(c.handle);
            }}
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid var(--border-medium)',
              backgroundColor: activeChannel?.username === c.handle ? 'rgba(34, 158, 217, 0.12)' : 'var(--bg-main)',
              color: activeChannel?.username === c.handle ? '#229ED9' : 'var(--text-secondary)',
              fontWeight: activeChannel?.username === c.handle ? 600 : 400,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {c.name} ({c.handle})
          </button>
        ))}
      </div>

      {/* Success Notification Banner */}
      {downloadNotice && (
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={14} />
            <span>{downloadNotice}</span>
          </div>
          <button
            onClick={() => setDownloadNotice('')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Body Area: Channel Header + Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 28px',
          gap: '18px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 2. AUTHENTIC TELEGRAM CHANNEL PROFILE CARD */}
        {activeChannel && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-medium)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {activeChannel.avatar ? (
                <img
                  src={activeChannel.avatar}
                  alt={activeChannel.title}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#229ED9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                >
                  {activeChannel.title ? activeChannel.title.charAt(0).toUpperCase() : 'T'}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {activeChannel.title}
                  </h1>
                  {activeChannel.verified && (
                    <CheckCircle2 size={16} color="#229ED9" fill="rgba(34, 158, 217, 0.15)" />
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>{activeChannel.username}</span> &bull; <span>{activeChannel.subscribers}</span>
                </div>
                {activeChannel.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px' }}>
                    {activeChannel.description}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {selectedIds.size === filteredPosts.length ? 'Deselect All' : `Select All (${filteredPosts.length})`}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.electronAPI?.openExternal) {
                    window.electronAPI.openExternal(`https://t.me/${activeChannel.username.replace('@', '')}`);
                  }
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ExternalLink size={13} />
                <span>Open in App</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SUB-NAVIGATION: FILTERS & VIEW MODE SWITCHER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-medium)',
            paddingBottom: '10px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Telegram Channel Media Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Posts', icon: List },
              { id: 'photos', label: 'Photos', icon: ImageIcon },
              { id: 'videos', label: 'Videos', icon: Film },
              { id: 'files', label: 'Files', icon: FileText },
              { id: 'audio', label: 'Audio', icon: Music },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #229ED9' : '1px solid transparent',
                    backgroundColor: isActive ? 'rgba(34, 158, 217, 0.1)' : 'transparent',
                    color: isActive ? '#229ED9' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Feed vs Gallery Grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-card)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
            <button
              type="button"
              onClick={() => setViewLayout('feed')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewLayout === 'feed' ? 'var(--bg-main)' : 'transparent',
                color: viewLayout === 'feed' ? '#229ED9' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <List size={13} />
              <span>Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewLayout === 'grid' ? 'var(--bg-main)' : 'transparent',
                color: viewLayout === 'grid' ? '#229ED9' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={13} />
              <span>Media Grid</span>
            </button>
          </div>
        </div>

        {/* 4. POSTS FEED / CONTENT DISPLAY */}
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={24} color="#229ED9" className="animate-spin" />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Connecting to Telegram and fetching posts...
            </span>
          </div>
        ) : fetchError ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <span>{fetchError}</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No media matching "{selectedFilter}" found in this channel.
          </div>
        ) : viewLayout === 'feed' ? (
          /* TELEGRAM CHANNEL FEED STREAM (Clean message bubbles) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredPosts.map((post) => {
              const isSelected = selectedIds.has(post.id);
              return (
                <div
                  key={post.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #229ED9' : '1px solid var(--border-medium)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isSelected ? '0 4px 16px rgba(34, 158, 217, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top: Header with channel name, post date, multi-select checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(post.id)}
                        style={{ cursor: 'pointer', accentColor: '#229ED9', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {activeChannel.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Post #{post.postId} &bull; {post.date}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {post.views && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <Eye size={12} />
                          <span>{post.views}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(post.postUrl, post.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === post.id ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Copy Telegram Post Link"
                      >
                        {copiedId === post.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Attached Media: Video or Photo or File */}
                  {post.mediaType === 'video' && post.mediaUrl && (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        maxWidth: '680px',
                        maxHeight: '420px',
                      }}
                    >
                      <video
                        src={post.mediaUrl}
                        controls
                        poster={post.thumbnail}
                        style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
                      />
                      {post.videoDuration && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {post.videoDuration}
                        </span>
                      )}
                    </div>
                  )}

                  {post.mediaType === 'photo' && post.mediaUrl && (
                    <div
                      onClick={() => setLightboxItem(post)}
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        maxWidth: '680px',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={post.mediaUrl}
                        alt="Telegram Photo"
                        style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  )}

                  {post.mediaType === 'file' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-medium)',
                        maxWidth: '520px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(34, 158, 217, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#229ED9',
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.fileName || 'Telegram Document'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {post.fileSize || 'Document File'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Caption / Text */}
                  {post.text && (
                    <div
                      style={{
                        fontSize: '13.5px',
                        lineHeight: '1.5',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {post.text}
                    </div>
                  )}

                  {/* Bottom: Download Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-light, rgba(0,0,0,0.04))' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Save to: {customFolder.split(/[\\/]/).pop()}
                    </span>

                    {(post.mediaUrl || post.mediaType === 'file') && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPost(post)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#229ED9',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(34, 158, 217, 0.25)',
                        }}
                      >
                        <Download size={13} />
                        <span>Download {post.mediaType === 'video' ? 'Video' : (post.mediaType === 'photo' ? 'Photo' : 'File')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TELEGRAM MEDIA GRID (Square / Clean Tiles Gallery) */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredPosts.map((post) => {
              const isSelected = selectedIds.has(post.id);
              const previewSrc = post.thumbnail || post.mediaUrl;
              return (
                <div
                  key={post.id}
                  onClick={() => {
                    if (post.mediaType === 'photo' || post.mediaType === 'video') {
                      setLightboxItem(post);
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #229ED9' : '1px solid var(--border-medium)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Media Tile */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      backgroundColor: '#0f172a',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileText size={36} color="#64748b" />
                    )}

                    {/* Media Type Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {post.mediaType}
                    </span>

                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(post.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#229ED9' : 'rgba(0,0,0,0.6)',
                        border: '1px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>

                    {/* Download Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPost(post);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#229ED9',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  {/* Caption snippet */}
                  <div style={{ padding: '8px 10px', fontSize: '11.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.text || post.fileName || `Post #${post.postId}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. FLOATING BATCH ACTIONS TOOLBAR (when items are selected) */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '999px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 100,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {selectedIds.size} {selectedIds.size === 1 ? 'post' : 'posts'} selected
          </span>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <button
            type="button"
            onClick={handleDownloadBatch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#229ED9',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Download All Selected</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* 6. TELEGRAM BOT TOKEN AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div
          onClick={() => setShowAuthModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-medium)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-medium)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} color="#229ED9" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Telegram Bot API Authentication
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34, 158, 217, 0.08)',
                  border: '1px solid rgba(34, 158, 217, 0.2)',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontWeight: 600, color: '#229ED9', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} />
                  <span>Why Telegram Bot Token is the Best & Safest Method</span>
                </div>
                <div>
                  &bull; <strong>100% Ban-Proof:</strong> User accounts risk permanent bans from Telegram when using unofficial phone-number scrapers or MTProto session strings. Official Bot API tokens protect your personal account completely.<br/>
                  &bull; <strong>Zero Login Friction:</strong> No SMS OTP codes, phone numbers, or 2FA passwords required.<br/>
                  &bull; <strong>Public Channels:</strong> Public channel feeds work out of the box with <em>zero authentication</em> required!
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  How to get a token in 15 seconds:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.electronAPI?.openExternal) {
                      window.electronAPI.openExternal('https://t.me/BotFather');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34, 158, 217, 0.1)',
                    border: '1px solid rgba(34, 158, 217, 0.3)',
                    color: '#229ED9',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Open @BotFather</span>
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Bot Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {authError && (
                <div style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {botInfo && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Active Bot: </span>
                  <span>{botInfo.first_name} (@{botInfo.username})</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
              }}
            >
              {botInfo ? (
                <button
                  type="button"
                  onClick={handleDisconnectBot}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Disconnect Token
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVerifyingBot}
                  onClick={() => verifyBotToken(tokenInput, true)}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#229ED9',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isVerifyingBot && <RefreshCw size={12} className="animate-spin" />}
                  <span>Save & Authenticate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MEDIA LIGHTBOX INSPECTOR */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#09090b',
              borderRadius: '12px',
              border: '1px solid #27272a',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #27272a', color: '#fff' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {activeChannel.title} &bull; Post #{lightboxItem.postId}
              </span>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
              {lightboxItem.mediaType === 'video' ? (
                <video
                  src={lightboxItem.mediaUrl}
                  controls
                  autoPlay
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                />
              ) : (
                <img
                  src={lightboxItem.mediaUrl}
                  alt="Telegram Photo"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid #27272a', backgroundColor: '#121214', color: '#fff' }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {lightboxItem.date} &bull; {lightboxItem.views || 'Public Post'}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleDownloadPost(lightboxItem);
                  setLightboxItem(null);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#229ED9',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
