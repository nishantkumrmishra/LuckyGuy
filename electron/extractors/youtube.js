const VIDEO_ID_REGEX = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const PLAYLIST_ID_REGEX = /[?&]list=([a-zA-Z0-9_-]+)/;

const INNERTUBE_CLIENTS = [
  {
    clientName: 'ANDROID_VR',
    clientVersion: '1.60.19',
    deviceMake: 'Oculus',
    deviceModel: 'Quest 3',
    osName: 'Android',
    osVersion: '12L',
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'
  },
  {
    clientName: 'ANDROID',
    clientVersion: '19.45.38',
    deviceMake: 'Google',
    deviceModel: 'Pixel 8',
    osName: 'Android',
    osVersion: '14',
    userAgent: 'com.google.android.youtube/19.45.38 (Linux; U; Android 14) gzip'
  },
  {
    clientName: 'TVHTML5',
    clientVersion: '7.20250101.07.00',
    deviceMake: 'Samsung',
    deviceModel: 'SmartTV',
    osName: 'Tizen',
    osVersion: '7.0',
    userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) Cobalt/25.lts.30'
  }
];

function extractVideoId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }
  const match = trimmed.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

function extractPlaylistId(url) {
  if (!url) return null;
  const match = url.trim().match(PLAYLIST_ID_REGEX);
  return match ? match[1] : null;
}

async function fetchVideoMetadata(videoId) {
  for (const clientConfig of INNERTUBE_CLIENTS) {
    try {
      const payload = {
        context: {
          client: {
            clientName: clientConfig.clientName,
            clientVersion: clientConfig.clientVersion,
            deviceMake: clientConfig.deviceMake,
            deviceModel: clientConfig.deviceModel,
            osName: clientConfig.osName,
            osVersion: clientConfig.osVersion,
            hl: 'en',
            gl: 'US'
          }
        },
        videoId: videoId,
        playbackContext: {
          contentPlaybackContext: {
            html5Preference: 'HTML5_PREF_WANTS'
          }
        }
      };

      const resp = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': clientConfig.userAgent
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) continue;

      const data = await resp.json();
      const videoDetails = data.videoDetails;
      const streamingData = data.streamingData;

      if (!videoDetails || !streamingData) continue;

      const formats = streamingData.formats || [];
      const adaptiveFormats = streamingData.adaptiveFormats || [];

      // Progressive video streams (Audio + Video)
      const progressiveStreams = formats
        .filter(f => f.url && f.mimeType && f.mimeType.includes('video'))
        .map(f => ({
          itag: f.itag,
          url: f.url,
          qualityLabel: f.qualityLabel || `${f.height}p`,
          mimeType: f.mimeType,
          contentLength: parseInt(f.contentLength || '0', 10),
          isVideo: true,
          isAudio: true,
          bitrate: f.bitrate
        }));

      // Audio only streams
      const audioStreams = adaptiveFormats
        .filter(f => f.url && f.mimeType && f.mimeType.startsWith('audio/'))
        .map(f => ({
          itag: f.itag,
          url: f.url,
          qualityLabel: f.audioQuality ? f.audioQuality.replace('AUDIO_QUALITY_', '') : 'High Audio',
          mimeType: f.mimeType,
          contentLength: parseInt(f.contentLength || '0', 10),
          isVideo: false,
          isAudio: true,
          bitrate: f.bitrate
        }))
        .sort((a, b) => b.bitrate - a.bitrate);

      // Video only adaptive streams
      const videoAdaptiveStreams = adaptiveFormats
        .filter(f => f.url && f.mimeType && f.mimeType.startsWith('video/'))
        .map(f => ({
          itag: f.itag,
          url: f.url,
          qualityLabel: f.qualityLabel || `${f.height}p`,
          mimeType: f.mimeType,
          contentLength: parseInt(f.contentLength || '0', 10),
          isVideo: true,
          isAudio: false,
          bitrate: f.bitrate
        }));

      const thumbs = videoDetails.thumbnail?.thumbnails || [];
      const bestThumbnail = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Select direct progressive stream or audio stream
      const bestProgressive = progressiveStreams.find(s => s.itag === 22) || progressiveStreams[0] || null;
      const bestAudio = audioStreams[0] || null;

      return {
        id: videoId,
        title: videoDetails.title || 'YouTube Video',
        author: videoDetails.author || 'YouTube Creator',
        durationSeconds: parseInt(videoDetails.lengthSeconds || '0', 10),
        thumbnailUrl: bestThumbnail,
        progressiveStreams,
        audioStreams,
        videoAdaptiveStreams,
        directStreamUrl: bestProgressive ? bestProgressive.url : (bestAudio ? bestAudio.url : null)
      };
    } catch (err) {
      console.warn(`YouTube Innertube error with ${clientConfig.clientName}:`, err.message);
    }
  }

  // Fallback: oEmbed metadata if player API fails
  try {
    const oembedResp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedResp.ok) {
      const oembed = await oembedResp.json();
      return {
        id: videoId,
        title: oembed.title || 'YouTube Video',
        author: oembed.author_name || 'YouTube',
        durationSeconds: 0,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        progressiveStreams: [],
        audioStreams: [],
        directStreamUrl: null
      };
    }
  } catch (e) {}

  return null;
}

module.exports = {
  extractVideoId,
  extractPlaylistId,
  fetchVideoMetadata
};
