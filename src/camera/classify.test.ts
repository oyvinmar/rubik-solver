import { describe, expect, it } from "vitest";
import { COLORS, type Color } from "../cube/cube";
import { type RGB, TYPICAL_RGB, classifyFace, medianRGB } from "./classify";

// Deterministic noise so failures are reproducible.
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

// Light colour and brightness, as a gain per channel, with the share of
// stickers we accept getting wrong (the user can tap to fix those).
const LIGHTING: [name: string, light: RGB, maxErrorRate: number][] = [
  ["neutral", [1, 1, 1], 0],
  ["slightly warm", [1.07, 1, 0.9], 0],
  ["slightly cool", [0.92, 1, 1.08], 0],
  ["dim", [0.55, 0.55, 0.55], 0],
  ["strongly warm", [1.15, 0.95, 0.7], 0.005],
  ["strongly cool", [0.85, 0.95, 1.15], 0.005],
  ["dim and warm", [0.7, 0.55, 0.4], 0.05],
];

// The order faces are scanned in; each face's centre is remembered for later faces.
const SCAN_ORDER: Color[] = ["green", "red", "blue", "orange", "white", "yellow"];

function photograph(color: Color, light: RGB, rand: () => number, noise = 12): RGB {
  // Per-sticker brightness varies a little (angle, shadows), plus sensor noise.
  const brightness = 0.9 + rand() * 0.2;
  return TYPICAL_RGB[color].map((v, i) =>
    Math.round(Math.min(255, Math.max(0, v * light[i] * brightness + (rand() - 0.5) * noise))),
  ) as unknown as RGB;
}

describe("classifyFace", () => {
  it.each(LIGHTING)("recognises stickers in %s light", (_, light, maxErrorRate) => {
    const rand = random(1);
    let wrong = 0;
    let total = 0;
    SCAN_ORDER.forEach((faceColor, k) => {
      const known = Object.fromEntries(SCAN_ORDER.slice(0, k).map((c) => [c, photograph(c, light, rand)]));
      for (let trial = 0; trial < 200; trial++) {
        const truth = Array.from({ length: 9 }, (_, i) => (i === 4 ? faceColor : COLORS[Math.floor(rand() * 6)]));
        const result = classifyFace(
          truth.map((c) => photograph(c, light, rand)),
          faceColor,
          known,
        );
        wrong += result.filter((c, i) => c !== truth[i]).length;
        total += 8;
      }
    });
    expect(wrong / total).toBeLessThanOrEqual(maxErrorRate);
  });

  it("uses centres remembered from earlier faces", () => {
    // Orange looks unusually red under this light. With a measured orange
    // centre to compare against, red and orange still separate.
    const light: RGB = [1, 0.6, 0.6];
    const rand = random(2);
    const known = { red: photograph("red", light, rand, 0), orange: photograph("orange", light, rand, 0) };
    const truth: Color[] = ["red", "orange", "red", "orange", "green", "orange", "red", "orange", "red"];
    const samples = truth.map((c) => photograph(c, light, rand));
    expect(classifyFace(samples, "green", known)).toEqual(truth);
  });

  it("always keeps the face's own colour in the centre", () => {
    const samples = Array.from({ length: 9 }, () => TYPICAL_RGB.blue);
    expect(classifyFace(samples, "green", {})[4]).toBe("green");
  });
});

describe("medianRGB", () => {
  it("ignores a small bright highlight", () => {
    const pixels = new Uint8ClampedArray([
      ...[200, 20, 30, 255],
      ...[190, 25, 35, 255],
      ...[255, 255, 255, 255], // glare
      ...[195, 22, 33, 255],
      ...[185, 28, 31, 255],
    ]);
    expect(medianRGB(pixels)).toEqual([195, 25, 33]);
  });
});
