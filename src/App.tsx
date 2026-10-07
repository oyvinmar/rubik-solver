import { useEffect, useReducer, useState } from "react";
import { type AppState, hasProgress, initialState, reducer } from "./app/state";
import { loadState, saveState, startSession } from "./app/storage";
import { isCenter } from "./cube/cube";
import { EntryScreen } from "./screens/EntryScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { SolutionScreen } from "./screens/SolutionScreen";
import { warmUpSolver } from "./solver/solver";
import { InstallHint } from "./ui/InstallHint";

interface Startup {
  state: AppState;
  /** Saved progress to offer resuming, on a fresh launch. */
  offer: AppState | null;
}

function startup(): Startup {
  const saved = loadState();
  const freshLaunch = startSession();
  if (!saved || !hasProgress(saved)) return { state: initialState(), offer: null };
  // A reload within the same session (e.g. after an update) resumes silently.
  return freshLaunch ? { state: initialState(), offer: saved } : { state: saved, offer: null };
}

export function App() {
  const [{ state: firstState, offer: firstOffer }] = useState(startup);
  const [state, dispatch] = useReducer(reducer, firstState);
  const [offer, setOffer] = useState(firstOffer);

  useEffect(() => warmUpSolver(), []);
  useEffect(() => {
    // Don't overwrite the saved solve until the user has chosen.
    if (!offer) saveState(state);
  }, [state, offer]);

  return (
    <main className="mx-auto flex h-full max-w-md flex-col">
      {!offer && <InstallHint />}
      <div className="min-h-0 flex-1">
        {state.screen === "entry" && <EntryScreen state={state} dispatch={dispatch} />}
        {state.screen === "review" && <ReviewScreen state={state} dispatch={dispatch} />}
        {state.screen === "solution" && state.solution && (
          <SolutionScreen state={{ ...state, solution: state.solution }} dispatch={dispatch} />
        )}
      </div>
      {offer && (
        <ResumePrompt
          saved={offer}
          onResume={() => {
            dispatch({ type: "restore", state: offer });
            setOffer(null);
          }}
          onDiscard={() => setOffer(null)}
        />
      )}
    </main>
  );
}

function ResumePrompt({
  saved,
  onResume,
  onDiscard,
}: {
  saved: AppState;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const entered = saved.stickers.filter((s, i) => s !== null && !isCenter(i)).length;
  const detail = saved.solution
    ? `You were on move ${saved.step + 1} of ${saved.solution.length}.`
    : `You'd entered ${entered} of 48 stickers.`;

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-6"
      role="dialog"
      aria-modal
      aria-labelledby="resume-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 id="resume-title" className="text-lg font-semibold">
          Pick up where you left off?
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-xl bg-slate-200 py-3 font-semibold dark:bg-slate-800"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={onResume}
            className="flex-1 rounded-xl bg-sky-600 py-3 font-semibold text-white"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
