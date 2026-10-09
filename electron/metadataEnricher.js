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
    .replace(/[_ ]/g, ' ')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/from ".*?"/gi, '')
    .replace(/from Dhurandhar.*?$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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

  // 3. Fallback to JioSaavn if iTunes returned no artwork or nothing
  if ((!meta || !meta.artworkUrl) && jiosaavnExtractor) {
    try {
      const jio = await jiosaavnExtractor.searchTrack(query || cleanTitle);
      if (jio && jio.artworkUrl) {
        meta = {
          title: jio.title || meta?.title || title,
          track: jio.title || meta?.track || title,
          artist: jio.artist || meta?.artist || artist,
          album: jio.album || meta?.album || 'Single Master',
          genre: meta?.genre || 'Indian',
          releaseDate: meta?.releaseDate || '',
          artworkUrl: jio.artworkUrl
        };
      }
    } catch (e) {}
  }

  return meta;
}

module.exports = {
  fetchEnrichedMetadata,
  searchItunes
};
