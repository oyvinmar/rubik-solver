import { FACES, type Face, STICKER_COUNT } from "./cube";
import { FACE_NORMAL, STICKERS, findSticker, layerStickers, rotateClockwise } from "./geometry";

/** `turns` counts clockwise quarter turns: 1 = R, 2 = R2, 3 = R'. */
export interface Move {
  face: Face;
  turns: 1 | 2 | 3;
}

/** QUARTER_TURN[face][to] = from, for a clockwise quarter turn of `face`. */
const QUARTER_TURN = Object.fromEntries(
  FACES.map((face) => {
    const axis = FACE_NORMAL[face];
    const perm = Array.from({ length: STICKER_COUNT }, (_, i) => i);
    for (const from of layerStickers(face)) {
      const { position, normal } = STICKERS[from];
      perm[findSticker(rotateClockwise(position, axis), rotateClockwise(normal, axis))] = from;
    }
    return [face, perm];
  }),
) as Record<Face, number[]>;

export function applyMove<T>(stickers: readonly T[], move: Move): T[] {
  let result = [...stickers];
  for (let i = 0; i < move.turns; i++) {
    const before = result;
    result = QUARTER_TURN[move.face].map((from) => before[from]);
  }
  return result;
}

export function applyMoves<T>(stickers: readonly T[], moves: readonly Move[]): T[] {
  return moves.reduce<T[]>((s, move) => applyMove(s, move), [...stickers]);
}

const MOVE_PATTERN = /^([URFDLB])(2|')?$/;

/** Parses standard notation such as "R U2 F'". Whitespace-tolerant. */
export function parseMoves(text: string): Move[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = MOVE_PATTERN.exec(token);
      if (!match) throw new Error(`Not a move: "${token}"`);
      const turns = match[2] === "2" ? 2 : match[2] === "'" ? 3 : 1;
      return { face: match[1] as Face, turns };
    });
}

export function formatMove({ face, turns }: Move): string {
  return face + (turns === 2 ? "2" : turns === 3 ? "'" : "");
}

export function formatMoves(moves: readonly Move[]): string {
  return moves.map(formatMove).join(" ");
}

export function invertMoves(moves: readonly Move[]): Move[] {
  return moves.map(({ face, turns }) => ({ face, turns: (4 - turns) as Move["turns"] })).reverse();
}

export function randomMoves(count: number, random = Math.random): Move[] {
  const moves: Move[] = [];
  while (moves.length < count) {
    const face = FACES[Math.floor(random() * FACES.length)];
    if (face === moves.at(-1)?.face) continue;
    moves.push({ face, turns: (1 + Math.floor(random() * 3)) as Move["turns"] });
  }
  return moves;
}
