import type { Dispatch } from "react";
import type { Action, AppState } from "../app/state";
import { COLORS, type Color, solvedStickers, stickerIndex } from "../cube/cube";
import { FACE_VIEWS } from "../cube/faceViews";
import { applyMoves, randomMoves } from "../cube/moves";
import { COLOR_HEX, COLOR_LABEL } from "../ui/colors";
import { HoldGuide } from "../ui/HoldGuide";
import { NetView } from "../ui/NetView";
import { Sticker } from "../ui/Sticker";

const DEBUG = new URLSearchParams(location.search).has("debug");

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export function EntryScreen({ state, dispatch }: Props) {
  const view = FACE_VIEWS[state.faceStep];
  const isLast = state.faceStep === FACE_VIEWS.length - 1;
  const used = Object.fromEntries(COLORS.map((c) => [c, state.stickers.filter((s) => s === c).length])) as Record<
    Color,
    number
  >;

  return (
    <div className="flex h-full flex-col gap-3 px-4 pt-3 pb-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Face {state.faceStep + 1} of {FACE_VIEWS.length}
          </p>
          <h1 className="text-xl font-semibold">Enter the {COLOR_LABEL[view.hold.front].toLowerCase()} face</h1>
        </div>
        <NetView
          stickers={state.stickers}
          activeFace={view.face}
          onFaceClick={(face) => dispatch({ type: "goToFace", faceStep: FACE_VIEWS.findIndex((v) => v.face === face) })}
          className="w-28 shrink-0"
        />
      </header>

      <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-2 dark:bg-slate-900">
        <HoldGuide hold={view.hold} className="size-14 shrink-0" />
        <p className="text-sm leading-snug">{view.instruction}</p>
      </div>

      <FaceGrid state={state} dispatch={dispatch} />

      <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Colour">
        {COLORS.map((color) => {
          const remaining = 9 - used[color];
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={state.selected === color}
              aria-label={`${COLOR_LABEL[color]}, ${remaining} left`}
              onClick={() => dispatch({ type: "select", color })}
              className={`relative aspect-square rounded-xl border border-black/10 transition ${
                state.selected === color
                  ? "scale-105 ring-4 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                  : ""
              }`}
              style={{ backgroundColor: COLOR_HEX[color] }}
            >
              <span
                className={`absolute -top-2 -right-2 grid size-6 place-items-center rounded-full text-xs font-bold ${
                  remaining < 0
                    ? "bg-red-600 text-white"
                    : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                }`}
              >
                {remaining}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex gap-3">
        <button
          type="button"
          disabled={state.faceStep === 0}
          onClick={() => dispatch({ type: "goToFace", faceStep: state.faceStep - 1 })}
          className="flex-1 rounded-xl bg-slate-200 py-3 font-semibold disabled:opacity-40 dark:bg-slate-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => dispatch(isLast ? { type: "review" } : { type: "goToFace", faceStep: state.faceStep + 1 })}
          className="flex-[2] rounded-xl bg-sky-600 py-3 font-semibold text-white"
        >
          {isLast ? "Check cube" : "Next face"}
        </button>
      </div>

      {DEBUG && (
        <button
          type="button"
          className="text-xs text-slate-500 underline"
          onClick={() => dispatch({ type: "load", stickers: applyMoves(solvedStickers(), randomMoves(25)) })}
        >
          Debug: random cube
        </button>
      )}
    </div>
  );
}

function FaceGrid({ state, dispatch }: Props) {
  const view = FACE_VIEWS[state.faceStep];
  const bar = (color: Color) => ({ backgroundColor: COLOR_HEX[color] });
  const barClass = "rounded-full ring-1 ring-black/15 dark:ring-white/20";
  // Square, and as large as the space left between the instructions and the palette.
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="grid aspect-square h-full max-h-80 max-w-full grid-cols-[0.5rem_1fr_0.5rem] grid-rows-[0.5rem_1fr_0.5rem] gap-1.5">
        <span className={`col-start-2 ${barClass}`} style={bar(view.edges.top)} aria-hidden />
        <span className={`col-start-1 row-start-2 ${barClass}`} style={bar(view.edges.left)} aria-hidden />
        <div className="col-start-2 row-start-2 grid grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl bg-slate-900 p-1.5">
          {[0, 1, 2].flatMap((row) =>
            [0, 1, 2].map((col) => {
              const index = stickerIndex(view.face, row, col);
              const center = row === 1 && col === 1;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={center}
                  onClick={() => dispatch({ type: "paint", index })}
                  aria-label={
                    center ? "Centre (fixed)" : `Row ${row + 1}, column ${col + 1}: ${state.stickers[index] ?? "blank"}`
                  }
                  className="min-h-0"
                >
                  <Sticker color={state.stickers[index]} />
                </button>
              );
            }),
          )}
        </div>
        <span className={`col-start-3 row-start-2 ${barClass}`} style={bar(view.edges.right)} aria-hidden />
        <span className={`col-start-2 row-start-3 ${barClass}`} style={bar(view.edges.bottom)} aria-hidden />
      </div>
      <p className="sr-only">
        Bordered by {view.edges.top} above, {view.edges.right} right, {view.edges.bottom} below and {view.edges.left}{" "}
        left.
      </p>
    </div>
  );
}
