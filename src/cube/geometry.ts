import { FACES, type Face, stickerIndex } from "./cube";

/**
 * 3D coordinates for every sticker, used to derive move permutations and
 * face neighbours instead of hand-writing tables.
 *
 * Axes: +x is right (R), +y is up (U), +z is towards you (F).
 */
export type Vec = readonly [number, number, number];

export const FACE_NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

function cubiePosition(face: Face, row: number, col: number): Vec {
  switch (face) {
    case "U":
      return [col - 1, 1, row - 1];
    case "R":
      return [1, 1 - row, 1 - col];
    case "F":
      return [col - 1, 1 - row, 1];
    case "D":
      return [col - 1, -1, 1 - row];
    case "L":
      return [-1, 1 - row, col - 1];
    case "B":
      return [1 - col, 1 - row, -1];
  }
}

export interface StickerGeometry {
  position: Vec;
  normal: Vec;
}

export const STICKERS: readonly StickerGeometry[] = FACES.flatMap((face) =>
  [0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => ({
      position: cubiePosition(face, row, col),
      normal: FACE_NORMAL[face],
    })),
  ),
);

const key = (position: Vec, normal: Vec) => `${position}|${normal}`;
const byKey = new Map(STICKERS.map((s, i) => [key(s.position, s.normal), i]));

export function findSticker(position: Vec, normal: Vec): number {
  const index = byKey.get(key(position, normal));
  if (index === undefined) throw new Error(`No sticker at ${key(position, normal)}`);
  return index;
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Quarter turn clockwise as seen looking at the face from outside the cube. */
export function rotateClockwise(v: Vec, axis: Vec): Vec {
  const [ax, ay, az] = axis;
  const [x, y, z] = v;
  const d = dot(axis, v);
  // Rodrigues' formula for -90°: v' = -(axis × v) + axis (axis · v)
  return [-(ay * z - az * y) + ax * d, -(az * x - ax * z) + ay * d, -(ax * y - ay * x) + az * d];
}

/** Every sticker in the layer that turns with `face`. */
export function layerStickers(face: Face): number[] {
  const normal = FACE_NORMAL[face];
  return STICKERS.flatMap((s, i) => (dot(s.position, normal) === 1 ? [i] : []));
}

/** The face that shares an edge piece with the given (edge) sticker. */
export function neighbourFace(face: Face, row: number, col: number): Face {
  const { position, normal } = STICKERS[stickerIndex(face, row, col)];
  const other = FACES.find((f) => {
    const n = FACE_NORMAL[f];
    return dot(n, normal) === 0 && dot(n, position) === 1;
  });
  if (!other) throw new Error(`Sticker ${face}${row}${col} is not on an edge`);
  return other;
}
