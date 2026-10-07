import { type Color, toFaceletString } from "../cube/cube";
import type { Move } from "../cube/moves";

export interface SolveRequest {
  id: number;
  facelets: string;
}

export type SolveResponse = { id: number; moves: Move[] } | { id: number; error: string };

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (response: SolveResponse) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<SolveResponse>) => {
      pending.get(data.id)?.(data);
      pending.delete(data.id);
    };
  }
  return worker;
}

/** Starts the worker so its tables are ready by the time the user hits Solve. */
export function warmUpSolver(): void {
  getWorker();
}

/** Expects a cube that has already passed `validate`. */
export function solve(stickers: readonly Color[]): Promise<Move[]> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (response) => ("error" in response ? reject(new Error(response.error)) : resolve(response.moves)));
    getWorker().postMessage({ id, facelets: toFaceletString(stickers) } satisfies SolveRequest);
  });
}
