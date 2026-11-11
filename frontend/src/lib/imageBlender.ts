'use client';

import React, { useState, useEffect } from 'react';

export type ImageBlendMode = 'cutout' | 'scenic' | 'softbox';

interface ProcessedImageResult {
  url: string;
  mode: ImageBlendMode;
  hasLightBg: boolean;
}

const processedImageCache = new Map<string, ProcessedImageResult>();

/**
 * Returns CSS properties for smart blending when CSS fallback (softbox) or scenic vignette is used.
 * Note: In CSS radial-gradient(ellipse RX% RY% at 50% 50%, ...), RX and RY are radii (50% reaches the box edges).
 */
export function getProductBlendStyles(
  removeWhiteBg?: boolean,
  blendMode: ImageBlendMode = 'cutout'
): React.CSSProperties | undefined {
  if (blendMode === 'cutout') {
    return undefined;
  }
  if (blendMode === 'scenic') {
    return getScenicFeatherStyles();
  }
  const softboxMask =
    'radial-gradient(ellipse 48% 46% at 50% 50%, #000 38%, rgba(0, 0, 0, 0.82) 62%, rgba(0, 0, 0, 0.25) 84%, transparent 98%)';
  return {
    WebkitMaskImage: softboxMask,
    maskImage: softboxMask,
  };
}

/**
 * Smooth 4-sided elliptical vignette mask for scenic/lifestyle photos
 * so rectangular product photos dissolve seamlessly into the dark hero banner without 90° corners.
 * Uses 50% radii so the 100% gradient boundary aligns with the element edges rather than overflowing the box.
 */
export function getScenicFeatherStyles(): React.CSSProperties {
  const scenicMask =
    'radial-gradient(ellipse 50% 48% at 50% 50%, #000 42%, rgba(0, 0, 0, 0.86) 64%, rgba(0, 0, 0, 0.32) 85%, transparent 99%)';
  return {
    WebkitMaskImage: scenicMask,
    maskImage: scenicMask,
  };
}

