import { initSolver, solveFacelets } from "./solveFacelets";
import type { SolveRequest, SolveResponse } from "./solver";

// Build the pruning tables as soon as the worker starts, while the user is
// still entering colours.
initSolver();

self.onmessage = ({ data }: MessageEvent<SolveRequest>) => {
  let response: SolveResponse;
  try {
    response = { id: data.id, moves: solveFacelets(data.facelets) };
  } catch (error) {
    response = { id: data.id, error: error instanceof Error ? error.message : String(error) };
  }
  self.postMessage(response);
};
