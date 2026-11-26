/**
 * Pure Client-Side LSB Steganography & Forensic Visualization Engine.
 * ISO/IEC 27701 Privacy-by-Design: All computations run 100% locally in browser memory.
 * No image or message data ever leaves the user's device.
 */

const MAGIC = [0x53, 0x54, 0x47, 0x31]; // "STG1"

export type LsbBits = 1 | 2;

export interface EmbedResult {
  stegoImageData: ImageData;
  psnr: number;
  mse: number;
  usedBytes: number;
  capacityBytes: number;
  modifiedPixels: number;
}

export interface ExtractResult {
  ok: boolean;
  text?: string;
  bitsUsed?: LsbBits;
  byteLength?: number;
  error?: string;
}

export function getCapacityBytes(width: number, height: number, bits: LsbBits): number {
  // 3 RGB channels per pixel (alpha untouched to avoid premultiplied alpha distortion)
  const totalBits = width * height * 3 * bits;
  const headerBytes = 9; // 4 magic + 1 bits + 4 length
  return Math.max(0, Math.floor(totalBits / 8) - headerBytes);
}

export function embedLsb(cover: ImageData, message: string, bits: LsbBits): EmbedResult {
  const encoder = new TextEncoder();
  const payload = encoder.encode(message);
  const capacityBytes = getCapacityBytes(cover.width, cover.height, bits);

  if (payload.length > capacityBytes) {
    throw new Error(`Payload too large (${payload.length} B > ${capacityBytes} B capacity).`);
  }

  // Build packet: [MAGIC(4)] [bits(1)] [length(4, big-endian)] [payload(...)]
  const packet = new Uint8Array(9 + payload.length);
  packet.set(MAGIC, 0);
  packet[4] = bits;
  const view = new DataView(packet.buffer);
  view.setUint32(5, payload.length, false);
  packet.set(payload, 9);

  const outData = new Uint8ClampedArray(cover.data);
  const mask = bits === 1 ? 0xfe : 0xfc;

  let bitIndex = 0;
  const totalBits = packet.length * 8;
  let modifiedPixels = 0;
  let sumSqErr = 0;

  for (let i = 0; i < outData.length && bitIndex < totalBits; i += 4) {
    let pixelChanged = false;
    for (let c = 0; c < 3 && bitIndex < totalBits; c++) {
      let chunk = 0;
      for (let b = 0; b < bits; b++) {
        const bytePos = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8);
        const bitVal = bytePos < packet.length ? (packet[bytePos] >> bitOffset) & 1 : 0;
        chunk = (chunk << 1) | bitVal;
        bitIndex += 1;
      }
      const orig = cover.data[i + c];
      const next = (orig & mask) | chunk;
      outData[i + c] = next;
      if (next !== orig) {
        pixelChanged = true;
        const diff = next - orig;
        sumSqErr += diff * diff;
      }
    }
    // Force opaque alpha so browsers never premultiply & corrupt RGB values
    outData[i + 3] = 255;
    if (pixelChanged) modifiedPixels += 1;
  }

  const totalChannels = cover.width * cover.height * 3;
  const mse = totalChannels > 0 ? sumSqErr / totalChannels : 0;
  const psnr = mse === 0 ? 99.99 : 10 * Math.log10((255 * 255) / mse);

  return {
    stegoImageData: new ImageData(outData, cover.width, cover.height),
    psnr,
    mse,
    usedBytes: payload.length,
    capacityBytes,
    modifiedPixels,
  };
}

function tryExtractWithBits(imageData: ImageData, bits: LsbBits): ExtractResult {
  const data = imageData.data;
  const totalPixels = imageData.width * imageData.height;
  const maxBytes = Math.floor((totalPixels * 3 * bits) / 8);
  if (maxBytes < 9) {
    return { ok: false, error: 'Image too small to contain payload.' };
  }

  const bitMask = bits === 1 ? 0x01 : 0x03;

  // Helper to read `numBytes` starting at bit offset `startBit`
  const readBytes = (startByte: number, count: number): Uint8Array => {
    const out = new Uint8Array(count);
    let bitCursor = startByte * 8;
    const endBit = (startByte + count) * 8;

    let channelIdx = Math.floor(bitCursor / bits);
    while (bitCursor < endBit) {
      const pixelIdx = Math.floor(channelIdx / 3);
      const ch = channelIdx % 3;
      const val = data[pixelIdx * 4 + ch] & bitMask;

      for (let b = bits - 1; b >= 0 && bitCursor < endBit; b--) {
        const bit = (val >> b) & 1;
        const relBit = bitCursor - startByte * 8;
        const byteIdx = Math.floor(relBit / 8);
        out[byteIdx] = (out[byteIdx] << 1) | bit;
        bitCursor += 1;
      }
      channelIdx += 1;
    }
    return out;
  };

  const header = readBytes(0, 9);
  for (let i = 0; i < 4; i++) {
    if (header[i] !== MAGIC[i]) {
      return { ok: false, error: 'No valid STG1 header found.' };
    }
  }

  const headerBits = header[4];
  if (headerBits !== bits) {
    return { ok: false, error: 'Bit-depth mismatch.' };
  }

  const view = new DataView(header.buffer);
  const payloadLen = view.getUint32(5, false);
  if (payloadLen > maxBytes - 9) {
    return { ok: false, error: 'Corrupted payload length.' };
  }

  const payload = readBytes(9, payloadLen);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return {
    ok: true,
    text: decoder.decode(payload),
    bitsUsed: bits,
    byteLength: payloadLen,
  };
}

