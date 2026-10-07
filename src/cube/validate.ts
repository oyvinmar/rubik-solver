import { type Color, COLORS, type Face, FACE_COLOR, type Sticker, isComplete } from "./cube";

/**
 * Checks whether the entered stickers describe a cube that can actually be
 * solved, and explains what's wrong if not. Problems that can be pinned to
 * specific stickers carry their indices so the UI can highlight them.
 */

export type ProblemKind =
  | "blank"
  | "count"
  | "impossibleEdge"
  | "impossibleCorner"
  | "duplicateEdge"
  | "duplicateCorner"
  | "flippedEdge"
  | "twistedCorner"
  | "swappedPieces";

export interface Problem {
  kind: ProblemKind;
  message: string;
  stickers: number[];
}

// Kociemba's piece tables. Corners list their U/D sticker first, then go
// clockwise; edges list their U/D (or F/B for middle-layer edges) sticker first.
const CORNER_STICKERS = [
  [8, 9, 20], // URF
  [6, 18, 38], // UFL
  [0, 36, 47], // ULB
  [2, 45, 11], // UBR
  [29, 26, 15], // DFR
  [27, 44, 24], // DLF
  [33, 53, 42], // DBL
  [35, 17, 51], // DRB
] as const;

const CORNER_FACES: readonly (readonly [Face, Face, Face])[] = [
  ["U", "R", "F"],
  ["U", "F", "L"],
  ["U", "L", "B"],
  ["U", "B", "R"],
  ["D", "F", "R"],
  ["D", "L", "F"],
  ["D", "B", "L"],
  ["D", "R", "B"],
];

const EDGE_STICKERS = [
  [5, 10], // UR
  [7, 19], // UF
  [3, 37], // UL
  [1, 46], // UB
  [32, 16], // DR
  [28, 25], // DF
  [30, 43], // DL
  [34, 52], // DB
  [23, 12], // FR
  [21, 41], // FL
  [50, 39], // BL
  [48, 14], // BR
] as const;

const EDGE_FACES: readonly (readonly [Face, Face])[] = [
  ["U", "R"],
  ["U", "F"],
  ["U", "L"],
  ["U", "B"],
  ["D", "R"],
  ["D", "F"],
  ["D", "L"],
  ["D", "B"],
  ["F", "R"],
  ["F", "L"],
  ["B", "L"],
  ["B", "R"],
];

const OPPOSITE: Record<Color, Color> = {
  white: "yellow",
  yellow: "white",
  red: "orange",
  orange: "red",
  green: "blue",
  blue: "green",
};

const colorsOf = (faces: readonly Face[]) => faces.map((f) => FACE_COLOR[f]);
const pieceName = (colors: readonly Color[]) => colors.join("–");

export function validate(stickers: readonly Sticker[]): Problem[] {
  const problems: Problem[] = [];

  const blanks = stickers.flatMap((s, i) => (s === null ? [i] : []));
  if (blanks.length > 0) {
    problems.push({
      kind: "blank",
      message: `${blanks.length} ${blanks.length === 1 ? "sticker is" : "stickers are"} still blank.`,
      stickers: blanks,
    });
  }

  const counts = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<Color, number>;
  for (const s of stickers) if (s) counts[s]++;
  const wrongCounts = COLORS.filter((c) => (isComplete(stickers) ? counts[c] !== 9 : counts[c] > 9));
  if (wrongCounts.length > 0) {
    const counted = wrongCounts.map((c, i) =>
      i === 0 ? `${c} appears ${counts[c]} times` : `${c} ${counts[c]} times`,
    );
    problems.push({
      kind: "count",
      message: `Each colour should appear 9 times, but ${listJoin(counted)}.`,
      stickers: [],
    });
  }

  if (!isComplete(stickers)) return problems;

  const edges = identifyEdges(stickers);
  const corners = identifyCorners(stickers);
  problems.push(...pieceProblems(edges, "Edge"), ...pieceProblems(corners, "Corner"));
  if (problems.length > 0) return problems;

  // Every piece exists exactly once, so the remaining checks are about how
  // they're arranged — things that can't be pinned to one sticker.
  if (edges.reduce((sum, e) => sum + e.orientation!, 0) % 2 !== 0) {
    problems.push({
      kind: "flippedEdge",
      message:
        "An edge is flipped. Check that each edge's two colours are the right way round. If they are, an edge on the cube itself has been flipped.",
      stickers: [],
    });
  }
  if (corners.reduce((sum, c) => sum + c.orientation!, 0) % 3 !== 0) {
    problems.push({
      kind: "twistedCorner",
      message:
        "A corner is twisted. Check the order of the colours on each corner. If they're right, a corner on the cube itself has been twisted.",
      stickers: [],
    });
  }
  const edgeParity = permutationParity(edges.map((e) => e.piece!));
  const cornerParity = permutationParity(corners.map((c) => c.piece!));
  if (edgeParity !== cornerParity) {
    problems.push({
      kind: "swappedPieces",
      message: "Two pieces are swapped. Check whether the stickers of two edges or two corners have been mixed up.",
      stickers: [],
    });
  }
  return problems;
}

