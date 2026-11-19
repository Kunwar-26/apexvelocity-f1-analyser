import { ColormapType } from '../types/telemetry';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Viridis sample knots (perceptually uniform sequential colormap)
const VIRIDIS_KNOTS: [number, RGB][] = [
  [0.0, { r: 68, g: 1, b: 84 }],     // #440154 deep purple
  [0.15, { r: 72, g: 40, b: 120 }],  // purple blue
  [0.3, { r: 62, g: 74, b: 137 }],   // indigo
  [0.45, { r: 49, g: 104, b: 142 }], // blue teal
  [0.6, { r: 38, g: 130, b: 142 }],  // teal
  [0.75, { r: 53, g: 183, b: 121 }], // green teal
  [0.9, { r: 180, g: 222, b: 44 }],  // yellow green
  [1.0, { r: 253, g: 231, b: 37 }],  // bright yellow
];

// Turbo sample knots (smooth high dynamic range)
const TURBO_KNOTS: [number, RGB][] = [
  [0.0, { r: 48, g: 18, b: 59 }],
  [0.2, { r: 70, g: 134, b: 251 }],
  [0.4, { r: 27, g: 229, b: 181 }],
  [0.6, { r: 164, g: 252, b: 60 }],
  [0.8, { r: 251, g: 148, b: 35 }],
  [1.0, { r: 122, g: 4, b: 3 }],
];

// Plasma sample knots
const PLASMA_KNOTS: [number, RGB][] = [
  [0.0, { r: 13, g: 8, b: 135 }],
  [0.25, { r: 126, g: 3, b: 168 }],
  [0.5, { r: 204, g: 71, b: 120 }],
  [0.75, { r: 248, g: 149, b: 64 }],
  [1.0, { r: 240, g: 249, b: 33 }],
];

// Motorsport Speed Heat (Deep Blue -> Cyan -> Emerald -> Yellow -> Crimson)
const SPEEDHEAT_KNOTS: [number, RGB][] = [
  [0.0, { r: 30, g: 58, b: 138 }],   // 1st-2nd gear hairpin
  [0.25, { r: 6, g: 182, b: 212 }],  // medium speed corners
  [0.5, { r: 16, g: 185, b: 129 }],  // high speed apexes
  [0.75, { r: 245, g: 158, b: 11 }], // high acceleration straights
  [1.0, { r: 239, g: 68, b: 68 }],   // maximum Vmax (DRS flat-out)
];

function interpolateRGB(c1: RGB, c2: RGB, factor: number): RGB {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * factor),
    g: Math.round(c1.g + (c2.g - c1.g) * factor),
    b: Math.round(c1.b + (c2.b - c1.b) * factor),
  };
}

export function getColorFromKnots(knots: [number, RGB][], t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < knots.length - 1; i++) {
    const [t0, c0] = knots[i];
    const [t1, c1] = knots[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const segmentT = (clamped - t0) / (t1 - t0);
      return interpolateRGB(c0, c1, segmentT);
    }
  }
  return knots[knots.length - 1][1];
}

export function getColormapColor(
  type: ColormapType,
  value: number,
  min: number,
  max: number
): { hex: string; rgb: RGB } {
  const norm = max === min ? 0.5 : (value - min) / (max - min);
  let knots: [number, RGB][];
  switch (type) {
    case 'viridis':
      knots = VIRIDIS_KNOTS;
      break;
    case 'turbo':
      knots = TURBO_KNOTS;
      break;
    case 'plasma':
      knots = PLASMA_KNOTS;
      break;
    case 'speedHeat':
    default:
      knots = SPEEDHEAT_KNOTS;
      break;
  }
  const rgb = getColorFromKnots(knots, norm);
  const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
  return { hex, rgb };
}

export function formatSpeed(speedKmh: number, unit: 'km/h' | 'mph'): string {
  if (unit === 'mph') {
    return `${Math.round(speedKmh * 0.621371)} mph`;
  }
  return `${Math.round(speedKmh)} km/h`;
}