function sortNumeric(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

/**
 * Analyzes a product image and removes white/light-gray, marble, or solid colored studio backgrounds
 * using a bilinear local-background model, multi-scale optical edge detection (grad2 + grad6),
 * floor cast-shadow sweeping, monitor-chin geometry preservation, and edge defringing.
 */
export async function processProductImageHarmony(
  imageUrl: string,
  forceRemoveBg: boolean = false
): Promise<ProcessedImageResult> {
  if (!imageUrl) {
    return { url: '', mode: 'scenic', hasLightBg: false };
  }

  if (typeof window === 'undefined') {
    return { url: imageUrl, mode: forceRemoveBg ? 'softbox' : 'scenic', hasLightBg: false };
  }

  const cacheKey = `${imageUrl}::${forceRemoveBg ? '1' : '0'}`;
  const cached = processedImageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  return new Promise<ProcessedImageResult>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxDim = 820;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          const fallback: ProcessedImageResult = {
            url: imageUrl,
            mode: forceRemoveBg ? 'softbox' : 'scenic',
            hasLightBg: false,
          };
          processedImageCache.set(cacheKey, fallback);
          resolve(fallback);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const totalPixels = w * h;

        const lum = new Float32Array(totalPixels);
        const chroma = new Uint8Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
          chroma[i] = Math.max(r, g, b) - Math.min(r, g, b);
        }

        // 1. Sample perimeter to detect transparency, light studio box, or colored studio backdrop
        let perimeterCount = 0;
        let transparentPerimeter = 0;
        let lightNeutralPerimeter = 0;
        const borderR: number[] = [];
        const borderG: number[] = [];
        const borderB: number[] = [];
        const borderC: number[] = [];

        const sampleBorderPixel = (x: number, y: number) => {
          const i = y * w + x;
          const idx = i * 4;
          perimeterCount++;
          if (data[idx + 3] < 180) {
            transparentPerimeter++;
            return;
          }
          if (lum[i] >= 165 && chroma[i] <= 40) {
            lightNeutralPerimeter++;
          }
          borderR.push(data[idx]);
          borderG.push(data[idx + 1]);
          borderB.push(data[idx + 2]);
          borderC.push(chroma[i]);
        };

        for (let x = 0; x < w; x++) {
          sampleBorderPixel(x, 0);
          sampleBorderPixel(x, h - 1);
        }
        for (let y = 1; y < h - 1; y++) {
          sampleBorderPixel(0, y);
          sampleBorderPixel(w - 1, y);
        }

        // Already a transparent cutout PNG
        if (perimeterCount > 0 && transparentPerimeter / perimeterCount > 0.22) {
          const res: ProcessedImageResult = { url: imageUrl, mode: 'cutout', hasLightBg: false };
          processedImageCache.set(cacheKey, res);
          resolve(res);
          return;
        }

        const mid = Math.floor(borderR.length / 2);
        const medR = sortNumeric(borderR)[mid] ?? 240;
        const medG = sortNumeric(borderG)[mid] ?? 240;
        const medB = sortNumeric(borderB)[mid] ?? 240;
        const medC = sortNumeric(borderC)[mid] ?? 0;
        const medLum = 0.299 * medR + 0.587 * medG + 0.114 * medB;

        const isColoredStudioBackdrop = medC >= 55 && medLum >= 120;
        const isLightStudioBg =
          !isColoredStudioBackdrop &&
          perimeterCount > 0 &&
          lightNeutralPerimeter / perimeterCount >= 0.55;
        const hasStudioBg = isLightStudioBg || isColoredStudioBackdrop;

        // If it's a scenic/lifestyle photo (not a light box or colored studio backdrop), preserve scenery and use vignette feathering
        if (!hasStudioBg) {
          const scenicResult: ProcessedImageResult = {
            url: imageUrl,
            mode: 'scenic',
            hasLightBg: false,
          };
          processedImageCache.set(cacheKey, scenicResult);
          resolve(scenicResult);
          return;
        }

        // If the admin explicitly turned off Studio Cutout (selecting Option 2: Khung Nổi Làm Mềm Viền),
        // use softbox edge feathering while still reporting hasLightBg: true so the dark banner backdrop is never washed out.
        if (!forceRemoveBg) {
          const softboxResult: ProcessedImageResult = {
            url: imageUrl,
            mode: 'softbox',
            hasLightBg: true,
          };
          processedImageCache.set(cacheKey, softboxResult);
          resolve(softboxResult);
          return;
        }

        // 2. Build 1D smoothed border profiles for bilinear local background model bg(x, y)
        const leftR = new Float32Array(h);
        const leftG = new Float32Array(h);
        const leftB = new Float32Array(h);
        const rightR = new Float32Array(h);
        const rightG = new Float32Array(h);
        const rightB = new Float32Array(h);

        for (let y = 0; y < h; y++) {
          let srL = 0, sgL = 0, sbL = 0, cL = 0;
          let srR = 0, sgR = 0, sbR = 0, cR = 0;
          for (let dy = -6; dy <= 6; dy++) {
            const ny = Math.min(h - 1, Math.max(0, y + dy));
            for (let dx = 0; dx < 4; dx++) {
              const iL = (ny * w + dx) * 4;
              srL += data[iL];
              sgL += data[iL + 1];
              sbL += data[iL + 2];
              cL++;

              const iR = (ny * w + (w - 1 - dx)) * 4;
              srR += data[iR];
              sgR += data[iR + 1];
              sbR += data[iR + 2];
              cR++;
            }
          }
          leftR[y] = srL / cL;
          leftG[y] = sgL / cL;
          leftB[y] = sbL / cL;
          rightR[y] = srR / cR;
          rightG[y] = sgR / cR;
          rightB[y] = sbR / cR;
        }

        const topR = new Float32Array(w);
        const topG = new Float32Array(w);
        const topB = new Float32Array(w);
        const botR = new Float32Array(w);
        const botG = new Float32Array(w);
        const botB = new Float32Array(w);

        for (let x = 0; x < w; x++) {
          let srT = 0, sgT = 0, sbT = 0, cT = 0;
          let srB = 0, sgB = 0, sbB = 0, cB = 0;
          for (let dx = -6; dx <= 6; dx++) {
            const nx = Math.min(w - 1, Math.max(0, x + dx));
            for (let dy = 0; dy < 4; dy++) {
              const iT = (dy * w + nx) * 4;
              srT += data[iT];
              sgT += data[iT + 1];
              sbT += data[iT + 2];
              cT++;

              const iB = ((h - 1 - dy) * w + nx) * 4;
              srB += data[iB];
              sgB += data[iB + 1];
              sbB += data[iB + 2];
              cB++;
            }
          }
          topR[x] = srT / cT;
          topG[x] = sgT / cT;
          topB[x] = sbT / cT;
          botR[x] = srB / cB;
          botG[x] = sgB / cB;
          botB[x] = sbB / cB;
        }

        // 3. Multi-scale optical gradient: grad2 (2px span) and grad6 (6px span for macro depth-of-field edges)
        const grad2 = new Float32Array(totalPixels);
        const grad6 = new Float32Array(totalPixels);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const l1 = (i - 1) * 4;
            const r1 = (i + 1) * 4;
            const u1 = (i - w) * 4;
            const d1 = (i + w) * 4;
            const gx2 =
              Math.abs(data[r1] - data[l1]) +
              Math.abs(data[r1 + 1] - data[l1 + 1]) +
              Math.abs(data[r1 + 2] - data[l1 + 2]);
            const gy2 =
              Math.abs(data[d1] - data[u1]) +
              Math.abs(data[d1 + 1] - data[u1 + 1]) +
              Math.abs(data[d1 + 2] - data[u1 + 2]);
            grad2[i] = (gx2 + gy2) / 3;

            const xL = Math.max(0, x - 3);
            const xR = Math.min(w - 1, x + 3);
            const yU = Math.max(0, y - 3);
            const yD = Math.min(h - 1, y + 3);
            const l3 = (y * w + xL) * 4;
            const r3 = (y * w + xR) * 4;
            const u3 = (yU * w + x) * 4;
            const d3 = (yD * w + x) * 4;
            const gx6 =
              Math.abs(data[r3] - data[l3]) +
              Math.abs(data[r3 + 1] - data[l3 + 1]) +
              Math.abs(data[r3 + 2] - data[l3 + 2]);
            const gy6 =
              Math.abs(data[d3] - data[u3]) +
              Math.abs(data[d3 + 1] - data[u3 + 1]) +
              Math.abs(data[d3 + 2] - data[u3 + 2]);
            const lumDiff6 = Math.hypot(
              lum[y * w + xR] - lum[y * w + xL],
              lum[yD * w + x] - lum[yU * w + x]
            );
            grad6[i] = Math.max(lumDiff6, (gx6 + gy6) / 3.5);
          }
        }

        // Detect textured neutral studio surface (e.g. veined marble backdrop)
        let borderGradCount = 0;
        let borderSampleTotal = 0;
        for (let y = 4; y < Math.round(h * 0.14); y++) {
          for (let x = 4; x < w - 4; x += 2) {
            const i = y * w + x;
            if (chroma[i] <= 18 && lum[i] >= 145) {
              borderSampleTotal++;
              if (grad6[i] >= 12) borderGradCount++;
            }
          }
        }
        const isTexturedNeutralSurface =
          isLightStudioBg && borderSampleTotal > 50 && borderGradCount / borderSampleTotal > 0.08;

        // 4. Detect dark hardware core bounds
        let darkMinX = w;
        let darkMaxX = -1;
        let darkMinY = h;
        let darkMaxY = -1;
        let darkCount = 0;
        const rowDarkMinX = new Int32Array(h).fill(w);
        const rowDarkMaxX = new Int32Array(h).fill(-1);

        for (let y = Math.round(h * 0.05); y < Math.round(h * 0.95); y++) {
          for (let x = Math.round(w * 0.05); x < Math.round(w * 0.95); x++) {
            const i = y * w + x;
            const isDarkCore = isColoredStudioBackdrop
              ? lum[i] < 100 && chroma[i] < 50
              : lum[i] < 85;
            if (isDarkCore) {
              darkCount++;
              if (x < darkMinX) darkMinX = x;
              if (x > darkMaxX) darkMaxX = x;
              if (y < darkMinY) darkMinY = y;
              if (y > darkMaxY) darkMaxY = y;
              if (x < rowDarkMinX[y]) rowDarkMinX[y] = x;
              if (x > rowDarkMaxX[y]) rowDarkMaxX[y] = x;
            }
          }
        }

        // Strict detector for Rectangular Monitor Screen with lower silver chin & stand
        let hasMonitorChin = false;
        let screenX1 = 0;
        let screenX2 = 0;
        let screenY1 = 0;
        let screenY2 = 0;
        let chinBotY = 0;

        if (isLightStudioBg && darkCount > totalPixels * 0.12) {
          let bandY1 = -1;
          let bandY2 = -1;
          const x1List: number[] = [];
          const x2List: number[] = [];
          for (let y = Math.round(h * 0.15); y < Math.round(h * 0.85); y++) {
            const rw = rowDarkMaxX[y] - rowDarkMinX[y];
            if (rw > w * 0.38) {
              if (bandY1 === -1) bandY1 = y;
              bandY2 = y;
              x1List.push(rowDarkMinX[y]);
              x2List.push(rowDarkMaxX[y]);
            } else if (bandY1 !== -1 && bandY2 - bandY1 > h * 0.28) {
              break;
            }
          }
          if (bandY1 !== -1 && bandY2 - bandY1 > h * 0.28 && x1List.length > 20) {
            const sx1 = sortNumeric(x1List)[Math.floor(x1List.length / 2)];
            const sx2 = sortNumeric(x2List)[Math.floor(x2List.length / 2)];
            let straightRows = 0;
            for (let k = 0; k < x1List.length; k++) {
              if (Math.abs(x1List[k] - sx1) <= 4 && Math.abs(x2List[k] - sx2) <= 4) {
                straightRows++;
              }
            }
            const isStraightRect = straightRows / x1List.length >= 0.82;

            let brightChinPixels = 0;
            let chinTotal = 0;
            const chinTestH = Math.round((bandY2 - bandY1) * 0.14);
            for (let y = bandY2 + 3; y < Math.min(h - 5, bandY2 + chinTestH); y++) {
              for (let x = sx1 + 10; x < sx2 - 10; x += 2) {
                chinTotal++;
                if (lum[y * w + x] > 215) brightChinPixels++;
              }
            }
            const isBrightChinBelow = chinTotal > 0 && brightChinPixels / chinTotal >= 0.85;

            if (isStraightRect && isBrightChinBelow) {
              hasMonitorChin = true;
              screenX1 = sx1;
              screenX2 = sx2;
              screenY1 = bandY1;
              screenY2 = bandY2;
              chinBotY = Math.min(h - 10, bandY2 + Math.round((bandY2 - bandY1) * 0.165));
            }
          }
        }

        // For textured neutral surface (e.g. keyboard on marble), find tight dark hardware frame bounds
        let rectHwX1 = darkMinX;
        let rectHwX2 = darkMaxX;
        let rectHwY1 = darkMinY;
        let rectHwY2 = darkMaxY;
        if (isTexturedNeutralSurface) {
          const validX1: number[] = [];
          const validX2: number[] = [];
          const validY: number[] = [];
          for (let y = darkMinY; y <= darkMaxY; y++) {
            let rowDarkCnt = 0;
            let rMin = w;
            let rMax = -1;
            for (let x = darkMinX; x <= darkMaxX; x++) {
              if (lum[y * w + x] < 52) {
                rowDarkCnt++;
                if (x < rMin) rMin = x;
                if (x > rMax) rMax = x;
              }
            }
            if (rowDarkCnt > (darkMaxX - darkMinX) * 0.25) {
              validY.push(y);
              validX1.push(rMin);
              validX2.push(rMax);
            }
          }
          if (validY.length > 10) {
            rectHwY1 = validY[0];
            rectHwY2 = validY[validY.length - 1];
            rectHwX1 = sortNumeric(validX1)[Math.floor(validX1.length * 0.2)];
            rectHwX2 = sortNumeric(validX2)[Math.floor(validX2.length * 0.8)];
          }
        }

        const getLocalBg = (x: number, y: number): [number, number, number, number] => {
          const u = x / Math.max(1, w - 1);
          const v = y / Math.max(1, h - 1);
          const hr = (1 - u) * leftR[y] + u * rightR[y];
          const hg = (1 - u) * leftG[y] + u * rightG[y];
          const hb = (1 - u) * leftB[y] + u * rightB[y];
          const vr = (1 - v) * topR[x] + v * botR[x];
          const vg = (1 - v) * topG[x] + v * botG[x];
          const vb = (1 - v) * topB[x] + v * botB[x];
          const dh = Math.min(u, 1 - u) + 0.03;
          const dv = Math.min(v, 1 - v) + 0.03;
          const br = (dv * hr + dh * vr) / (dh + dv);
          const bg = (dv * hg + dh * vg) / (dh + dv);
          const bb = (dv * hb + dh * vb) / (dh + dv);
          return [br, bg, bb, 0.299 * br + 0.587 * bg + 0.114 * bb];
        };

        const medMin = Math.min(medR, medG, medB);
        const medSpan = Math.max(1, Math.max(medR, medG, medB) - medMin);
        const hueR = (medR - medMin) / medSpan;
        const hueG = (medG - medMin) / medSpan;
        const hueB = (medB - medMin) / medSpan;

        const isPixelBgCandidate = (x: number, y: number, i: number): boolean => {
          if (hasMonitorChin) {
            const screenW = screenX2 - screenX1;
            const midX = (screenX1 + screenX2) / 2;
            if (y >= screenY1 && y <= chinBotY && x >= screenX1 && x <= screenX2) {
              const rCorner = Math.round(screenW * 0.025);
              if (y > chinBotY - rCorner) {
                if (
                  x < screenX1 + rCorner &&
                  Math.hypot(x - (screenX1 + rCorner), y - (chinBotY - rCorner)) > rCorner
                ) {
                  return true;
                }
                if (
                  x > screenX2 - rCorner &&
                  Math.hypot(x - (screenX2 - rCorner), y - (chinBotY - rCorner)) > rCorner
                ) {
                  return true;
                }
              }
              return false;
            }
            const standBotY = Math.min(h - 5, chinBotY + Math.round((screenY2 - screenY1) * 0.21));
            if (y > chinBotY && y <= standBotY) {
              const t = (y - chinBotY) / Math.max(1, standBotY - chinBotY);
              const halfW = screenW * (0.105 + 0.048 * t);
              if (Math.abs(x - midX) <= halfW) return false;
            }
            const kbY1 = standBotY + Math.round(h * 0.012);
            const kbY2 = Math.min(h - 4, standBotY + Math.round(h * 0.062));
            if (y >= kbY1 && y <= kbY2) {
              if (x >= midX - screenW * 0.33 && x <= midX + screenW * 0.155) return false;
              if (x >= midX + screenW * 0.195 && x <= midX + screenW * 0.465) return false;
            }
            if (y > chinBotY) return true;
          }

          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (isColoredStudioBackdrop) {
            const pMin = Math.min(r, g, b);
            const pSpan = Math.max(r, g, b) - pMin;
            if (pSpan >= 36 && lum[i] >= 46) {
              const pr = (r - pMin) / pSpan;
              const pg = (g - pMin) / pSpan;
              const pb = (b - pMin) / pSpan;
              const hueDiff = Math.abs(pr - hueR) + Math.abs(pg - hueG) + Math.abs(pb - hueB);
              if (hueDiff <= 0.44 && grad2[i] < 28) return true;
            }
            if (lum[i] >= 180 && pSpan >= 28) {
              const pr = (r - pMin) / pSpan;
              const pg = (g - pMin) / pSpan;
              const pb = (b - pMin) / pSpan;
              if (Math.abs(pr - hueR) + Math.abs(pg - hueG) + Math.abs(pb - hueB) <= 0.58) {
                return true;
              }
            }
            return false;
          }

          if (isTexturedNeutralSurface) {
            if (x < rectHwX1 || x > rectHwX2 || y < rectHwY1 || y > rectHwY2) {
              return true;
            }
            if (lum[i] >= 135 && chroma[i] <= 20 && grad2[i] < 35) {
              return true;
            }
            return false;
          }

          const [br, bg, bb, blum] = getLocalBg(x, y);
          const dr = r - br;
          const dg = g - bg;
          const db = b - bb;
          const tintDiff = Math.max(dr, dg, db) - Math.min(dr, dg, db);
          const lumDrop = blum - lum[i];

          const hasDarkHardwareCore = darkCount > totalPixels * 0.08;

          // For warm-tinted products on white bg (e.g. cream/rose-gold headphones), neutral white & wall shadow is background
          if (
            !hasDarkHardwareCore &&
            r - b <= 15 &&
            chroma[i] <= 15 &&
            lum[i] >= 188 &&
            grad2[i] < 28
          ) {
            return true;
          }

          if (medC <= 16 && r - b >= 15 && lum[i] < 244) {
            return false;
          }
          if (medC <= 16 && tintDiff >= 12 && lum[i] < 245) {
            return false;
          }

          const inFloorShadowZone =
            hasDarkHardwareCore &&
            (y > darkMaxY - Math.round(h * 0.09) ||
              (y > darkMinY + Math.round((darkMaxY - darkMinY) * 0.52) &&
                (x < rowDarkMinX[y] || x > rowDarkMaxX[y])));

          if (inFloorShadowZone) {
            if (lum[i] >= 88 && chroma[i] <= 24 && tintDiff <= 16 && grad2[i] < 32) {
              return true;
            }
          }

          if (grad2[i] >= 16 || grad6[i] >= 15) {
            return false;
          }

          const maxLumDrop =
            hasDarkHardwareCore && y < darkMinY + Math.round((darkMaxY - darkMinY) * 0.35)
              ? 14
              : 26;

          if (lumDrop <= maxLumDrop && lum[i] >= 155 && chroma[i] <= Math.max(20, medC + 10)) {
            return true;
          }

          return false;
        };

        // 5. BFS Flood-Fill from outer borders + enclosed studio background arches
        const visitedBg = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let qHead = 0;
        let qTail = 0;

        const trySeed = (x: number, y: number) => {
          const i = y * w + x;
          if (!visitedBg[i] && isPixelBgCandidate(x, y, i)) {
            visitedBg[i] = 1;
            queue[qTail++] = i;
          }
        };

        for (let x = 0; x < w; x++) {
          trySeed(x, 0);
          trySeed(x, h - 1);
        }
        for (let y = 1; y < h - 1; y++) {
          trySeed(0, y);
          trySeed(w - 1, y);
        }

        if (isLightStudioBg && !hasMonitorChin && !isTexturedNeutralSurface) {
          for (let y = Math.round(h * 0.22); y < Math.round(h * 0.65); y += 3) {
            for (let x = Math.round(w * 0.32); x < Math.round(w * 0.70); x += 3) {
              const i = y * w + x;
              if (!visitedBg[i] && lum[i] >= 242 && chroma[i] <= 6 && grad6[i] <= 5) {
                visitedBg[i] = 1;
                queue[qTail++] = i;
              }
            }
          }
        }

        const neighborOffsets = [-1, 1, -w, w];
        while (qHead < qTail) {
          const curr = queue[qHead++];
          const cx = curr % w;
          const cy = (curr - cx) / w;

          for (let d = 0; d < 4; d++) {
            const next = curr + neighborOffsets[d];
            if (next < 0 || next >= totalPixels || visitedBg[next]) continue;
            const nx = next % w;
            const ny = (next - nx) / w;
            if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
            if (!isPixelBgCandidate(nx, ny, next)) continue;
            visitedBg[next] = 1;
            queue[qTail++] = next;
          }
        }

        // Remove thin background-shadow hairs (< 9px vertical thickness) on light studio photos
        if (isLightStudioBg && !hasMonitorChin && !isTexturedNeutralSurface) {
          for (let y = 6; y < h - 6; y++) {
            for (let x = 6; x < w - 6; x++) {
              const i = y * w + x;
              if (!visitedBg[i] && lum[i] >= 165 && chroma[i] <= 32) {
                if (visitedBg[(y - 5) * w + x] && visitedBg[(y + 5) * w + x]) {
                  visitedBg[i] = 1;
                }
              }
            }
          }
        }

        // Remove disconnected foreground islands (< 3.5% of total pixels) such as floating shadow strips or marble specks
        if (!hasMonitorChin) {
          const fgVisited = new Uint8Array(totalPixels);
          const compQueue = new Int32Array(totalPixels);
          const minCompSize = Math.round(totalPixels * 0.035);
          for (let i = 0; i < totalPixels; i++) {
            if (!visitedBg[i] && !fgVisited[i]) {
              let cHead = 0;
              let cTail = 0;
              fgVisited[i] = 1;
              compQueue[cTail++] = i;
              while (cHead < cTail) {
                const cur = compQueue[cHead++];
                const cx = cur % w;
                const cy = (cur - cx) / w;
                for (let d = 0; d < 4; d++) {
                  const nxt = cur + neighborOffsets[d];
                  if (nxt < 0 || nxt >= totalPixels || visitedBg[nxt] || fgVisited[nxt]) continue;
                  const nx = nxt % w;
                  const ny = (nxt - nx) / w;
                  if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
                  fgVisited[nxt] = 1;
                  compQueue[cTail++] = nxt;
                }
              }
              if (cTail < minCompSize) {
                for (let k = 0; k < cTail; k++) {
                  visitedBg[compQueue[k]] = 1;
                }
              }
            }
          }
        }

        // Fill small interior holes inside foreground (< 1.2% of total pixels)
        const bgHoleVisited = new Uint8Array(totalPixels);
        const holeQueue = new Int32Array(totalPixels);
        const maxHoleSize = Math.round(totalPixels * 0.012);
        for (let i = 0; i < totalPixels; i++) {
          if (visitedBg[i] && !bgHoleVisited[i]) {
            let hHead = 0;
            let hTail = 0;
            let touchesBorder = false;
            bgHoleVisited[i] = 1;
            holeQueue[hTail++] = i;
            while (hHead < hTail) {
              const cur = holeQueue[hHead++];
              const cx = cur % w;
              const cy = (cur - cx) / w;
              if (cx === 0 || cx === w - 1 || cy === 0 || cy === h - 1) touchesBorder = true;
              for (let d = 0; d < 4; d++) {
                const nxt = cur + neighborOffsets[d];
                if (nxt < 0 || nxt >= totalPixels || !visitedBg[nxt] || bgHoleVisited[nxt]) continue;
                const nx = nxt % w;
                const ny = (nxt - nx) / w;
                if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
                bgHoleVisited[nxt] = 1;
                holeQueue[hTail++] = nxt;
              }
            }
            if (!touchesBorder && hTail < maxHoleSize) {
              for (let k = 0; k < hTail; k++) {
                visitedBg[holeQueue[k]] = 0;
              }
            }
          }
        }

        // Shade overexposed white monitor chin with brushed-silver metallic gradient so it stands out cleanly
        if (hasMonitorChin) {
          for (let y = screenY2; y <= chinBotY; y++) {
            const vProg = (y - screenY2) / Math.max(1, chinBotY - screenY2);
            for (let x = screenX1; x <= screenX2; x++) {
              const i = y * w + x;
              if (!visitedBg[i] && lum[i] > 180) {
                const idx = i * 4;
                const hProg = Math.abs(
                  (x - (screenX1 + screenX2) / 2) / ((screenX2 - screenX1) / 2)
                );
                const silverBase = Math.round(218 - vProg * 16 - hProg * 12);
                data[idx] = silverBase - 3;
                data[idx + 1] = silverBase;
                data[idx + 2] = silverBase + 6;
              }
            }
          }
        }

        const bgCount = visitedBg.reduce((acc, v) => acc + v, 0);
        const bgRatio = bgCount / totalPixels;
        if (bgRatio < 0.05 || bgRatio > 0.95) {
          const fallbackRes: ProcessedImageResult = {
            url: imageUrl,
            mode: 'softbox',
            hasLightBg: true,
          };
          processedImageCache.set(cacheKey, fallbackRes);
          resolve(fallbackRes);
          return;
        }

        // 6. Smooth feathered alpha mask (2-pass separable box blur radius 2)
        const alphaBuf = new Float32Array(totalPixels);
        const tempBuf = new Float32Array(totalPixels);
        for (let i = 0; i < totalPixels; i++) {
          alphaBuf[i] = visitedBg[i] ? 0 : 255;
        }

        const blurRadius = 2;
        for (let pass = 0; pass < 2; pass++) {
          for (let y = 0; y < h; y++) {
            const rowOffset = y * w;
            for (let x = 0; x < w; x++) {
              let sum = 0;
              let count = 0;
              for (let k = -blurRadius; k <= blurRadius; k++) {
                const nx = x + k;
                if (nx >= 0 && nx < w) {
                  sum += alphaBuf[rowOffset + nx];
                  count++;
                }
              }
              tempBuf[rowOffset + x] = sum / count;
            }
          }
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              let sum = 0;
              let count = 0;
              for (let k = -blurRadius; k <= blurRadius; k++) {
                const ny = y + k;
                if (ny >= 0 && ny < h) {
                  sum += tempBuf[ny * w + x];
                  count++;
                }
              }
              alphaBuf[y * w + x] = sum / count;
            }
          }
        }

        // Apply alpha & edge color decontamination (defringing)
        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          let a = alphaBuf[i];
          if (visitedBg[i] && a < 105) {
            a = 0;
          } else if (!visitedBg[i] && a > 165) {
            a = 255;
          } else {
            a = Math.max(0, Math.min(255, ((a - 75) / 125) * 255));
          }

          data[idx + 3] = Math.round(a);

          if (a > 0 && a < 245) {
            const factor = 0.4 + 0.6 * (a / 255);
            data[idx] = Math.round(data[idx] * factor);
            data[idx + 1] = Math.round(data[idx + 1] * factor);
            data[idx + 2] = Math.round(data[idx + 2] * factor);
          }

          // Desaturate colored backdrop spill on dark hardware edges
          if (isColoredStudioBackdrop && a > 0) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const pMin = Math.min(r, g, b);
            const pSpan = Math.max(r, g, b) - pMin;
            if (pSpan > 18 && pMin < 35) {
              const l = Math.round(lum[i] * 0.65);
              data[idx] = l;
              data[idx + 1] = l;
              data[idx + 2] = l;
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const cutoutDataUrl = canvas.toDataURL('image/png');
        const result: ProcessedImageResult = {
          url: cutoutDataUrl,
          mode: 'cutout',
          hasLightBg: true,
        };
        processedImageCache.set(cacheKey, result);
        resolve(result);
      } catch {
        // Graceful fallback if CORS taints canvas
        const fallbackResult: ProcessedImageResult = {
          url: imageUrl,
          mode: forceRemoveBg ? 'softbox' : 'scenic',
          hasLightBg: Boolean(forceRemoveBg),
        };
        processedImageCache.set(cacheKey, fallbackResult);
        resolve(fallbackResult);
      }
    };

    img.onerror = () => {
      const errResult: ProcessedImageResult = {
        url: imageUrl,
        mode: 'scenic',
        hasLightBg: false,
      };
      resolve(errResult);
    };

    img.src = imageUrl;
  });
}

