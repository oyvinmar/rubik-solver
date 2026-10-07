import { useState } from "react";

const DISMISSED_KEY = "rubik-solver/install-hint-dismissed";

function shouldShow(): boolean {
  const iOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    matchMedia("(display-mode: standalone)").matches;
  return iOS && !installed && localStorage.getItem(DISMISSED_KEY) === null;
}

/** Safari never offers to install a web app, so say how. Shown once. */
export function InstallHint() {
  const [visible, setVisible] = useState(shouldShow);
  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="mx-3 mt-2 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white dark:bg-slate-100 dark:text-slate-900">
      <p className="flex-1">
        Install this app: tap{" "}
        <svg
          viewBox="0 0 24 24"
          className="inline size-5 -translate-y-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-label="Share"
        >
          <path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" />
        </svg>{" "}
        <b>Share</b>, then <b>Add to Home Screen</b>. It works offline.
      </p>
      <button type="button" onClick={dismiss} className="rounded-lg px-3 py-2 font-semibold" aria-label="Dismiss">
        OK
      </button>
    </div>
  );
}
