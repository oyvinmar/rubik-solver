import { beforeAll, describe, expect, it } from "vitest";
import { fromFaceletString, isSolved, solvedStickers, toFaceletString } from "../cube/cube";
import { applyMoves, randomMoves } from "../cube/moves";
import { initSolver, randomFacelets, solveFacelets } from "./solveFacelets";

beforeAll(() => initSolver());

describe("solveFacelets", () => {
  it("solves random scrambles: scramble → solve → apply → solved", () => {
    for (let i = 0; i < 100; i++) {
      const scrambled = applyMoves(solvedStickers(), randomMoves(25));
      const solution = solveFacelets(toFaceletString(scrambled));
      expect(solution.length).toBeLessThanOrEqual(21);
      expect(isSolved(applyMoves(scrambled, solution))).toBe(true);
    }
  });

  it("solves uniformly random states", () => {
    for (let i = 0; i < 50; i++) {
      const cube = fromFaceletString(randomFacelets());
      expect(isSolved(applyMoves(cube, solveFacelets(toFaceletString(cube))))).toBe(true);
    }
  });

  it("returns no moves for a solved cube", () => {
    expect(solveFacelets(toFaceletString(solvedStickers()))).toEqual([]);
  });

  it("throws for an unsolvable cube", () => {
    const stickers = solvedStickers();
    [stickers[7], stickers[19]] = [stickers[19], stickers[7]];
    expect(() => solveFacelets(toFaceletString(stickers))).toThrow(/Error 3/);
  });
});
