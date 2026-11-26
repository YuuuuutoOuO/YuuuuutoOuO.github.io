/**
 * Pure Client-Side Image Compression (AMBTC) & Encryption (AES-CTR) Engine
 * with Quantitative Quality & Security Metrics (PSNR, MSE, Shannon Entropy, NPCR, UACI).
 * ISO/IEC 27701 Privacy-by-Design: 100% local in-browser computation.
 */

export type AmbtcBlockSize = 4 | 8;
export type AmbtcColorMode = 'rgb' | 'gray';

export interface ImageCompareMetrics {
  mse: number;
  psnr: number;
  npcr: number; // Percentage (0-100)
  uaci: number; // Percentage (0-100)
}

export interface AmbtcResult {
  reconstructed: ImageData;
  bitmapImageData: ImageData;
  errorMapImageData: ImageData;
  originalProcessed: ImageData; // Grayscale if gray mode, else original
  psnr: number;
  mse: number;
  originalEntropy: number;
  reconstructedEntropy: number;
  bpp: number;
  compressionRatio: number;
  blockCount: number;
}

export interface AesImageResult {
  outputImageData: ImageData;
  psnr: number;
  mse: number;
  inputEntropy: number;
  outputEntropy: number;
  npcr: number;
  uaci: number;
  keyFingerprint: string;
}

/**
 * Computes average RGB channel Shannon Entropy (bits/pixel, theoretical max = 8.0).
 * For grayscale images (R=G=B), this equals the exact single-channel entropy.
 */
export function computeEntropy(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  if (totalPixels === 0) return 0;

  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);

  for (let i = 0; i < data.length; i += 4) {
    histR[data[i]] += 1;
    histG[data[i + 1]] += 1;
    histB[data[i + 2]] += 1;
  }

  const calcChannel = (hist: Uint32Array): number => {
    let h = 0;
    for (let v = 0; v < 256; v++) {
      const count = hist[v];
      if (count > 0) {
        const p = count / totalPixels;
        h -= p * Math.log2(p);
      }
    }
    return h;
  };

  return (calcChannel(histR) + calcChannel(histG) + calcChannel(histB)) / 3;
}

/**
 * Computes MSE, PSNR (dB), NPCR (%), and UACI (%) between two same-size images.
 */
export function computeCompareMetrics(a: ImageData, b: ImageData): ImageCompareMetrics {
  const len = Math.min(a.data.length, b.data.length);
  const totalPixels = Math.floor(len / 4);
  if (totalPixels === 0) {
    return { mse: 0, psnr: 99.99, npcr: 0, uaci: 0 };
  }

  let sumSq = 0;
  let sumAbs = 0;
  let changedPixels = 0;

  for (let i = 0; i < len; i += 4) {
    const dr = Math.abs(a.data[i] - b.data[i]);
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const db = Math.abs(a.data[i + 2] - b.data[i + 2]);

    sumSq += dr * dr + dg * dg + db * db;
    sumAbs += dr + dg + db;
    if (dr > 0 || dg > 0 || db > 0) {
      changedPixels += 1;
    }
  }

  const totalChannels = totalPixels * 3;
  const mse = sumSq / totalChannels;
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  const npcr = (changedPixels / totalPixels) * 100;
  const uaci = (sumAbs / (totalChannels * 255)) * 100;

  return { mse, psnr, npcr, uaci };
}

/**
 * Computes a 64-bin luminance/intensity histogram normalized to [0, 1] for compact visualization.
 */
export function computeCompactHistogram(imageData: ImageData, bins = 64): number[] {
  const counts = new Float64Array(bins);
  const { data } = imageData;
  const binScale = bins / 256;

  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const idx = Math.min(bins - 1, Math.floor(luma * binScale));
    counts[idx] += 1;
  }

  let maxVal = 1;
  for (let i = 0; i < bins; i++) {
    if (counts[i] > maxVal) maxVal = counts[i];
  }
  return Array.from(counts, (c) => c / maxVal);
}

