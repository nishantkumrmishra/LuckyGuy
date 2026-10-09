const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function fetchBuffer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return reject(new Error('Invalid URL for image download: ' + url));
    }

    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
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

// -------------------------------------------------------------
// ID3v2.3 MP3 Framing
// -------------------------------------------------------------
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

function embedId3Metadata(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist: ' + filePath);
  }

  const frames = [];
  if (metadata.title) frames.push(makeTextFrame('TIT2', metadata.title));
  if (metadata.artist) frames.push(makeTextFrame('TPE1', metadata.artist));
  if (metadata.album) frames.push(makeTextFrame('TALB', metadata.album));
  if (metadata.year) frames.push(makeTextFrame('TYER', metadata.year));
  if (metadata.genre) frames.push(makeTextFrame('TCON', metadata.genre));

  const artworkBuffer = metadata.artworkBuffer;
  const mimeType = metadata.mimeType || 'image/jpeg';
  if (artworkBuffer && artworkBuffer.length > 0) {
    frames.push(makePictureFrame(artworkBuffer, mimeType));
  }

  if (frames.length === 0) return false;

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

// -------------------------------------------------------------
// MP4 / M4A (AAC) Box & Atom Metadata Injector
// -------------------------------------------------------------
function makeIlstDataBox(type, dataBuf, dataTypeFlag = 1) {
  // dataTypeFlag: 1 = UTF-8 text, 13 = JPEG, 14 = PNG
  const dataBox = Buffer.alloc(16 + dataBuf.length);
  dataBox.writeUInt32BE(dataBox.length, 0);
  dataBox.write('data', 4, 4, 'ascii');
  dataBox.writeUInt32BE(dataTypeFlag, 8); // flags
  dataBox.writeUInt32BE(0, 12); // locale / reserved
  dataBuf.copy(dataBox, 16);

  const itemBox = Buffer.alloc(8 + dataBox.length);
  itemBox.writeUInt32BE(itemBox.length, 0);
  itemBox.write(type, 4, 4, 'latin1');
  dataBox.copy(itemBox, 8);
  return itemBox;
}

function buildUdtaBox(metadata = {}, artworkBuffer = null) {
  const items = [];
  if (metadata.title) items.push(makeIlstDataBox('\xa9nam', Buffer.from(String(metadata.title), 'utf8'), 1));
  if (metadata.artist) items.push(makeIlstDataBox('\xa9ART', Buffer.from(String(metadata.artist), 'utf8'), 1));
  if (metadata.album) items.push(makeIlstDataBox('\xa9alb', Buffer.from(String(metadata.album), 'utf8'), 1));
  if (metadata.year) items.push(makeIlstDataBox('\xa9day', Buffer.from(String(metadata.year), 'utf8'), 1));
  if (metadata.genre) items.push(makeIlstDataBox('\xa9gen', Buffer.from(String(metadata.genre), 'utf8'), 1));

  if (artworkBuffer && artworkBuffer.length > 0) {
    const isPng = artworkBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    items.push(makeIlstDataBox('covr', artworkBuffer, isPng ? 14 : 13));
  }

  const ilstPayload = Buffer.concat(items);
  const ilstBox = Buffer.alloc(8 + ilstPayload.length);
  ilstBox.writeUInt32BE(ilstBox.length, 0);
  ilstBox.write('ilst', 4, 4, 'ascii');
  ilstPayload.copy(ilstBox, 8);

  // hdlr box with quicktime mdir appl
  const hdlrBox = Buffer.from([
    0x00, 0x00, 0x00, 0x21,
    0x68, 0x64, 0x6c, 0x72, // 'hdlr'
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x6d, 0x64, 0x69, 0x72, // 'mdir'
    0x61, 0x70, 0x70, 0x6c, // 'appl'
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00
  ]);

  const metaPayload = Buffer.concat([hdlrBox, ilstBox]);
  const metaBox = Buffer.alloc(12 + metaPayload.length);
  metaBox.writeUInt32BE(metaBox.length, 0);
  metaBox.write('meta', 4, 4, 'ascii');
  metaBox.writeUInt32BE(0, 8); // version 0, flags 0
  metaPayload.copy(metaBox, 12);

  const udtaBox = Buffer.alloc(8 + metaBox.length);
  udtaBox.writeUInt32BE(udtaBox.length, 0);
  udtaBox.write('udta', 4, 4, 'ascii');
  metaBox.copy(udtaBox, 8);

  return udtaBox;
}

