/**
 * Core physics for the liquid-glass displacement maps.
 *
 * compute1D  — Snell's law refraction along one radius (128 samples)
 * compute2D  — wraps the 1D map around a rounded-rectangle shape
 * computeSpecular — physically-based rim-light highlight
 */

import type { Profile, BuildMapsConfig, BuildMapsResult } from './types.js';

// ─── Surface profiles ────────────────────────────────────────────────────────

export const PROFILES: Record<string, (x: number) => number> = {
  convexSquircle: (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4),
  convexCircle: (x: number) => Math.sqrt(Math.max(0, 1 - Math.pow(1 - x, 2))),
  concave: (x: number) => 1 - Math.sqrt(Math.max(0, 1 - Math.pow(1 - x, 2))),
};

export function resolveProfile(p: Profile): (x: number) => number {
  if (typeof p === 'function') return p;
  return PROFILES[p] ?? PROFILES['convexSquircle'];
}

// ─── 1-D displacement map ────────────────────────────────────────────────────

/**
 * Compute refraction displacement along one radius of the bezel via Snell's law.
 *
 * @returns Array of lateral displacement values (one per sample).
 */
export function compute1D(
  glassThickness: number,
  bezelWidth: number,
  profile: Profile,
  refractiveIndex: number,
  samples = 128,
): number[] {
  const sf = resolveProfile(profile);
  const e = 1 / refractiveIndex;
  const result: number[] = [];

  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = sf(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const d = (sf(Math.max(0, Math.min(1, x + dx))) - y) / dx;
    const m = Math.sqrt(d * d + 1);
    const nx = -d / m;
    const ny = -1 / m;
    const dt = ny;
    const k = 1 - e * e * (1 - dt * dt);

    if (k < 0) {
      result.push(0);
    } else {
      const rfx = -(e * dt + Math.sqrt(k)) * nx;
      const rfy = e - (e * dt + Math.sqrt(k)) * ny;
      result.push(rfx * ((y * bezelWidth + glassThickness) / rfy));
    }
  }
  return result;
}

/** Maximum absolute value in a 1D map — the normalisation denominator. */
export function maxDisp(map1D: number[]): number {
  return Math.max(...map1D.map(Math.abs));
}

// ─── 2-D displacement map ────────────────────────────────────────────────────

export function compute2D(
  w: number,
  h: number,
  radius: number,
  bezelWidth: number,
  md: number,
  map1D: number[],
): ImageData {
  const img = new ImageData(w, h);

  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 128;
    img.data[i + 1] = 128;
    img.data[i + 3] = 255;
  }

  const rSq = radius * radius;
  const rp1Sq = (radius + 1) ** 2;
  const rmBwSq = Math.max(0, radius - bezelWidth) ** 2;
  const wB = w - radius * 2;
  const hB = h - radius * 2;

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const idx = (y1 * w + x1) * 4;
      const x = x1 < radius ? x1 - radius : x1 >= w - radius ? x1 - radius - wB : 0;
      const y = y1 < radius ? y1 - radius : y1 >= h - radius ? y1 - radius - hB : 0;
      const dSq = x * x + y * y;

      if (dSq > rp1Sq || dSq < rmBwSq) continue;

      const dist = Math.sqrt(dSq);
      const op = dSq < rSq ? 1 : 1 - (dist - radius) / (Math.sqrt(rp1Sq) - radius);
      const t = Math.max(0, Math.min(1, (radius - dist) / bezelWidth));
      const bIdx = Math.min(Math.floor(t * map1D.length), map1D.length - 1);
      const dVal = map1D[Math.max(0, bIdx)] ?? 0;
      const dX = md > 0 ? (-(dist > 0 ? x / dist : 0) * dVal) / md : 0;
      const dY = md > 0 ? (-(dist > 0 ? y / dist : 0) * dVal) / md : 0;

      img.data[idx] = Math.max(0, Math.min(255, 128 + dX * 127 * op));
      img.data[idx + 1] = Math.max(0, Math.min(255, 128 + dY * 127 * op));
    }
  }
  return img;
}

// ─── Specular highlight ───────────────────────────────────────────────────────

export function computeSpecular(
  w: number,
  h: number,
  radius: number,
  _bezelWidth: number,
): ImageData {
  const img = new ImageData(w, h);
  const sVecX = Math.cos(Math.PI / 3);
  const sVecY = Math.sin(Math.PI / 3);
  const rSq = radius * radius;
  const rp1Sq = (radius + 1) ** 2;
  const rmSSq = Math.max(0, (radius - 1.5) ** 2);
  const wB = w - radius * 2;
  const hB = h - radius * 2;

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < radius ? x1 - radius : x1 >= w - radius ? x1 - radius - wB : 0;
      const y = y1 < radius ? y1 - radius : y1 >= h - radius ? y1 - radius - hB : 0;
      const dSq = x * x + y * y;

      if (dSq > rp1Sq || dSq < rmSSq) continue;

      const dist = Math.sqrt(dSq);
      const op = dSq < rSq ? 1 : 1 - (dist - radius) / (Math.sqrt(rp1Sq) - radius);
      const nx = dist > 0 ? x / dist : 0;
      const ny = dist > 0 ? y / dist : 0;
      const dp = Math.abs(nx * sVecX + -ny * sVecY);
      const t = Math.max(0, Math.min(1, (radius - dist) / 1.5));
      const cf = dp * Math.sqrt(1 - (1 - t) ** 2);
      const c = Math.min(255, 255 * cf);
      const idx = (y1 * w + x1) * 4;

      img.data[idx] = c;
      img.data[idx + 1] = c;
      img.data[idx + 2] = c;
      img.data[idx + 3] = Math.min(255, c * cf * op);
    }
  }
  return img;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function imageDataToURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/** Convenience: run the full pipeline and return data URLs. */
export function buildMaps(cfg: BuildMapsConfig): BuildMapsResult {
  const { width, height, radius, bezelWidth, glassThickness, refractiveIndex } = cfg;
  const profile = cfg.profile ?? 'convexSquircle';
  const map1D = compute1D(glassThickness, bezelWidth, profile, refractiveIndex);
  const md = maxDisp(map1D);

  return {
    dispUrl: imageDataToURL(compute2D(width, height, radius, bezelWidth, md || 1, map1D)),
    specUrl: imageDataToURL(computeSpecular(width, height, radius, bezelWidth)),
    maxDisplacement: md,
  };
}
