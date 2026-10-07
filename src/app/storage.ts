import { COLORS, STICKER_COUNT } from "../cube/cube";
import { FACE_VIEWS } from "../cube/faceViews";
import type { AppState } from "./state";

const KEY = "rubik-solver/v1";
// sessionStorage survives reloads (including the automatic one after an
// update) but not a fresh launch, which is when we ask before resuming.
const SESSION_KEY = "rubik-solver/session";

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): resuming just won't work.
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as AppState;
    return isValid(state) ? state : null;
  } catch {
    return null;
  }
}

/** True on the first load of this session (app launch or new tab). */
export function startSession(): boolean {
  const fresh = sessionStorage.getItem(SESSION_KEY) === null;
  sessionStorage.setItem(SESSION_KEY, "1");
  return fresh;
}

function isValid(state: AppState): boolean {
  return (
    ["entry", "review", "solution"].includes(state.screen) &&
    Array.isArray(state.stickers) &&
    state.stickers.length === STICKER_COUNT &&
    state.stickers.every((s) => s === null || COLORS.includes(s)) &&
    COLORS.includes(state.selected) &&
    Number.isInteger(state.faceStep) &&
    state.faceStep >= 0 &&
    state.faceStep < FACE_VIEWS.length &&
    Number.isInteger(state.step) &&
    (state.solution === null || Array.isArray(state.solution)) &&
    (state.screen !== "solution" || state.solution !== null)
  );
}