interface Slot {
  /** Index of the piece found in this slot, or null if no such piece exists. */
  piece: number | null;
  orientation: number | null;
  colors: Color[];
  stickers: number[];
}

function identifyEdges(stickers: readonly Color[]): Slot[] {
  return EDGE_STICKERS.map((slot) => {
    const colors = slot.map((i) => stickers[i]);
    for (let piece = 0; piece < EDGE_FACES.length; piece++) {
      const [a, b] = colorsOf(EDGE_FACES[piece]);
      if (colors[0] === a && colors[1] === b) return { piece, orientation: 0, colors, stickers: [...slot] };
      if (colors[0] === b && colors[1] === a) return { piece, orientation: 1, colors, stickers: [...slot] };
    }
    return { piece: null, orientation: null, colors, stickers: [...slot] };
  });
}

function identifyCorners(stickers: readonly Color[]): Slot[] {
  return CORNER_STICKERS.map((slot) => {
    const colors = slot.map((i) => stickers[i]);
    const orientation = colors.findIndex((c) => c === FACE_COLOR.U || c === FACE_COLOR.D);
    if (orientation !== -1) {
      const clockwise1 = colors[(orientation + 1) % 3];
      const clockwise2 = colors[(orientation + 2) % 3];
      for (let piece = 0; piece < CORNER_FACES.length; piece++) {
        const [, b, c] = colorsOf(CORNER_FACES[piece]);
        if (clockwise1 === b && clockwise2 === c && colors[orientation] === FACE_COLOR[CORNER_FACES[piece][0]]) {
          return { piece, orientation, colors, stickers: [...slot] };
        }
      }
    }
    return { piece: null, orientation: null, colors, stickers: [...slot] };
  });
}

function pieceProblems(slots: readonly Slot[], kind: "Edge" | "Corner"): Problem[] {
  const problems: Problem[] = [];
  const noun = kind.toLowerCase();

  for (const slot of slots) {
    if (slot.piece !== null) continue;
    problems.push({
      kind: `impossible${kind}`,
      message: `There's no ${noun} with ${impossibleReason(slot.colors)}.`,
      stickers: slot.stickers,
    });
  }

  const byPiece = Map.groupBy(
    slots.filter((s) => s.piece !== null),
    (s) => s.piece!,
  );
  for (const [piece, found] of byPiece) {
    if (found.length < 2) continue;
    const faces = kind === "Edge" ? EDGE_FACES[piece] : CORNER_FACES[piece];
    problems.push({
      kind: `duplicate${kind}`,
      message: `There are ${found.length} ${pieceName(colorsOf(faces))} ${noun}s, but the cube only has one.`,
      stickers: found.flatMap((s) => s.stickers),
    });
  }
  return problems;
}

function impossibleReason(colors: readonly Color[]): string {
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (colors[i] === colors[j]) return `two ${colors[i]} stickers`;
      if (OPPOSITE[colors[i]] === colors[j]) {
        return `both ${colors[i]} and ${colors[j]} (they're on opposite sides)`;
      }
    }
  }
  // All three colours are adjacent, but in mirror-image order.
  return `${pieceName(colors)} in this order`;
}

function listJoin(items: readonly string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function permutationParity(permutation: readonly number[]): number {
  let parity = 0;
  for (let i = 0; i < permutation.length; i++) {
    for (let j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) parity ^= 1;
    }
  }
  return parity;
}
