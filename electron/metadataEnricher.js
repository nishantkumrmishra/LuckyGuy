const https = require('https');
let jiosaavnExtractor = null;
try {
  jiosaavnExtractor = require('./extractors/jiosaavn');
} catch (e) {}

function searchItunes(term, expectedArtist = '', limit = 5) {
  return new Promise((resolve) => {
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return resolve(null);
    }

    const cleanTerm = encodeURIComponent(term.trim());
    const url = `https://itunes.apple.com/search?term=${cleanTerm}&entity=song&limit=${limit}`;

    const req = https.get(url, { headers: { 'User-Agent': 'LocalGuy/1.0' } }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.results && json.results.length > 0) {
            let item = json.results[0];
            if (expectedArtist && json.results.length > 1) {
              const expLower = expectedArtist.toLowerCase();
              const matched = json.results.find(r => 
                (r.artistName && r.artistName.toLowerCase().includes(expLower)) ||
                (expLower.includes(r.artistName ? r.artistName.toLowerCase() : ''))
              );
              if (matched) item = matched;
            }

            return resolve({
              title: item.trackName || '',
              track: item.trackName || '',
              artist: item.artistName || '',
              album: item.collectionName || '',
              genre: item.primaryGenreName || 'Music',
              releaseDate: item.releaseDate ? item.releaseDate.slice(0, 4) : '',
              artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : ''
            });
          }
        } catch (e) {}
        resolve(null);
      });
    });

    req.setTimeout(6000, () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => resolve(null));
  });
}

