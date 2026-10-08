const https = require('https');

function searchItunes(term) {
  return new Promise((resolve) => {
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return resolve(null);
    }

    const cleanTerm = encodeURIComponent(term.trim());
    const url = `https://itunes.apple.com/search?term=${cleanTerm}&entity=song&limit=1`;

    const req = https.get(url, { headers: { 'User-Agent': 'LocalGuy/1.0' } }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.results && json.results.length > 0) {
            const item = json.results[0];
            return resolve({
              genre: item.primaryGenreName || 'Music',
              artist: item.artistName || '',
              track: item.trackName || '',
              album: item.collectionName || '',
              releaseDate: item.releaseDate ? item.releaseDate.slice(0, 4) : '',
              artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : ''
            });
          }
        } catch (e) {}
        resolve(null);
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => resolve(null));
  });
}

async function fetchEnrichedMetadata(title, artist) {
  let query = (title || '').trim();
  if (artist && artist !== 'Unknown Artist' && artist !== 'Various Artists') {
    query += ' ' + artist.trim();
  }
  let meta = await searchItunes(query);
  if (!meta && title) {
    meta = await searchItunes(title);
  }
  return meta;
}

module.exports = {
  fetchEnrichedMetadata,
  searchItunes
};
