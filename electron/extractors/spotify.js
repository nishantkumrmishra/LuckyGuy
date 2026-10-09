const jiosaavn = require('./jiosaavn');

const SPOTIFY_URL_REGEX = /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/|spotify:(track|playlist|album):)([a-zA-Z0-9]+)/;

function isSpotifyUrl(url) {
  if (!url) return false;
  return SPOTIFY_URL_REGEX.test(url.trim());
}

function parseSpotifyUrl(url) {
  if (!url) return null;
  const match = url.trim().match(SPOTIFY_URL_REGEX);
  if (!match) return null;
  const type = match[1] || match[2];
  const id = match[3];
  return { type, id };
}

async function getSpotifyCookieToken(cookie) {
  if (!cookie || !cookie.trim()) return null;
  try {
    const resp = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'App-Platform': 'WebPlayer',
        'Cookie': `sp_dc=${cookie.trim()}`
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.accessToken;
    }
  } catch (e) {
    console.warn('[Spotify] Cookie token error:', e.message);
  }
  return null;
}

async function getSpotifyApiToken(clientId, clientSecret) {
  if (!clientId || !clientSecret) return null;
  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.access_token;
    }
  } catch (e) {
    console.warn('[Spotify] Token fetch error:', e.message);
  }
  return null;
}


// Full 200+ tracks playlist extraction via native offscreen Spotify session
async function fetchFullSpotifyPlaylistBrowser(playlistId) {
  let BrowserWindow;
  let electronApp;
  try {
    const electron = require('electron');
    BrowserWindow = electron.BrowserWindow;
    electronApp = electron.app;
  } catch (e) {
    return null;
  }
  if (!BrowserWindow) return null;

  if (electronApp && !electronApp.isReady()) {
    await electronApp.whenReady();
  }

  let win = null;
  try {
    win = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: { offscreen: true }
    });

    let capturedHeaders = null;
    const filter = { urls: ['https://api-partner.spotify.com/*'] };

    win.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      if (details.method === 'POST' && details.requestHeaders['authorization'] && details.requestHeaders['client-token']) {
        capturedHeaders = details.requestHeaders;
      }
      callback({ requestHeaders: details.requestHeaders });
    });

    win.loadURL(`https://open.spotify.com/playlist/${playlistId}`);

    // Wait up to 10s for authorization and client token
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (capturedHeaders) break;
    }

    if (!capturedHeaders || !capturedHeaders.authorization) {
      console.warn('[Spotify] Could not capture web player tokens for playlist:', playlistId);
      return null;
    }

    let offset = 0;
    const limit = 50;
    const allTracks = [];
    let playlistTitle = 'Spotify Playlist';
    let playlistCover = '';

    while (true) {
      const body = {
        variables: {
          uri: `spotify:playlist:${playlistId}`,
          offset,
          limit
        },
        operationName: 'queryPlaylist',
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: 'c685ca91fb0019c87ff1225f84e1d85b26cd631fa6187f3f0900da182cb0953d'
          }
        }
      };

      const resp = await fetch('https://api-partner.spotify.com/pathfinder/v2/query', {
        method: 'POST',
        headers: {
          'authorization': capturedHeaders.authorization,
          'client-token': capturedHeaders['client-token'] || '',
          'content-type': 'application/json;charset=UTF-8',
          'accept': 'application/json',
          'Origin': 'https://open.spotify.com',
          'Referer': 'https://open.spotify.com/'
        },
        body: JSON.stringify(body)
      });

      if (!resp.ok) break;
      const json = await resp.json();
      const plData = json?.data?.playlistV2;
      if (!plData) break;

      if (offset === 0) {
        playlistTitle = plData.name || playlistTitle;
        playlistCover = plData.images?.items?.[0]?.sources?.[0]?.url || '';
      }

      const items = plData.content?.items || [];
      const totalCount = plData.content?.totalCount || 0;

      for (const item of items) {
        const itemData = item.itemV2?.data;
        if (!itemData) continue;
        const title = itemData.name;
        const artist = itemData.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(', ') || 'Unknown Artist';
        const album = itemData.albumOfTrack?.name || '';
        const cover = itemData.albumOfTrack?.coverArt?.sources?.[0]?.url || '';
        const durationMs = itemData.trackDuration?.totalMilliseconds || 0;
        allTracks.push({
          id: itemData.uri?.split(':')?.[2] || Math.random().toString(36).substring(7),
          title,
          artist,
          album,
          coverUrl: cover,
          durationMs
        });
      }

      offset += items.length;
      if (offset >= totalCount || items.length === 0) break;
    }

    if (allTracks.length > 0) {
      return {
        type: 'playlist',
        id: playlistId,
        title: playlistTitle,
        artworkUrl: playlistCover,
        itemCount: allTracks.length,
        tracks: allTracks
      };
    }
  } catch (err) {
    console.warn('[Spotify] Pathfinder browser fetch failed:', err.message);
  } finally {
    if (win && !win.isDestroyed()) {
      try { win.destroy(); } catch (e) {}
    }
  }
  return null;
}

