import { type Color, type Sticker, blankStickers, isCenter } from "../cube/cube";
import { FACE_VIEWS } from "../cube/faceViews";
import type { Move } from "../cube/moves";

export type Screen = "entry" | "review" | "solution";

export interface AppState {
  screen: Screen;
  stickers: Sticker[];
  /** Which face is being entered, as an index into FACE_VIEWS. */
  faceStep: number;
  selected: Color;
  solution: Move[] | null;
  /** Index of the move the user is on; equals solution.length when done. */
  step: number;
}

export type Action =
  | { type: "select"; color: Color }
  | { type: "paint"; index: number }
  | { type: "goToFace"; faceStep: number }
  | { type: "review" }
  | { type: "solved"; solution: Move[] }
  | { type: "setStep"; step: number }
  | { type: "load"; stickers: Sticker[] }
  | { type: "restore"; state: AppState }
  | { type: "reset" };

export function initialState(): AppState {
  return { screen: "entry", stickers: blankStickers(), faceStep: 0, selected: "white", solution: null, step: 0 };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.color };
    case "paint": {
      if (isCenter(action.index)) return state;
      const stickers = [...state.stickers];
      stickers[action.index] = stickers[action.index] === state.selected ? null : state.selected;
      return { ...state, stickers, solution: null, step: 0 };
    }
    case "goToFace":
      return { ...state, screen: "entry", faceStep: clamp(action.faceStep, 0, FACE_VIEWS.length - 1) };
    case "review":
      return { ...state, screen: "review" };
    case "solved":
      return { ...state, screen: "solution", solution: action.solution, step: 0 };
    case "setStep":
      if (!state.solution) return state;
      return { ...state, step: clamp(action.step, 0, state.solution.length) };
    case "load":
      return { ...initialState(), screen: "review", stickers: action.stickers };
    case "restore":
      return action.state;
    case "reset":
      return initialState();
  }
}

/** Whether there's anything worth offering to resume. */
export function hasProgress(state: AppState): boolean {
  if (state.solution && state.step >= state.solution.length) return false;
  return state.stickers.some((s, i) => s !== null && !isCenter(i));
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