function embedM4aMetadata(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist: ' + filePath);
  }

  let audioData = fs.readFileSync(filePath);

  // If corrupted with an ID3 tag at offset 0, strip it first!
  if (audioData.length >= 10 && audioData.slice(0, 3).toString('ascii') === 'ID3') {
    const s0 = audioData[6];
    const s1 = audioData[7];
    const s2 = audioData[8];
    const s3 = audioData[9];
    const tagSize = ((s0 & 0x7f) << 21) | ((s1 & 0x7f) << 14) | ((s2 & 0x7f) << 7) | (s3 & 0x7f);
    audioData = audioData.slice(10 + tagSize);
  }

  // Scan root level boxes
  let offset = 0;
  let ftypBox = null;
  let moovBox = null;
  let mdatRest = null;

  while (offset < audioData.length - 8) {
    const size = audioData.readUInt32BE(offset);
    if (size <= 0) break;
    const type = audioData.slice(offset + 4, offset + 8).toString('ascii');
    if (type === 'ftyp') {
      ftypBox = audioData.slice(offset, offset + size);
    } else if (type === 'moov') {
      moovBox = audioData.slice(offset, offset + size);
      mdatRest = audioData.slice(offset + size);
      break;
    }
    offset += size;
  }

  if (!ftypBox || !moovBox || !mdatRest) {
    console.warn('[id3Tagger] Not a standard fast-start MP4 file, skipping atom injection');
    return false;
  }

  // Extract existing non-udta boxes inside moov
  const moovSubBoxes = [];
  let mOffset = 8;
  while (mOffset < moovBox.length - 8) {
    const bSize = moovBox.readUInt32BE(mOffset);
    if (bSize <= 0 || mOffset + bSize > moovBox.length) break;
    const bType = moovBox.slice(mOffset + 4, mOffset + 8).toString('ascii');
    if (bType !== 'udta' && bType !== 'free') {
      moovSubBoxes.push(moovBox.slice(mOffset, mOffset + bSize));
    }
    mOffset += bSize;
  }

  const udtaBox = buildUdtaBox(metadata, metadata.artworkBuffer);
  const newMoovPayload = Buffer.concat([...moovSubBoxes, udtaBox]);
  const newMoovBox = Buffer.alloc(8 + newMoovPayload.length);
  newMoovBox.writeUInt32BE(newMoovBox.length, 0);
  newMoovBox.write('moov', 4, 4, 'ascii');
  newMoovPayload.copy(newMoovBox, 8);

  const delta = newMoovBox.length - moovBox.length;

  // Adjust 32-bit stco chunk offsets
  let stcoIdx = newMoovBox.indexOf(Buffer.from('stco', 'ascii'));
  while (stcoIdx !== -1) {
    const entryCount = newMoovBox.readUInt32BE(stcoIdx + 8);
    for (let i = 0; i < entryCount; i++) {
      const curVal = newMoovBox.readUInt32BE(stcoIdx + 12 + i * 4);
      newMoovBox.writeUInt32BE(curVal + delta, stcoIdx + 12 + i * 4);
    }
    stcoIdx = newMoovBox.indexOf(Buffer.from('stco', 'ascii'), stcoIdx + 4);
  }

  // Adjust 64-bit co64 chunk offsets
  let co64Idx = newMoovBox.indexOf(Buffer.from('co64', 'ascii'));
  while (co64Idx !== -1) {
    const entryCount = newMoovBox.readUInt32BE(co64Idx + 8);
    for (let i = 0; i < entryCount; i++) {
      const curVal = newMoovBox.readBigUInt64BE(co64Idx + 12 + i * 8);
      newMoovBox.writeBigUInt64BE(curVal + BigInt(delta), co64Idx + 12 + i * 8);
    }
    co64Idx = newMoovBox.indexOf(Buffer.from('co64', 'ascii'), co64Idx + 4);
  }

  const finalBuffer = Buffer.concat([ftypBox, newMoovBox, mdatRest]);
  fs.writeFileSync(filePath, finalBuffer);
  return true;
}

