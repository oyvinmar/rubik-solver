import { describe, expect, it } from "vitest";
import min2phase from "../solver/vendor/min2phase.js";
import {
  type Color,
  type Sticker,
  blankStickers,
  fromFaceletString,
  isSolved,
  solvedStickers,
  toFaceletString,
} from "./cube";
import { applyMoves, parseMoves, randomMoves } from "./moves";
import { validate } from "./validate";

const kinds = (stickers: readonly Sticker[]) => validate(stickers).map((p) => p.kind);
const swap = (stickers: readonly Color[], a: number, b: number) => {
  const copy = [...stickers];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
};
const scrambled = () => applyMoves(solvedStickers(), randomMoves(25));

describe("validate", () => {
  it("accepts a solved cube", () => {
    expect(validate(solvedStickers())).toEqual([]);
  });

  it("accepts any cube reached by turning faces", () => {
    for (let i = 0; i < 200; i++) expect(validate(scrambled())).toEqual([]);
  });

  it("reports blank stickers and highlights them", () => {
    const problems = validate(blankStickers());
    expect(problems).toHaveLength(1);
    expect(problems[0].kind).toBe("blank");
    expect(problems[0].stickers).toHaveLength(48);
  });

  it("reports colours used more than 9 times even while incomplete", () => {
    const stickers = blankStickers();
    // 8 on U, plus the R centre, plus one more on R = 10.
    for (let i = 0; i < 9; i++) if (i !== 4) stickers[i] = "red";
    stickers[12] = "red";
    expect(kinds(stickers)).toEqual(["blank", "count"]);
    expect(validate(stickers)[1].message).toContain("red appears 10");
  });

  it("reports an edge that can't exist (opposite colours)", () => {
    // UF edge = stickers 7 (U) and 19 (F). Make it white–yellow.
    const stickers = solvedStickers();
    stickers[19] = "yellow";
    stickers[28] = "green"; // keep counts right: DF edge's D sticker becomes green
    const problems = validate(stickers);
    const edge = problems.find((p) => p.kind === "impossibleEdge" && p.stickers.includes(19));
    expect(edge?.message).toContain("opposite sides");
  });

  it("reports a corner whose colours are in mirror-image order", () => {
    // Swap two stickers on the URF corner (U9=8, R1=9).
    const stickers = swap(solvedStickers(), 9, 20);
    const corner = validate(stickers).find((p) => p.kind === "impossibleCorner");
    expect(corner?.stickers.sort((a, b) => a - b)).toEqual([8, 9, 20]);
  });

  it("reports duplicate pieces", () => {
    // Copy the UF edge's colours onto the UR edge.
    const stickers = solvedStickers();
    stickers[5] = "white";
    stickers[10] = "green";
    expect(kinds(stickers)).toContain("duplicateEdge");
  });

  it("reports a flipped edge", () => {
    expect(kinds(swap(solvedStickers(), 7, 19))).toEqual(["flippedEdge"]);
  });

  it("reports a twisted corner", () => {
    // Rotate the URF corner's three stickers.
    const stickers = solvedStickers();
    [stickers[8], stickers[9], stickers[20]] = [stickers[20], stickers[8], stickers[9]];
    expect(kinds(stickers)).toEqual(["twistedCorner"]);
  });

  it("reports two swapped pieces", () => {
    // Swap the UF and UR edges, keeping each the right way round.
    const stickers = swap(swap(solvedStickers(), 7, 5), 19, 10);
    expect(kinds(stickers)).toEqual(["swappedPieces"]);
  });

  // min2phase is the more lenient of the two: it identifies a corner by its two
  // side colours and doesn't check whether the top/bottom sticker is white or
  // yellow. So we only require that anything we accept, it can solve.
  it("never accepts a cube that min2phase can't solve", () => {
    for (let i = 0; i < 1000; i++) {
      const cube = scrambled();
      const a = Math.floor(Math.random() * 54);
      const b = Math.floor(Math.random() * 54);
      if (a % 9 === 4 || b % 9 === 4) continue; // centres are fixed in the app
      const mutated = swap(cube, a, b);
      if (validate(mutated).length > 0) continue;
      const solution = min2phase.solve(toFaceletString(mutated));
      expect(solution, toFaceletString(mutated)).not.toMatch(/^Error/);
      expect(isSolved(applyMoves(mutated, parseMoves(solution)))).toBe(true);
    }
  });

  it("rejects a white sticker where only yellow fits, which min2phase misses", () => {
    const cube = "DULBUFUDLFLDDRFBULRRUFFLLLRDBDBDLUUFFUFDLRRRBBRRDBBUFB";
    expect(min2phase.solve(cube)).not.toMatch(/^Error/);
    expect(kinds(fromFaceletString(cube))).toEqual(["impossibleCorner", "impossibleCorner"]);
  });

  it("round-trips facelet strings", () => {
    const cube = applyMoves(solvedStickers(), parseMoves("R U F"));
    expect(fromFaceletString(toFaceletString(cube))).toEqual(cube);
  });
});