async function fetchFullSpotifyPlaylist(playlistId, token) {
  let tracks = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let playlistTitle = 'Spotify Playlist';
  let playlistCover = '';

  while (hasMore) {
    try {
      const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,images,tracks.total,tracks.limit,tracks.offset,tracks.next,tracks.items(track(id,name,duration_ms,artists(name),album(name,images)))&limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        // Fallback to tracks endpoint
        const trResp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!trResp.ok) break;
        const trData = await trResp.json();
        const items = trData.items || [];
        for (const item of items) {
          const t = item.track;
          if (!t) continue;
          tracks.push({
            id: t.id || Math.random().toString(36).substring(7),
            title: t.name,
            artist: t.artists?.map(a => a.name).join(', ') || 'Various Artists',
            album: t.album?.name || '',
            coverUrl: t.album?.images?.[0]?.url || '',
            durationMs: t.duration_ms || 0
          });
        }
        if (trData.next && items.length > 0) {
          offset += limit;
        } else {
          hasMore = false;
        }
        continue;
      }

      const data = await resp.json();
      if (offset === 0) {
        playlistTitle = data.name || playlistTitle;
        playlistCover = data.images?.[0]?.url || '';
      }

      const items = data.tracks?.items || [];
      for (const item of items) {
        const t = item.track;
        if (!t) continue;
        tracks.push({
          id: t.id || Math.random().toString(36).substring(7),
          title: t.name,
          artist: t.artists?.map(a => a.name).join(', ') || 'Various Artists',
          album: t.album?.name || '',
          coverUrl: t.album?.images?.[0]?.url || '',
          durationMs: t.duration_ms || 0
        });
      }

      if (data.tracks?.next && items.length > 0) {
        offset += limit;
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.warn('[Spotify] Pagination error:', e.message);
      break;
    }
  }

  return {
    type: 'playlist',
    id: playlistId,
    title: playlistTitle,
    artworkUrl: playlistCover,
    itemCount: tracks.length,
    tracks
  };
}

