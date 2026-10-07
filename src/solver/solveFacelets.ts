import { type Move, parseMoves } from "../cube/moves";
import min2phase from "./vendor/min2phase.js";

export function initSolver(): void {
  min2phase.initFull();
}

/** Synchronous and slow on first use — call from the worker, not the UI thread. */
export function solveFacelets(facelets: string): Move[] {
  const result = min2phase.solve(facelets);
  if (result.startsWith("Error")) throw new Error(`Solver rejected the cube (${result})`);
  return parseMoves(result);
}

export function randomFacelets(): string {
  return min2phase.randomCube();
}
