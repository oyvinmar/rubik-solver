import { type Dispatch, useEffect, useState } from "react";
import type { Action, AppState } from "../app/state";
import { useWakeLock } from "../app/useWakeLock";
import { describeMove } from "../cube/describe";
import { HOME_HOLD } from "../cube/faceViews";
import { formatMove } from "../cube/moves";
import { CubePlayer } from "../player/CubePlayer";
import { HoldGuide } from "../ui/HoldGuide";

const SPEEDS = [
  { label: "Slow", ms: 3000 },
  { label: "Normal", ms: 2000 },
  { label: "Fast", ms: 1000 },
] as const;

interface Props {
  state: AppState & { solution: NonNullable<AppState["solution"]> };
  dispatch: Dispatch<Action>;
}

export function SolutionScreen({ state, dispatch }: Props) {
  const { solution, step } = state;
  const done = step >= solution.length;
  const move = solution[step];
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [replayKey, setReplayKey] = useState(0);

  useWakeLock(!done);

  useEffect(() => {
    if (!autoplay || done) return;
    const timer = setTimeout(() => dispatch({ type: "setStep", step: step + 1 }), SPEEDS[speed].ms);
    return () => clearTimeout(timer);
  }, [autoplay, done, speed, step, dispatch]);

  const next = () => dispatch({ type: "setStep", step: step + 1 });
  const back = () => {
    setAutoplay(false);
    dispatch({ type: "setStep", step: step - 1 });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 px-4 pt-3">
        <HoldGuide hold={HOME_HOLD} className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{done ? "Solved!" : `Move ${step + 1} of ${solution.length}`}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width]"
              style={{ width: `${(Math.min(step + 1, solution.length) / solution.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">White on top, green facing you</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (done || confirm("Start over with a new cube?")) dispatch({ type: "reset" });
          }}
          className="rounded-lg px-2 py-1 text-sm text-slate-500 dark:text-slate-400"
        >
          Start over
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <CubePlayer moves={solution} position={Math.min(step + 1, solution.length)} replayKey={replayKey} />
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-4 px-4 pb-6">
          <p className="text-3xl font-bold">Solved! 🎉</p>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={back}
              className="flex-1 rounded-xl bg-slate-200 py-3 font-semibold dark:bg-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "reset" })}
              className="flex-[2] rounded-xl bg-sky-600 py-3 font-semibold text-white"
            >
              Solve another cube
            </button>
          </div>
          <a href="/third-party-notices.txt" className="text-xs text-slate-500 underline dark:text-slate-400">
            Credits and licences
          </a>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={next}
            className="mx-4 flex min-h-[38svh] flex-col items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 active:bg-slate-200 dark:bg-slate-900 dark:active:bg-slate-800"
          >
            <span className="text-7xl font-bold tracking-tight">{formatMove(move)}</span>
            <span className="text-center text-lg">{describeMove(move)}</span>
            <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {step + 1 < solution.length ? `Then ${formatMove(solution[step + 1])} · ` : "Last move · "}
              Tap for the next move
            </span>
          </button>

          <div className="flex items-center gap-2 px-4 pt-3 pb-4">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="rounded-xl bg-slate-200 px-4 py-3 font-semibold disabled:opacity-40 dark:bg-slate-800"
              aria-label="Previous move"
            >
              ◀ Back
            </button>
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="rounded-xl bg-slate-200 px-4 py-3 font-semibold dark:bg-slate-800"
              aria-label="Show this move again"
            >
              ↻
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSpeed((s) => (s + 1) % SPEEDS.length)}
                className="rounded-xl px-3 py-3 text-sm text-slate-500 dark:text-slate-400"
                aria-label={`Autoplay speed: ${SPEEDS[speed].label}`}
              >
                {SPEEDS[speed].label}
              </button>
              <button
                type="button"
                onClick={() => setAutoplay((a) => !a)}
                className={`rounded-xl px-4 py-3 font-semibold ${
                  autoplay ? "bg-sky-600 text-white" : "bg-slate-200 dark:bg-slate-800"
                }`}
                aria-pressed={autoplay}
              >
                {autoplay ? "❚❚ Pause" : "▶ Auto"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