export function extractLsb(imageData: ImageData, preferredBits?: LsbBits): ExtractResult {
  const order: LsbBits[] = preferredBits ? [preferredBits, preferredBits === 1 ? 2 : 1] : [1, 2];
  for (const b of order) {
    const res = tryExtractWithBits(imageData, b);
    if (res.ok) return res;
  }
  return {
    ok: false,
    error: 'No hidden LSB payload detected (ensure the image is an unmodified lossless PNG).',
  };
}

/**
 * Forensic Bit-Plane Visualization:
 * Extracts the lowest 1 or 2 bits of each RGB channel and stretches them to [0, 255].
 */
export function buildBitPlaneImageData(imageData: ImageData, bits: LsbBits): ImageData {
  const out = new Uint8ClampedArray(imageData.data.length);
  const mask = bits === 1 ? 0x01 : 0x03;
  const scale = bits === 1 ? 255 : 85;

  for (let i = 0; i < imageData.data.length; i += 4) {
    out[i] = (imageData.data[i] & mask) * scale;
    out[i + 1] = (imageData.data[i + 1] & mask) * scale;
    out[i + 2] = (imageData.data[i + 2] & mask) * scale;
    out[i + 3] = 255;
  }
  return new ImageData(out, imageData.width, imageData.height);
}

/**
 * Forensic Difference Localization Map:
 * Highlights any pixel modified by LSB embedding in vivid rose/cyan against a darkened cover.
 */
export function buildDiffImageData(cover: ImageData, stego: ImageData): ImageData {
  const out = new Uint8ClampedArray(cover.data.length);
  for (let i = 0; i < cover.data.length; i += 4) {
    const dr = Math.abs(stego.data[i] - cover.data[i]);
    const dg = Math.abs(stego.data[i + 1] - cover.data[i + 1]);
    const db = Math.abs(stego.data[i + 2] - cover.data[i + 2]);
    if (dr + dg + db > 0) {
      out[i] = 244; // rose-500 highlight
      out[i + 1] = 63;
      out[i + 2] = 94;
      out[i + 3] = 255;
    } else {
      out[i] = Math.floor(cover.data[i] * 0.22);
      out[i + 1] = Math.floor(cover.data[i + 1] * 0.22);
      out[i + 2] = Math.floor(cover.data[i + 2] * 0.22);
      out[i + 3] = 255;
    }
  }
  return new ImageData(out, cover.width, cover.height);
}

/**
 * Generates a built-in synthetic sample cover image (320x220) so visitors can
 * test LSB embedding immediately without uploading a file.
 */
export function createSampleCoverImageData(width = 320, height = 220): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Rich gradient backdrop (mimics smooth medical / natural grayscale + academic blue tones)
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e3a8a');
  grad.addColorStop(1, '#0d9488');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle concentric rings & geometric phantom
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  for (let r = 24; r <= 120; r += 24) {
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Smooth inner phantom ellipse
  const rad = ctx.createRadialGradient(width * 0.48, height * 0.45, 8, width * 0.5, height * 0.5, 78);
  rad.addColorStop(0, 'rgba(248, 250, 252, 0.92)');
  rad.addColorStop(0.65, 'rgba(148, 163, 184, 0.35)');
  rad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.5, 78, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 12px monospace';
  ctx.fillText('SAMPLE COVER · 320×220 PNG', 14, height - 14);

  return ctx.getImageData(0, 0, width, height);
}

export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function loadFileToImageData(file: File, maxDim = 960): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      // Preserve exact pixels for PNG extraction unless gigantic
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image file.'));
    };
    img.src = url;
  });
}
