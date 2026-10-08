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

async function extractSpotifyEntity(url) {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) return null;

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

          // Resolve audio stream via JioSaavn 320k
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

          const tracks = rawTracks.map(t => ({
            id: t.id || Math.random().toString(36).substring(7),
            title: t.title || t.name,
            artist: t.subtitle || t.artists?.map(a => a.name).join(', ') || 'Various Artists',
            durationMs: t.duration || 0,
            coverUrl: cover
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
