import { describe, expect, it } from "vitest";
import { FACES, type Face, isSolved, solvedStickers, stickerIndex } from "./cube";
import { describeMove } from "./describe";
import { STICKERS } from "./geometry";
import { applyMove, applyMoves, formatMoves, invertMoves, parseMoves, randomMoves } from "./moves";

const numbered = Array.from({ length: 54 }, (_, i) => i);
const faceOfNormal = (index: number): Face =>
  FACES.find((f) => STICKERS[stickerIndex(f, 1, 1)].normal.join() === STICKERS[index].normal.join())!;

describe("applyMove", () => {
  it.each(FACES)("four quarter turns of %s are the identity", (face) => {
    expect(applyMoves(numbered, parseMoves(`${face} ${face} ${face} ${face}`))).toEqual(numbered);
  });

  it.each(FACES)("%s moves 20 stickers and leaves the opposite face alone", (face) => {
    const moved = applyMove(numbered, { face, turns: 1 });
    expect(moved.filter((s, i) => s !== i)).toHaveLength(20);
  });

  it("the sexy move repeated six times is the identity", () => {
    expect(applyMoves(numbered, parseMoves("R U R' U' ".repeat(6)))).toEqual(numbered);
  });

  it("a move followed by its inverse is the identity", () => {
    const moves = randomMoves(30);
    expect(applyMoves(numbered, [...moves, ...invertMoves(moves)])).toEqual(numbered);
  });

  it("scrambles a solved cube and the inverse solves it", () => {
    const moves = randomMoves(25);
    const scrambled = applyMoves(solvedStickers(), moves);
    expect(isSolved(scrambled)).toBe(false);
    expect(isSolved(applyMoves(scrambled, invertMoves(moves)))).toBe(true);
  });
});

describe("parseMoves / formatMoves", () => {
  it("round-trips notation and tolerates extra whitespace (min2phase pads moves)", () => {
    expect(formatMoves(parseMoves("U  R2 F' D L2 B' "))).toBe("U R2 F' D L2 B'");
  });

  it("rejects things that aren't moves", () => {
    expect(() => parseMoves("R x")).toThrow();
  });

  it("parses an empty solution", () => {
    expect(parseMoves("")).toEqual([]);
  });
});

describe("describeMove matches what the move actually does", () => {
  // Track where one sticker goes and check the description says the same.
  const cases: [notation: string, from: [Face, number, number], toFace: Face, description: string][] = [
    ["U", ["F", 0, 1], "L", "Top layer: front row moves left"],
    ["U'", ["F", 0, 1], "R", "Top layer: front row moves right"],
    ["D", ["F", 2, 1], "R", "Bottom layer: front row moves right"],
    ["D'", ["F", 2, 1], "L", "Bottom layer: front row moves left"],
    ["R", ["F", 1, 2], "U", "Right side: front moves up"],
    ["R'", ["F", 1, 2], "D", "Right side: front moves down"],
    ["L", ["F", 1, 0], "D", "Left side: front moves down"],
    ["L'", ["F", 1, 0], "U", "Left side: front moves up"],
    ["F", ["U", 2, 1], "R", "Front face: turn clockwise"],
    ["F'", ["U", 2, 1], "L", "Front face: turn anticlockwise"],
    ["B", ["U", 0, 1], "L", "Back layer: top row moves left"],
    ["B'", ["U", 0, 1], "R", "Back layer: top row moves right"],
  ];

  it.each(cases)("%s", (notation, [face, row, col], toFace, description) => {
    const [move] = parseMoves(notation);
    const tracked = stickerIndex(face, row, col);
    const after = applyMove(numbered, move);
    expect(faceOfNormal(after.indexOf(tracked))).toBe(toFace);
    expect(describeMove(move)).toBe(description);
  });

  it("describes half turns", () => {
    expect(describeMove({ face: "B", turns: 2 })).toBe("Back layer: half turn, either way");
  });
});