/**
 * Legacy helper preserved for compatibility.
 */
export async function removeWhiteBackground(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  const res = await processProductImageHarmony(imageUrl, true);
  return res.url;
}

/**
 * React hook to manage product image source and smart background harmony state.
 * Automatically removes white/light/colored studio boxes when removeWhiteBg is enabled,
 * and provides smooth elliptical edge feathering for lifestyle/softbox photos.
 */
export function useBlendedProductImage(
  src: string,
  removeWhiteBg: boolean = false
): {
  displaySrc: string;
  isBlended: boolean;
  blendMode: ImageBlendMode;
  hasLightBg: boolean;
  isProcessing: boolean;
} {
  const currentKey = `${src || ''}::${removeWhiteBg ? '1' : '0'}`;
  const [resolved, setResolved] = useState<{
    key: string;
    url: string;
    mode: ImageBlendMode;
    hasLightBg: boolean;
  } | null>(null);

  useEffect(() => {
    if (!src) {
      return;
    }

    let isCancelled = false;
    const key = `${src}::${removeWhiteBg ? '1' : '0'}`;

    processProductImageHarmony(src, removeWhiteBg).then((res) => {
      if (isCancelled) return;
      setResolved({
        key,
        url: res.url || src,
        mode: res.mode,
        hasLightBg: res.hasLightBg,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [src, removeWhiteBg]);

  if (!src) {
    return {
      displaySrc: '',
      isBlended: false,
      blendMode: 'scenic',
      hasLightBg: false,
      isProcessing: false,
    };
  }

  const isReady = resolved?.key === currentKey;
  const activeMode: ImageBlendMode = isReady
    ? resolved.mode
    : removeWhiteBg
    ? 'softbox'
    : 'scenic';
  const activeHasLightBg = isReady ? resolved.hasLightBg : Boolean(removeWhiteBg);

  return {
    displaySrc: isReady ? resolved.url : src,
    isBlended: activeMode === 'cutout' || activeMode === 'softbox',
    blendMode: activeMode,
    hasLightBg: activeHasLightBg,
    isProcessing: !isReady,
  };
}
