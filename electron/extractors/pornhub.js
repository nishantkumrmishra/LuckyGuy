const PORNHUB_REGEX = /(?:pornhub\.(?:org|com))\/(?:view_video\.php\?viewkey=)([a-zA-Z0-9_-]+)/;

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
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1;'
      }
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    const m = html.match(/flashvars_\d+\s*=\s*(\{.*?\});/);
    if (!m) return null;

    const fv = JSON.parse(m[1]);
    const title = fv.video_title || 'Pornhub Video';
    const durationSeconds = parseInt(fv.video_duration || '0', 10);
    const artworkUrl = fv.image_url || '';
    const uploader = fv.video_uploader || 'Pornhub Creator';

    // Find direct MP4 stream from get_media endpoint
    let streamUrl = null;
    let quality = '1080p';

    const mp4Def = (fv.mediaDefinitions || []).find(x => x.format === 'mp4' && x.videoUrl);
    if (mp4Def && mp4Def.videoUrl) {
      try {
        const mResp = await fetch(mp4Def.videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1;'
          }
        });
        if (mResp.ok) {
          const mediaList = await mResp.json();
          // Pick highest quality available: 1080 -> 720 -> 480 -> 240
          const sorted = mediaList.sort((a, b) => (parseInt(b.quality || '0', 10) - parseInt(a.quality || '0', 10)));
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
      qualityLabel: quality,
      ext: '.mp4',
      headers: {
        'Referer': 'https://www.pornhub.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Cookie': 'accessAgeDisclaimerPH=1; platform=pc; bs=1;'
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