function cleanQueryText(text) {
  if (!text) return '';
  return text
    .replace(/[_\u00a0]/g, ' ')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\{.*?\}/g, '')
    .replace(/official\s*(music\s*)?(video|mv|audio)/gi, '')
    .replace(/lyric(s)?(\s*video)?/gi, '')
    .replace(/full\s*(video|song|audio)/gi, '')
    .replace(/visualizer/gi, '')
    .replace(/4k|1080p|720p|hd|uhd/gi, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/from \".*?\"/gi, '')
    .replace(/from Dhurandhar.*?$/gi, '')
    .replace(/[\"\'\`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent Genre Normalization
 * Resolves K-Pop, unifies Indian/Bollywood fragmentation, and ensures clean neat folder categories.
 */
function normalizeGenre(rawGenre, artist = '', title = '') {
  const g = (rawGenre || '').toLowerCase().trim();
  const a = (artist || '').toLowerCase().trim();
  const t = (title || '').toLowerCase().trim();
  const aClean = a.replace(/[^a-z0-9]/g, '');
  const tClean = t.replace(/[^a-z0-9]/g, '');

  // 1. K-Pop (BTS, Blackpink, Stray Kids, TXT, NewJeans, Twice, Jung Kook, etc. NEVER Indian!)
  const isKpop =
    g.includes('k-pop') || g.includes('kpop') || g.includes('korean') ||
    a.includes('bts') || a.includes('blackpink') || a.includes('bangtan') ||
    aClean.includes('jungkook') || aClean.includes('jimin') || aClean.includes('agustd') ||
    aClean.includes('suga') || a.includes('twice') || aClean.includes('straykids') ||
    aClean.includes('newjeans') || a.includes('seventeen') || a.includes('enhypen') ||
    a.includes('exo') || aClean.includes('tomorrowxtogether') || a.includes('txt') ||
    aClean.includes('lesserafim') || a.includes('aespa') || a.includes('itzy') ||
    tClean.includes('kpop');

  if (isKpop) {
    return 'K-Pop';
  }

  // 2. Indian & Bollywood unification
  // Eliminates splintered "Indian" vs "Bollywood" folders into clean "Bollywood"
  if (
    g.includes('bollywood') || g.includes('hindi') || g.includes('indian pop') ||
    g === 'indian' || g.includes('filmi') ||
    (g.includes('soundtrack') && (a.includes('arijit') || a.includes('pritam') || a.includes('shreya') || a.includes('rahman') || a.includes('badshah')))
  ) {
    return 'Bollywood';
  }

  // 3. Regional Indian music
  if (g.includes('punjabi') || a.includes('diljit') || a.includes('sidhu') || a.includes('ap dhillon') || a.includes('karan aujla')) {
    return 'Punjabi';
  }
  if (g.includes('tamil') || g.includes('telugu') || g.includes('malayalam') || g.includes('kannada') || g.includes('tollywood') || g.includes('kollywood')) {
    return 'South Indian';
  }

  // 4. Western & Global Genres
  if (g.includes('hip-hop') || g.includes('hip hop') || g.includes('rap')) return 'Hip-Hop';
  if (g.includes('rock') || g.includes('metal') || g.includes('punk') || g.includes('alternative')) return 'Rock';
  if (g.includes('electronic') || g.includes('edm') || g.includes('dance') || g.includes('house') || g.includes('techno')) return 'Electronic';
  if (g.includes('lo-fi') || g.includes('lofi') || g.includes('chill')) return 'Lo-Fi';
  if (g.includes('acoustic') || g.includes('folk')) return 'Acoustic';
  if (g.includes('r&b') || g.includes('soul')) return 'R&B';
  if (g.includes('jazz') || g.includes('blues')) return 'Jazz';
  if (g.includes('classical')) return 'Classical';
  if (g.includes('pop')) return 'Pop';

  // 5. Default fallback
  if (!rawGenre || g === 'music' || g === 'other' || g === 'unknown' || g === 'undefined') {
    return 'Pop';
  }

  return rawGenre.charAt(0).toUpperCase() + rawGenre.slice(1);
}

async function fetchEnrichedMetadata(title, artist) {
  const cleanTitle = cleanQueryText(title);
  const cleanArtist = cleanQueryText(artist);

  // 1. Try iTunes with artist + title
  let query = '';
  if (cleanArtist && cleanArtist !== 'Unknown Artist' && cleanArtist !== 'Various Artists') {
    query = cleanArtist + ' ' + cleanTitle;
  } else {
    query = cleanTitle;
  }

  let meta = await searchItunes(query, cleanArtist);
  
  // 2. Try iTunes with title alone
  if (!meta && cleanTitle && cleanTitle !== query) {
    meta = await searchItunes(cleanTitle, cleanArtist);
  }

  // 3. If still not found and artist/query looks Indian, try JioSaavn
  const isLikelyIndian = !meta && jiosaavnExtractor && (
    cleanArtist.toLowerCase().includes('singh') ||
    cleanArtist.toLowerCase().includes('kumar') ||
    cleanArtist.toLowerCase().includes('shreya') ||
    cleanArtist.toLowerCase().includes('arijit') ||
    cleanArtist.toLowerCase().includes('pritam') ||
    cleanArtist.toLowerCase().includes('badshah') ||
    cleanArtist.toLowerCase().includes('diljit') ||
    cleanArtist.toLowerCase().includes('rahman')
  );

  if ((!meta || !meta.artworkUrl) && isLikelyIndian && jiosaavnExtractor) {
    try {
      const jio = await jiosaavnExtractor.searchTrack(query || cleanTitle);
      if (jio && jio.artworkUrl) {
        meta = {
          title: jio.title || meta?.title || title,
          track: jio.title || meta?.track || title,
          artist: jio.artist || meta?.artist || artist,
          album: jio.album || meta?.album || 'Single Master',
          genre: 'Bollywood', // Unified Bollywood instead of generic Indian
          releaseDate: meta?.releaseDate || '',
          artworkUrl: jio.artworkUrl
        };
      }
    } catch (e) {}
  }

  if (meta) {
    meta.genre = normalizeGenre(meta.genre, meta.artist || artist, meta.title || title);
  }

  return meta;
}

module.exports = {
  fetchEnrichedMetadata,
  searchItunes,
  normalizeGenre,
};
