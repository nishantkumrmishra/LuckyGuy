const PORNHUB_REGEX = /(?:pornhub\.(?:org|com))\/(?:view_video\.php\?viewkey=)([a-zA-Z0-9_-]+)/;

let netFetch = null;
function getFetch() {
  if (netFetch) return netFetch;
  try {
    const electron = require('electron');
    if (electron && electron.net && typeof electron.net.fetch === 'function') {
      netFetch = electron.net.fetch.bind(electron.net);
      return netFetch;
    }
  } catch (e) {}
  return globalThis.fetch;
}

function isPornhubUrl(url) {
  if (!url) return false;
  return url.includes('pornhub.org') || url.includes('pornhub.com');
}

function extractViewkey(url) {
  if (!url) return null;
  const match = url.trim().match(/viewkey=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function extractPornhubVideo(url) {
  const vkey = extractViewkey(url);
  if (!vkey) return null;

  const targetUrl = `https://www.pornhub.org/view_video.php?viewkey=${vkey}`;
  const fetchFn = getFetch();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetchFn(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1; hasVisited=1; age_verified=1;'
      }
    });
    clearTimeout(timeoutId);

    if (!resp.ok) return null;
    const html = await resp.text();

    const m = html.match(/flashvars_\d+\s*=\s*(\{.*?\});/);
    if (!m) return null;

    const fv = JSON.parse(m[1]);
    const title = fv.video_title || 'Pornhub Video';
    const durationSeconds = parseInt(fv.video_duration || '0', 10);
    const artworkUrl = fv.image_url || '';
    const uploader = fv.video_uploader || 'Pornhub Creator';

    // Find direct MP4 streams from get_media endpoint
    let streamUrl = null;
    let quality = '1080p';
    const streams = {};

    const mp4Def = (fv.mediaDefinitions || []).find(x => x.format === 'mp4' && x.videoUrl);
    if (mp4Def && mp4Def.videoUrl) {
      try {
        const mController = new AbortController();
        const mTimeoutId = setTimeout(() => mController.abort(), 8000);
        const mResp = await fetchFn(mp4Def.videoUrl, {
          signal: mController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1; hasVisited=1; age_verified=1;'
          }
        });
        clearTimeout(mTimeoutId);

        if (mResp.ok) {
          const mediaList = await mResp.json();
          if (Array.isArray(mediaList)) {
            for (const item of mediaList) {
              if (item.videoUrl && item.quality) {
                const qKey = String(item.quality).endsWith('p') ? String(item.quality) : `${item.quality}p`;
                streams[qKey] = item.videoUrl;
              }
            }
          }
          // Pick highest quality available: 1080 -> 720 -> 480 -> 240
          const sorted = (mediaList || []).sort((a, b) => (parseInt(b.quality || '0', 10) - parseInt(a.quality || '0', 10)));
          if (sorted.length > 0 && sorted[0].videoUrl) {
            streamUrl = sorted[0].videoUrl;
            quality = (sorted[0].quality || '1080') + 'p';
          }
        }
      } catch (e) {
        console.warn('[PornhubExtractor] Error fetching mp4 media definitions:', e.message);
      }
    }

    // Fallback to HLS if mp4 not found
    if (!streamUrl) {
      const hlsDef = (fv.mediaDefinitions || []).find(x => x.format === 'hls' && x.videoUrl);
      if (hlsDef) {
        streamUrl = hlsDef.videoUrl;
        streams['Auto'] = hlsDef.videoUrl;
      }
    }

    if (!streamUrl) return null;

    return {
      platform: 'Pornhub',
      formatType: 'VIDEO',
      type: 'video',
      id: 'ph-' + vkey,
      title,
      artist: uploader,
      album: 'Pornhub Video',
      artworkUrl,
      durationSeconds,
      streamUrl,
      directStreamUrl: streamUrl,
      streams,
      qualityLabel: quality,
      ext: '.mp4',
      headers: {
        'Referer': 'https://www.pornhub.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1; hasVisited=1; age_verified=1;'
      }
    };
  } catch (err) {
    console.warn('[PornhubExtractor] Error:', err.message);
    return null;
  }
}

module.exports = {
  isPornhubUrl,
  extractViewkey,
  extractPornhubVideo
};
