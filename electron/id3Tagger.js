const fs = require('fs');
const http = require('http');
const https = require('https');

function fetchBuffer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return reject(new Error('Invalid URL for image download: ' + url));
    }

    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const original = new URL(url);
          redirectUrl = new URL(redirectUrl, original.origin).href;
        }
        return fetchBuffer(redirectUrl, timeoutMs).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error('Failed to fetch image, HTTP ' + res.statusCode));
      }

      const contentType = res.headers['content-type'] || '';
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType
        });
      });
      res.on('error', reject);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Image fetch timeout'));
    });

    req.on('error', reject);
  });
}

function makeTextFrame(frameId, text) {
  if (!text) return Buffer.alloc(0);
  const textBuf = Buffer.from(String(text), 'utf8');
  const content = Buffer.concat([Buffer.from([0x03]), textBuf]);
  const header = Buffer.alloc(10);
  header.write(frameId, 0, 4, 'ascii');
  header.writeUInt32BE(content.length, 4);
  header.writeUInt16BE(0, 8);
  return Buffer.concat([header, content]);
}

function makePictureFrame(imageBuffer, mimeType = 'image/jpeg') {
  if (!imageBuffer || imageBuffer.length === 0) return Buffer.alloc(0);
  
  const cleanMime = mimeType.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg';
  const mimeBuf = Buffer.from(cleanMime + '\0', 'ascii');
  const picType = Buffer.from([0x03]); // Front cover
  const descBuf = Buffer.from([0x00]); // Null-terminated empty description
  
  const content = Buffer.concat([
    Buffer.from([0x00]),
    mimeBuf,
    picType,
    descBuf,
    imageBuffer
  ]);

  const header = Buffer.alloc(10);
  header.write('APIC', 0, 4, 'ascii');
  header.writeUInt32BE(content.length, 4);
  header.writeUInt16BE(0, 8);
  return Buffer.concat([header, content]);
}

function encodeSynchSafe(size) {
  const b0 = (size >> 21) & 0x7f;
  const b1 = (size >> 14) & 0x7f;
  const b2 = (size >> 7) & 0x7f;
  const b3 = size & 0x7f;
  return Buffer.from([b0, b1, b2, b3]);
}

async function embedId3Metadata(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist: ' + filePath);
  }

  let artworkBuffer = metadata.artworkBuffer || null;
  let mimeType = metadata.mimeType || 'image/jpeg';

  if (!artworkBuffer && metadata.artworkUrl) {
    try {
      const res = await fetchBuffer(metadata.artworkUrl);
      artworkBuffer = res.buffer;
      if (res.contentType) {
        mimeType = res.contentType;
      }
    } catch (err) {
      console.warn('[id3Tagger] Could not fetch artwork image:', err.message);
    }
  }

  const frames = [];
  if (metadata.title) frames.push(makeTextFrame('TIT2', metadata.title));
  if (metadata.artist) frames.push(makeTextFrame('TPE1', metadata.artist));
  if (metadata.album) frames.push(makeTextFrame('TALB', metadata.album));
  if (metadata.year) frames.push(makeTextFrame('TYER', metadata.year));
  if (metadata.genre) frames.push(makeTextFrame('TCON', metadata.genre));

  if (artworkBuffer && artworkBuffer.length > 0) {
    frames.push(makePictureFrame(artworkBuffer, mimeType));
  }

  if (frames.length === 0) {
    return false;
  }

  const framesTotal = Buffer.concat(frames.filter(f => f.length > 0));
  const id3Header = Buffer.alloc(10);
  id3Header.write('ID3', 0, 3, 'ascii');
  id3Header[3] = 0x03;
  id3Header[4] = 0x00;
  id3Header[5] = 0x00;
  encodeSynchSafe(framesTotal.length).copy(id3Header, 6);

  const id3Tag = Buffer.concat([id3Header, framesTotal]);

  let audioData = fs.readFileSync(filePath);

  if (audioData.length >= 10 && audioData.slice(0, 3).toString('ascii') === 'ID3') {
    const s0 = audioData[6];
    const s1 = audioData[7];
    const s2 = audioData[8];
    const s3 = audioData[9];
    const oldTagSize = ((s0 & 0x7f) << 21) | ((s1 & 0x7f) << 14) | ((s2 & 0x7f) << 7) | (s3 & 0x7f);
    audioData = audioData.slice(10 + oldTagSize);
  }

  const taggedBuffer = Buffer.concat([id3Tag, audioData]);
  fs.writeFileSync(filePath, taggedBuffer);
  return true;
}

function extractId3Artwork(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const headerBuf = Buffer.alloc(10);
    fs.readSync(fd, headerBuf, 0, 10, 0);
    if (headerBuf.slice(0, 3).toString('ascii') !== 'ID3') {
      fs.closeSync(fd);
      return null;
    }
    const tagSize = ((headerBuf[6] & 0x7f) << 21) | ((headerBuf[7] & 0x7f) << 14) | ((headerBuf[8] & 0x7f) << 7) | (headerBuf[9] & 0x7f);
    const tagBuf = Buffer.alloc(Math.min(tagSize, 5 * 1024 * 1024));
    fs.readSync(fd, tagBuf, 0, tagBuf.length, 10);
    fs.closeSync(fd);

    let offset = 0;
    while (offset < tagBuf.length - 10) {
      const frameId = tagBuf.slice(offset, offset + 4).toString('ascii');
      const frameSize = tagBuf.readUInt32BE(offset + 4);
      if (frameSize <= 0 || frameSize > tagBuf.length - offset) break;
      
      if (frameId === 'APIC') {
        const apicData = tagBuf.slice(offset + 10, offset + 10 + frameSize);
        let nullIdx = 1;
        while (nullIdx < apicData.length && apicData[nullIdx] !== 0) nullIdx++;
        const mime = apicData.slice(1, nullIdx).toString('ascii') || 'image/jpeg';
        let descEnd = nullIdx + 2;
        while (descEnd < apicData.length && apicData[descEnd] !== 0) descEnd++;
        descEnd++;
        const imgBytes = apicData.slice(descEnd);
        return 'data:' + mime + ';base64,' + imgBytes.toString('base64');
      }
      offset += 10 + frameSize;
    }
  } catch (e) {
    return null;
  }
  return null;
}

module.exports = {
  embedId3Metadata,
  extractId3Artwork,
  fetchBuffer
};
