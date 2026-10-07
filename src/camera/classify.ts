import { COLORS, type Color } from "../cube/cube";

/**
 * Turns camera samples into sticker colours.
 *
 * Each colour has a reference value. A face's centre sticker is a measured
 * reference for its own colour under the current lighting, and centres from
 * faces scanned earlier are remembered. Colours that haven't been seen yet use
 * a typical value, corrected by how far the measured centres are from their
 * typical values (a rough white balance and exposure correction).
 */

export type RGB = readonly [r: number, g: number, b: number];
export type Lab = readonly [l: number, a: number, b: number];

/** Typical sticker colours as seen by a phone camera in neutral light. */
export const TYPICAL_RGB: Record<Color, RGB> = {
  white: [215, 220, 225],
  red: [185, 25, 35],
  green: [30, 160, 70],
  yellow: [220, 200, 40],
  orange: [240, 100, 25],
  blue: [25, 75, 170],
};

const STRONG_CHANNEL = 60;

export function classifyFace(
  samples: readonly RGB[],
  faceColor: Color,
  knownCentres: Partial<Record<Color, RGB>>,
): Color[] {
  const refs = references({ ...knownCentres, [faceColor]: samples[4] });
  return samples.map((sample, i) => (i === 4 ? faceColor : nearest(sample, refs)));
}

export function references(known: Partial<Record<Color, RGB>>): Record<Color, Lab> {
  const measured = COLORS.filter((c) => known[c]);
  const sum = (colors: readonly Color[], rgb: (c: Color) => RGB, channels: readonly number[]) =>
    colors.reduce((total, c) => total + channels.reduce((s, ch) => s + rgb(c)[ch], 0), 0);
  // Overall brightness, used for channels nothing measured says much about.
  const exposure =
    measured.length === 0
      ? 1
      : sum(measured, (c) => known[c]!, [0, 1, 2]) / sum(measured, (c) => TYPICAL_RGB[c], [0, 1, 2]);
  const gain = [0, 1, 2].map((channel) => {
    // A colour only tells us about a channel it's strong in: red's green and
    // blue values are mostly noise.
    const strong = measured.filter((c) => TYPICAL_RGB[c][channel] >= STRONG_CHANNEL);
    const g =
      strong.length === 0
        ? exposure
        : sum(strong, (c) => known[c]!, [channel]) / sum(strong, (c) => TYPICAL_RGB[c], [channel]);
    return clamp(g, 0.3, 3);
  });
  return Object.fromEntries(
    COLORS.map((c) => {
      const rgb = known[c] ?? (TYPICAL_RGB[c].map((v, i) => clamp(v * gain[i], 0, 255)) as unknown as RGB);
      return [c, rgbToLab(rgb)];
    }),
  ) as Record<Color, Lab>;
}

function nearest(sample: RGB, refs: Record<Color, Lab>): Color {
  const lab = rgbToLab(sample);
  let best: Color = "white";
  let bestDistance = Infinity;
  for (const color of COLORS) {
    const d = distance(lab, refs[color]);
    if (d < bestDistance) [best, bestDistance] = [color, d];
  }
  return best;
}

// Lightness varies with shadows across a face, so it counts for less than hue
// and saturation (a and b).
function distance(x: Lab, y: Lab): number {
  return Math.hypot((x[0] - y[0]) * 0.5, x[1] - y[1], x[2] - y[2]);
}

/** sRGB (0–255) to CIE L*a*b* with a D65 white point. */
export function rgbToLab([r, g, b]: RGB): Lab {
  const linear = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const x = (0.4124 * linear[0] + 0.3576 * linear[1] + 0.1805 * linear[2]) / 0.95047;
  const y = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const z = (0.0193 * linear[0] + 0.1192 * linear[1] + 0.9505 * linear[2]) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Per-channel median, which ignores small highlights and shadows in a patch. */
export function medianRGB(pixels: Uint8ClampedArray): RGB {
  const channels: number[][] = [[], [], []];
  for (let i = 0; i < pixels.length; i += 4) {
    channels[0].push(pixels[i]);
    channels[1].push(pixels[i + 1]);
    channels[2].push(pixels[i + 2]);
  }
  return channels.map((values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0) as unknown as RGB;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