/**
 * Absolute Moment Block Truncation Coding (AMBTC) — Lema & Mitchell (1984).
 * Partitions image into n×n blocks, computes block mean, binary bitmap,
 * and low/high quantization levels (L, H) preserving the first absolute moment.
 */
export function compressAmbtc(
  source: ImageData,
  blockSize: AmbtcBlockSize = 4,
  mode: AmbtcColorMode = 'rgb',
): AmbtcResult {
  const { width, height } = source;
  const origArr = new Uint8ClampedArray(source.data.length);
  const recArr = new Uint8ClampedArray(source.data.length);
  const bmpArr = new Uint8ClampedArray(source.data.length);
  const errArr = new Uint8ClampedArray(source.data.length);

  // Prepare source (grayscale conversion if requested)
  for (let i = 0; i < source.data.length; i += 4) {
    if (mode === 'gray') {
      const y = Math.round(
        0.299 * source.data[i] + 0.587 * source.data[i + 1] + 0.114 * source.data[i + 2],
      );
      origArr[i] = y;
      origArr[i + 1] = y;
      origArr[i + 2] = y;
      origArr[i + 3] = 255;
    } else {
      origArr[i] = source.data[i];
      origArr[i + 1] = source.data[i + 1];
      origArr[i + 2] = source.data[i + 2];
      origArr[i + 3] = 255;
    }
  }

  const channels = mode === 'gray' ? 1 : 3;
  let blockCount = 0;

  for (let by = 0; by < height; by += blockSize) {
    const bh = Math.min(blockSize, height - by);
    for (let bx = 0; bx < width; bx += blockSize) {
      const bw = Math.min(blockSize, width - bx);
      const m = bw * bh;
      blockCount += 1;

      for (let c = 0; c < channels; c++) {
        // 1. Block mean
        let sum = 0;
        for (let dy = 0; dy < bh; dy++) {
          const rowOffset = (by + dy) * width;
          for (let dx = 0; dx < bw; dx++) {
            const idx = (rowOffset + bx + dx) * 4 + c;
            sum += origArr[idx];
          }
        }
        const mean = sum / m;

        // 2. Partition into high (>= mean) and low (< mean)
        let sumHigh = 0;
        let sumLow = 0;
        let q = 0;
        for (let dy = 0; dy < bh; dy++) {
          const rowOffset = (by + dy) * width;
          for (let dx = 0; dx < bw; dx++) {
            const val = origArr[(rowOffset + bx + dx) * 4 + c];
            if (val >= mean) {
              sumHigh += val;
              q += 1;
            } else {
              sumLow += val;
            }
          }
        }

        const highLevel = q > 0 ? Math.round(sumHigh / q) : Math.round(mean);
        const lowLevel = m - q > 0 ? Math.round(sumLow / (m - q)) : Math.round(mean);

        // 3. Reconstruct block, bitmap, and amplified error map
        for (let dy = 0; dy < bh; dy++) {
          const rowOffset = (by + dy) * width;
          for (let dx = 0; dx < bw; dx++) {
            const pxBase = (rowOffset + bx + dx) * 4;
            const origVal = origArr[pxBase + c];
            const isHigh = origVal >= mean;
            const recVal = isHigh ? highLevel : lowLevel;
            const bmpVal = isHigh ? 255 : 0;
            const errVal = Math.min(255, Math.abs(origVal - recVal) * 6);

            if (mode === 'gray') {
              recArr[pxBase] = recVal;
              recArr[pxBase + 1] = recVal;
              recArr[pxBase + 2] = recVal;
              recArr[pxBase + 3] = 255;

              bmpArr[pxBase] = bmpVal;
              bmpArr[pxBase + 1] = bmpVal;
              bmpArr[pxBase + 2] = bmpVal;
              bmpArr[pxBase + 3] = 255;

              errArr[pxBase] = errVal;
              errArr[pxBase + 1] = Math.round(errVal * 0.35);
              errArr[pxBase + 2] = Math.round(errVal * 0.55);
              errArr[pxBase + 3] = 255;
            } else {
              recArr[pxBase + c] = recVal;
              recArr[pxBase + 3] = 255;

              bmpArr[pxBase + c] = bmpVal;
              bmpArr[pxBase + 3] = 255;

              errArr[pxBase + c] = errVal;
              errArr[pxBase + 3] = 255;
            }
          }
        }
      }
    }
  }

  const originalProcessed = new ImageData(origArr, width, height);
  const reconstructed = new ImageData(recArr, width, height);
  const bitmapImageData = new ImageData(bmpArr, width, height);
  const errorMapImageData = new ImageData(errArr, width, height);

  const metrics = computeCompareMetrics(originalProcessed, reconstructed);
  const originalEntropy = computeEntropy(originalProcessed);
  const reconstructedEntropy = computeEntropy(reconstructed);

  // Per-channel AMBTC bitrate: (8-bit L + 8-bit H + n^2 bitmap bits) / n^2
  const bppPerChannel = (16 + blockSize * blockSize) / (blockSize * blockSize);
  const bpp = mode === 'gray' ? bppPerChannel : bppPerChannel * 3;
  const compressionRatio = 8 / bppPerChannel;

  return {
    reconstructed,
    bitmapImageData,
    errorMapImageData,
    originalProcessed,
    psnr: metrics.psnr,
    mse: metrics.mse,
    originalEntropy,
    reconstructedEntropy,
    bpp,
    compressionRatio,
    blockCount,
  };
}