// -------------------------------------------------------------
// Unified Metadata Embedding (Automatic MP3 vs M4A detection)
// -------------------------------------------------------------
async function embedId3MetadataUniversal(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) return false;

  let artworkBuffer = metadata.artworkBuffer || null;
  let mimeType = metadata.mimeType || 'image/jpeg';

  if (!artworkBuffer && metadata.artworkUrl) {
    try {
      const res = await fetchBuffer(metadata.artworkUrl);
      artworkBuffer = res.buffer;
      if (res.contentType) mimeType = res.contentType;
    } catch (err) {
      console.warn('[id3Tagger] Could not fetch artwork image:', err.message);
    }
  }

  const enrichedMeta = {
    ...metadata,
    artworkBuffer,
    mimeType
  };

  // Inspect file header
  const headBuf = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, headBuf, 0, 16, 0);
  fs.closeSync(fd);

  const isFtyp = headBuf.slice(4, 8).toString('ascii') === 'ftyp';
  const isId3 = headBuf.slice(0, 3).toString('ascii') === 'ID3';

  if (isFtyp) {
    return embedM4aMetadata(filePath, enrichedMeta);
  }

  if (isId3) {
    // Check if what follows ID3 is actually an MP4 ftyp container
    const fullBuf = fs.readFileSync(filePath);
    const s0 = fullBuf[6];
    const s1 = fullBuf[7];
    const s2 = fullBuf[8];
    const s3 = fullBuf[9];
    const tagSize = ((s0 & 0x7f) << 21) | ((s1 & 0x7f) << 14) | ((s2 & 0x7f) << 7) | (s3 & 0x7f);
    const audioPayload = fullBuf.slice(10 + tagSize);

    if (audioPayload.length >= 8 && audioPayload.slice(4, 8).toString('ascii') === 'ftyp') {
      return embedM4aMetadata(filePath, enrichedMeta);
    }
    return embedId3Metadata(filePath, enrichedMeta);
  }

  return embedId3Metadata(filePath, enrichedMeta);
}