async function extractSpotifyEntity(url, preferences = {}) {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) return null;

  // 1. If Spotify Developer credentials or sp_dc cookie exist, use official API with full pagination (>100 tracks)!
  const clientId = preferences.spotifyClientId || preferences.plugins?.spotifyClientId;
  const clientSecret = preferences.spotifyClientSecret || preferences.plugins?.spotifyClientSecret;
  const spDcCookie = preferences.spotifyCookie || preferences.plugins?.spotifyCookie;

  let token = null;
  if (clientId && clientSecret) {
    token = await getSpotifyApiToken(clientId, clientSecret);
  } else if (spDcCookie) {
    token = await getSpotifyCookieToken(spDcCookie);
  }

  if (token) {
    try {
      if (token) {
        if (parsed.type === 'playlist') {
          return await fetchFullSpotifyPlaylist(parsed.id, token);
        } else if (parsed.type === 'track') {
          const resp = await fetch(`https://api.spotify.com/v1/tracks/${parsed.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp.ok) {
            const track = await resp.json();
            const title = track.name;
            const artist = track.artists?.map(a => a.name).join(', ') || 'Various Artists';
            const cover = track.album?.images?.[0]?.url || '';
            const resolved = await jiosaavn.searchTrack(`${title} ${artist}`);
            return {
              type: 'track',
              id: parsed.id,
              title,
              artist,
              album: track.album?.name || '',
              artworkUrl: cover || resolved?.artworkUrl || '',
              durationSeconds: Math.round((track.duration_ms || 0) / 1000),
              streamUrl: resolved?.streamUrl || null,
              bitrate: resolved?.bitrate || '320kbps'
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn('[Spotify] API fetch fallback to embed:', apiErr.message);
    }
  }

  // 2. Automated Full 200+ Tracks Playlist Extraction via Pathfinder GraphQL
  if (parsed.type === 'playlist') {
    try {
      const fullPlaylist = await fetchFullSpotifyPlaylistBrowser(parsed.id);
      if (fullPlaylist && fullPlaylist.tracks && fullPlaylist.tracks.length > 0) {
        return fullPlaylist;
      }
    } catch (browserErr) {
      console.warn('[Spotify] Browser extraction fallback to embed:', browserErr.message);
    }
  }

  // 3. Public Embed fallback
  try {
    const embedUrl = `https://open.spotify.com/embed/${parsed.type}/${parsed.id}`;
    const resp = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      const state = data?.props?.pageProps?.state?.data?.entity;
      if (state) {
        if (parsed.type === 'track') {
          const title = state.name || 'Unknown Title';
          const artist = state.artists?.map(a => a.name).join(', ') || state.artist || 'Unknown Artist';
          const cover = state.coverArt?.sources?.[0]?.url || state.album?.images?.[0]?.url || '';
          const duration = Math.round((state.duration || 0) / 1000);

          const resolved = await jiosaavn.searchTrack(`${title} ${artist}`);

          return {
            type: 'track',
            id: parsed.id,
            title,
            artist,
            album: state.album?.name || '',
            artworkUrl: cover || resolved?.artworkUrl || '',
            durationSeconds: duration || resolved?.duration || 0,
            streamUrl: resolved?.streamUrl || null,
            bitrate: resolved?.bitrate || '320kbps',
            resolvedSource: resolved?.source || 'Pending Resolution'
          };
        } else {
          // Playlist or Album
          const title = state.name || state.title || 'Spotify Playlist';
          const cover = state.coverArt?.sources?.[0]?.url || state.images?.[0]?.url || '';
          const rawTracks = state.trackList || state.tracks?.items || [];

          // Note: Leave coverUrl empty if it's the playlist header so individual song scanner fetches the authentic song artwork!
          const tracks = rawTracks.map(t => ({
            id: t.id || Math.random().toString(36).substring(7),
            title: t.title || t.name,
            artist: t.subtitle || t.artists?.map(a => a.name).join(', ') || 'Various Artists',
            durationMs: t.duration || 0,
            coverUrl: t.album?.images?.[0]?.url || ''
          }));

          return {
            type: parsed.type,
            id: parsed.id,
            title,
            artworkUrl: cover,
            itemCount: tracks.length,
            tracks
          };
        }
      }
    }

    // Fallback: oEmbed
    const oembedResp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (oembedResp.ok) {
      const oembed = await oembedResp.json();
      const parts = (oembed.title || '').split(' - ');
      const title = parts.length > 1 ? parts[1] : oembed.title;
      const artist = parts.length > 1 ? parts[0] : '';
      const resolved = await jiosaavn.searchTrack(`${title} ${artist}`);

      return {
        type: parsed.type,
        id: parsed.id,
        title: title || 'Spotify Audio',
        artist: artist || 'Spotify Artist',
        artworkUrl: oembed.thumbnail_url || resolved?.artworkUrl || '',
        durationSeconds: resolved?.duration || 0,
        streamUrl: resolved?.streamUrl || null,
        bitrate: resolved?.bitrate || '320kbps',
        resolvedSource: resolved?.source || 'Direct Search'
      };
    }
  } catch (err) {
    console.error('Spotify extraction error:', err.message);
  }

  return null;
}

module.exports = {
  isSpotifyUrl,
  parseSpotifyUrl,
  extractSpotifyEntity
};