/**
 * Pure Web Crypto AES-256-CTR pixel-stream encryption / decryption.
 * Because AES-CTR is symmetric XOR with keystream, running with the same key
 * decrypts an encrypted PNG losslessly back to the exact original pixels (PSNR = ∞).
 */
export async function aesCtrTransformImage(
  source: ImageData,
  keyPassphrase: string,
): Promise<AesImageResult> {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable in this browser context.');
  }

  const trimmedKey = keyPassphrase.trim();
  if (!trimmedKey) {
    throw new Error('AES key cannot be empty.');
  }

  const encoder = new TextEncoder();
  const keyHashBuf = await window.crypto.subtle.digest('SHA-256', encoder.encode(trimmedKey));
  const counterHashBuf = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`CHUOS-AES-CTR-IV::${trimmedKey}`),
  );

  const keyBytes = new Uint8Array(keyHashBuf);
  const counter = new Uint8Array(counterHashBuf).slice(0, 16);

  const keyFingerprint = Array.from(keyBytes.slice(0, 6))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CTR' },
    false,
    ['encrypt'],
  );

  const totalPixels = source.width * source.height;
  const rgbPlain = new Uint8Array(totalPixels * 3);
  for (let p = 0; p < totalPixels; p++) {
    rgbPlain[p * 3] = source.data[p * 4];
    rgbPlain[p * 3 + 1] = source.data[p * 4 + 1];
    rgbPlain[p * 3 + 2] = source.data[p * 4 + 2];
  }

  const transformedBuf = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CTR',
      counter,
      length: 64,
    },
    cryptoKey,
    rgbPlain,
  );

  const transformedBytes = new Uint8Array(transformedBuf);
  const outRgba = new Uint8ClampedArray(totalPixels * 4);
  for (let p = 0; p < totalPixels; p++) {
    outRgba[p * 4] = transformedBytes[p * 3];
    outRgba[p * 4 + 1] = transformedBytes[p * 3 + 1];
    outRgba[p * 4 + 2] = transformedBytes[p * 3 + 2];
    outRgba[p * 4 + 3] = 255; // Opaque alpha prevents canvas premultiplication loss
  }

  const outputImageData = new ImageData(outRgba, source.width, source.height);
  const metrics = computeCompareMetrics(source, outputImageData);
  const inputEntropy = computeEntropy(source);
  const outputEntropy = computeEntropy(outputImageData);

  return {
    outputImageData,
    psnr: metrics.psnr,
    mse: metrics.mse,
    inputEntropy,
    outputEntropy,
    npcr: metrics.npcr,
    uaci: metrics.uaci,
    keyFingerprint,
  };
}
