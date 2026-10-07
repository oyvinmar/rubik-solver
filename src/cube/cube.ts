/**
 * The cube is stored as 54 stickers in Kociemba facelet order: faces U, R, F,
 * D, L, B, and within each face rows top to bottom, columns left to right as
 * seen when looking straight at that face:
 *
 *   U is seen from above with B at the top edge.
 *   R, F, L, B are seen from the side with U at the top edge.
 *   D is seen from below with F at the top edge.
 *
 * This is the layout min2phase expects, and also the layout of the familiar
 * unfolded cross-shaped net (U above F, L F R B in a row, D below F).
 */

export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type Face = (typeof FACES)[number];

export const COLORS = ["white", "red", "green", "yellow", "orange", "blue"] as const;
export type Color = (typeof COLORS)[number];

/** A sticker is blank until the user has entered its colour. */
export type Sticker = Color | null;

/** Standard Western scheme, held with white on top and green facing you. */
export const FACE_COLOR: Record<Face, Color> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};

export const COLOR_FACE = Object.fromEntries(FACES.map((face) => [FACE_COLOR[face], face])) as Record<Color, Face>;

export const STICKER_COUNT = 54;

export function stickerIndex(face: Face, row: number, col: number): number {
  return FACES.indexOf(face) * 9 + row * 3 + col;
}

export function faceOf(index: number): Face {
  return FACES[Math.floor(index / 9)];
}

export function isCenter(index: number): boolean {
  return index % 9 === 4;
}

export function solvedStickers(): Color[] {
  return FACES.flatMap((face) => Array<Color>(9).fill(FACE_COLOR[face]));
}

/** A cube with only the (fixed) centres filled in. */
export function blankStickers(): Sticker[] {
  return solvedStickers().map((color, i) => (isCenter(i) ? color : null));
}

export function isComplete(stickers: readonly Sticker[]): stickers is Color[] {
  return stickers.every((s) => s !== null);
}

export function isSolved(stickers: readonly Sticker[]): boolean {
  return stickers.every((s, i) => s === FACE_COLOR[faceOf(i)]);
}

/** e.g. "UUUUUUUUURRR…" — the input format for min2phase. */
export function toFaceletString(stickers: readonly Color[]): string {
  return stickers.map((color) => COLOR_FACE[color]).join("");
}

export function fromFaceletString(facelets: string): Color[] {
  return [...facelets].map((letter) => FACE_COLOR[letter as Face]);
}