// -------------------------------------------------------------
// Artwork Extraction (Supports both ID3 and M4A covr)
// -------------------------------------------------------------
function extractId3Artwork(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;

    const fd = fs.openSync(filePath, 'r');
    const headerBuf = Buffer.alloc(12);
    fs.readSync(fd, headerBuf, 0, 12, 0);
    fs.closeSync(fd);

    // 1. Check MP4 / M4A covr atom
    if (headerBuf.slice(4, 8).toString('ascii') === 'ftyp') {
      const buf = fs.readFileSync(filePath);
      const covrIdx = buf.indexOf(Buffer.from('covr', 'ascii'));
      if (covrIdx !== -1) {
        const dataIdx = buf.indexOf(Buffer.from('data', 'ascii'), covrIdx);
        if (dataIdx !== -1 && dataIdx < covrIdx + 32) {
          const typeFlag = buf.readUInt32BE(dataIdx + 4);
          const mime = (typeFlag === 14) ? 'image/png' : 'image/jpeg';
          const boxSize = buf.readUInt32BE(dataIdx - 4);
          if (boxSize > 16 && dataIdx - 4 + boxSize <= buf.length) {
            const imgBytes = buf.slice(dataIdx + 12, dataIdx - 4 + boxSize);
            return 'data:' + mime + ';base64,' + imgBytes.toString('base64');
          }
        }
      }
      return null;
    }

    // 2. Check ID3 tag
    if (headerBuf.slice(0, 3).toString('ascii') === 'ID3') {
      const fd2 = fs.openSync(filePath, 'r');
      const majorVer = headerBuf[3];
      const tagSize = ((headerBuf[6] & 0x7f) << 21) | ((headerBuf[7] & 0x7f) << 14) | ((headerBuf[8] & 0x7f) << 7) | (headerBuf[9] & 0x7f);
      const tagBuf = Buffer.alloc(Math.min(tagSize, 8 * 1024 * 1024));
      fs.readSync(fd2, tagBuf, 0, tagBuf.length, 10);
      fs.closeSync(fd2);

      let offset = 0;
      while (offset < tagBuf.length - 10) {
        const frameId = tagBuf.slice(offset, offset + 4).toString('ascii');
        let frameSize = 0;
        if (majorVer === 4) {
          frameSize = ((tagBuf[offset + 4] & 0x7f) << 21) | ((tagBuf[offset + 5] & 0x7f) << 14) | ((tagBuf[offset + 6] & 0x7f) << 7) | (tagBuf[offset + 7] & 0x7f);
        } else {
          frameSize = tagBuf.readUInt32BE(offset + 4);
        }
        if (frameSize <= 0 || frameSize > tagBuf.length - offset) break;
        
        if (frameId === 'APIC') {
          const apicData = tagBuf.slice(offset + 10, offset + 10 + frameSize);
          const encoding = apicData[0];
          let nullIdx = 1;
          while (nullIdx < apicData.length && apicData[nullIdx] !== 0) nullIdx++;
          const mime = apicData.slice(1, nullIdx).toString('ascii') || 'image/jpeg';
          let descEnd = nullIdx + 1;
          if (descEnd < apicData.length) descEnd++;
          if (encoding === 1 || encoding === 2) {
            while (descEnd < apicData.length - 1 && !(apicData[descEnd] === 0 && apicData[descEnd + 1] === 0)) {
              descEnd += 2;
            }
            descEnd += 2;
          } else {
            while (descEnd < apicData.length && apicData[descEnd] !== 0) {
              descEnd++;
            }
            descEnd++;
          }
          if (descEnd < apicData.length) {
            const imgBytes = apicData.slice(descEnd);
            return 'data:' + mime + ';base64,' + imgBytes.toString('base64');
          }
        }
        offset += 10 + frameSize;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// -------------------------------------------------------------
// Library Repair Utility: Fixes all corrupted files in a directory
// -------------------------------------------------------------
function repairCorruptedMusicDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const repaired = [];

  const scanDir = (target) => {
    try {
      const items = fs.readdirSync(target, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(target, item.name);
        if (item.isDirectory() && !item.name.startsWith('.')) {
          scanDir(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (ext === '.mp3' || ext === '.m4a') {
            try {
              const buf = fs.readFileSync(fullPath);
              if (buf.length >= 10 && buf.slice(0, 3).toString('ascii') === 'ID3') {
                const s0 = buf[6];
                const s1 = buf[7];
                const s2 = buf[8];
                const s3 = buf[9];
                const tagSize = ((s0 & 0x7f) << 21) | ((s1 & 0x7f) << 14) | ((s2 & 0x7f) << 7) | (s3 & 0x7f);
                const after = buf.slice(10 + tagSize);

                if (after.length >= 8 && after.slice(4, 8).toString('ascii') === 'ftyp') {
                  // This is an M4A/AAC file damaged by prepended ID3 tags!
                  // Extract existing tags
                  let title = '', artist = '', album = '', year = '', genre = '';
                  let artworkBuffer = null;
                  const tagBuf = buf.slice(10, 10 + tagSize);

                  let offset = 0;
                  while (offset < tagBuf.length - 10) {
                    const frameId = tagBuf.slice(offset, offset + 4).toString('ascii');
                    const frameSize = tagBuf.readUInt32BE(offset + 4);
                    if (frameSize <= 0 || frameSize > tagBuf.length - offset) break;

                    const frameData = tagBuf.slice(offset + 10, offset + 10 + frameSize);
                    if (frameId === 'TIT2') title = frameData.slice(1).toString('utf8').replace(/\0/g, '');
                    else if (frameId === 'TPE1') artist = frameData.slice(1).toString('utf8').replace(/\0/g, '');
                    else if (frameId === 'TALB') album = frameData.slice(1).toString('utf8').replace(/\0/g, '');
                    else if (frameId === 'TYER') year = frameData.slice(1).toString('utf8').replace(/\0/g, '');
                    else if (frameId === 'TCON') genre = frameData.slice(1).toString('utf8').replace(/\0/g, '');
                    else if (frameId === 'APIC') {
                      let nullIdx = 1;
                      while (nullIdx < frameData.length && frameData[nullIdx] !== 0) nullIdx++;
                      let descEnd = nullIdx + 1;
                      if (descEnd < frameData.length) descEnd++;
                      while (descEnd < frameData.length && frameData[descEnd] !== 0) descEnd++;
                      descEnd++;
                      if (descEnd < frameData.length) artworkBuffer = frameData.slice(descEnd);
                    }
                    offset += 10 + frameSize;
                  }

                  // Determine new M4A file path
                  const baseNoExt = path.basename(fullPath, ext);
                  const m4aPath = path.join(path.dirname(fullPath), `${baseNoExt}.m4a`);

                  // Write clean audio payload temporarily
                  fs.writeFileSync(m4aPath, after);

                  // Embed proper M4A metadata atoms
                  embedM4aMetadata(m4aPath, {
                    title: title || baseNoExt,
                    artist: artist || 'Various Artists',
                    album: album || 'Music',
                    year,
                    genre,
                    artworkBuffer
                  });

                  // If original was .mp3, remove it safely
                  if (fullPath !== m4aPath && fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) {}
                  }

                  repaired.push({ oldPath: fullPath, newPath: m4aPath });
                }
              }
            } catch (err) {
              console.warn('[id3Tagger] Error repairing file:', fullPath, err.message);
            }
          }
        }
      }
    } catch (e) {}
  };

  scanDir(dirPath);
  return repaired;
}

module.exports = {
  embedId3Metadata: embedId3MetadataUniversal,
  embedM4aMetadata,
  extractId3Artwork,
  repairCorruptedMusicDirectory,
  fetchBuffer
};
