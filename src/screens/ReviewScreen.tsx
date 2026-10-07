import { type Dispatch, useMemo, useState } from "react";
import type { Action, AppState } from "../app/state";
import { isComplete } from "../cube/cube";
import { FACE_VIEWS } from "../cube/faceViews";
import { validate } from "../cube/validate";
import { solve } from "../solver/solver";
import { NetView } from "../ui/NetView";

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

type SolveStatus =
  { kind: "idle" } | { kind: "solving" } | { kind: "alreadySolved" } | { kind: "failed"; message: string };

export function ReviewScreen({ state, dispatch }: Props) {
  const problems = useMemo(() => validate(state.stickers), [state.stickers]);
  const highlighted = useMemo(() => new Set(problems.flatMap((p) => p.stickers)), [problems]);
  const [status, setStatus] = useState<SolveStatus>({ kind: "idle" });

  async function onSolve() {
    if (problems.length > 0 || !isComplete(state.stickers)) return;
    setStatus({ kind: "solving" });
    try {
      const solution = await solve(state.stickers);
      if (solution.length === 0) setStatus({ kind: "alreadySolved" });
      else dispatch({ type: "solved", solution });
    } catch (error) {
      setStatus({ kind: "failed", message: error instanceof Error ? error.message : String(error) });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-3 pb-4">
      <header>
        <h1 className="text-xl font-semibold">Check your cube</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tap a face to fix it.</p>
      </header>

      <NetView
        stickers={state.stickers}
        highlighted={highlighted}
        gap="gap-0.5"
        onFaceClick={(face) => dispatch({ type: "goToFace", faceStep: FACE_VIEWS.findIndex((v) => v.face === face) })}
        className="w-full"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {problems.length > 0 ? (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {problems.map((problem, i) => (
              <li
                key={i}
                className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
              >
                {problem.message}
                {problem.stickers.length > 0 && problem.kind !== "blank" && (
                  <span className="text-amber-700 dark:text-amber-300"> The stickers are outlined above.</span>
                )}
              </li>
            ))}
          </ul>
        ) : status.kind === "alreadySolved" ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            This cube is already solved.
          </p>
        ) : status.kind === "failed" ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            Something went wrong while solving: {status.message}
          </p>
        ) : (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            Everything checks out.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "goToFace", faceStep: state.faceStep })}
          className="flex-1 rounded-xl bg-slate-200 py-3 font-semibold dark:bg-slate-800"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={problems.length > 0 || status.kind === "solving"}
          onClick={onSolve}
          className="flex-[2] rounded-xl bg-sky-600 py-3 font-semibold text-white disabled:opacity-40"
        >
          {status.kind === "solving" ? "Solving…" : "Solve"}
        </button>
      </div>
    </div>
  );
}
