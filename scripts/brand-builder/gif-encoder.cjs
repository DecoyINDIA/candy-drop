'use strict';

/**
 * Pure JavaScript GIF89a encoder without external dependencies.
 * Supports:
 * - Multi-frame animations
 * - Custom palettes (up to 256 colors)
 * - Transparency
 * - Netscape 2.0 looping
 * - Standard LZW compression with sub-blocking
 */

class GifWriter {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.loopCount = options.loopCount !== undefined ? options.loopCount : 0; // 0 = loop forever
    this.palette = options.palette || null; // Array of [r,g,b] or null
    this.buffers = [];
    this._writeHeader();
  }

  _writeHeader() {
    // GIF89a
    const header = Buffer.from('GIF89a', 'ascii');
    this.buffers.push(header);

    // Logical Screen Descriptor
    const lsd = Buffer.alloc(7);
    lsd.writeUInt16LE(this.width, 0);
    lsd.writeUInt16LE(this.height, 2);

    let packed = 0x70; // 8 bits/pixel resolution
    if (this.palette && this.palette.length > 0) {
      packed |= 0x80; // Global Color Table Flag
      const palSizePower = Math.max(1, Math.ceil(Math.log2(this.palette.length))) - 1;
      packed |= (palSizePower & 0x07);
    }
    lsd.writeUInt8(packed, 4);
    lsd.writeUInt8(0, 5); // Background Color Index
    lsd.writeUInt8(0, 6); // Pixel Aspect Ratio
    this.buffers.push(lsd);

    // Global Color Table
    if (this.palette && this.palette.length > 0) {
      const palSize = 1 << (Math.max(1, Math.ceil(Math.log2(this.palette.length))));
      const palBuf = Buffer.alloc(palSize * 3, 0);
      for (let i = 0; i < this.palette.length; i++) {
        palBuf[i * 3] = this.palette[i][0];
        palBuf[i * 3 + 1] = this.palette[i][1];
        palBuf[i * 3 + 2] = this.palette[i][2];
      }
      this.buffers.push(palBuf);
    }

    // Netscape 2.0 Application Extension for looping
    if (this.loopCount >= 0) {
      const appExt = Buffer.from([
        0x21, 0xFF, 0x0B,
        0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, // 'NETSCAPE'
        0x32, 0x2E, 0x30,                         // '2.0'
        0x03, 0x01,
        this.loopCount & 0xFF, (this.loopCount >> 8) & 0xFF,
        0x00
      ]);
      this.buffers.push(appExt);
    }
  }

  addFrame(pixelIndices, options = {}) {
    const delay = options.delay !== undefined ? options.delay : 10; // in 1/100 sec (e.g. 10 = 100ms)
    const transparent = options.transparent !== undefined ? options.transparent : -1;
    const disposal = options.disposal !== undefined ? options.disposal : 2; // 2 = restore to background
    const localPalette = options.palette || null;

    // Graphics Control Extension
    const gce = Buffer.alloc(8);
    gce[0] = 0x21; // Extension Introducer
    gce[1] = 0xF9; // Graphic Control Label
    gce[2] = 0x04; // Block Size
    let gcePacked = (disposal & 0x07) << 2;
    if (transparent >= 0) {
      gcePacked |= 0x01;
    }
    gce[3] = gcePacked;
    gce.writeUInt16LE(delay, 4);
    gce[6] = transparent >= 0 ? transparent : 0;
    gce[7] = 0x00; // Block Terminator
    this.buffers.push(gce);

    // Image Descriptor
    const id = Buffer.alloc(10);
    id[0] = 0x2C; // Image Separator
    id.writeUInt16LE(0, 1); // Left
    id.writeUInt16LE(0, 3); // Top
    id.writeUInt16LE(this.width, 5);
    id.writeUInt16LE(this.height, 7);

    let idPacked = 0;
    if (localPalette && localPalette.length > 0) {
      idPacked |= 0x80;
      const palSizePower = Math.max(1, Math.ceil(Math.log2(localPalette.length))) - 1;
      idPacked |= (palSizePower & 0x07);
    }
    id[9] = idPacked;
    this.buffers.push(id);

    // Local Color Table if present
    if (localPalette && localPalette.length > 0) {
      const palSize = 1 << (Math.max(1, Math.ceil(Math.log2(localPalette.length))));
      const palBuf = Buffer.alloc(palSize * 3, 0);
      for (let i = 0; i < localPalette.length; i++) {
        palBuf[i * 3] = localPalette[i][0];
        palBuf[i * 3 + 1] = localPalette[i][1];
        palBuf[i * 3 + 2] = localPalette[i][2];
      }
      this.buffers.push(palBuf);
    }

    // Determine min code size
    const paletteLen = (localPalette || this.palette || []).length;
    let minCodeSize = Math.max(2, Math.ceil(Math.log2(paletteLen || 4)));
    if (minCodeSize < 2) minCodeSize = 2;

    this.buffers.push(Buffer.from([minCodeSize]));

    // Compress pixel data using LZW
    const compressed = this._lzwCompress(minCodeSize, pixelIndices);
    this.buffers.push(compressed);
  }

  _lzwCompress(minCodeSize, pixels) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;

    // Bit packing helper
    const outBytes = [];
    let curByte = 0;
    let curBits = 0;

    function writeCode(c) {
      curByte |= (c << curBits);
      curBits += codeSize;
      while (curBits >= 8) {
        outBytes.push(curByte & 0xFF);
        curByte >>= 8;
        curBits -= 8;
      }
    }

    // Start with Clear Code
    writeCode(clearCode);

    // Simple dictionary using Map: string key -> code
    let dict = new Map();
    let prefix = -1;

    for (let i = 0; i < pixels.length; i++) {
      const k = pixels[i];
      if (prefix === -1) {
        prefix = k;
      } else {
        const key = (prefix << 8) | k;
        if (dict.has(key)) {
          prefix = dict.get(key);
        } else {
          writeCode(prefix);

          if (nextCode < 4096) {
            dict.set(key, nextCode++);
            if (nextCode > (1 << codeSize) && codeSize < 12) {
              codeSize++;
            }
          } else {
            // Dictionary full: emit clear code and reset
            writeCode(clearCode);
            dict.clear();
            codeSize = minCodeSize + 1;
            nextCode = eoiCode + 1;
          }

          prefix = k;
        }
      }
    }

    if (prefix !== -1) {
      writeCode(prefix);
    }

    // End of Information code
    writeCode(eoiCode);

    // Flush remaining bits
    if (curBits > 0) {
      outBytes.push(curByte & 0xFF);
    }

    // Package into sub-blocks (max 255 bytes each)
    const blocks = [];
    let offset = 0;
    while (offset < outBytes.length) {
      const len = Math.min(255, outBytes.length - offset);
      blocks.push(Buffer.from([len]));
      blocks.push(Buffer.from(outBytes.slice(offset, offset + len)));
      offset += len;
    }
    // Block terminator
    blocks.push(Buffer.from([0x00]));

    return Buffer.concat(blocks);
  }

  finish() {
    // Trailer: 0x3B (;)
    this.buffers.push(Buffer.from([0x3B]));
    return Buffer.concat(this.buffers);
  }
}

module.exports = { GifWriter };
