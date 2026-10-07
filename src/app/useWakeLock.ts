import { useEffect } from "react";

/** Keeps the screen on while `active`. Silently does nothing where unsupported. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // Denied, e.g. low battery mode. The screen may lock; that's all.
      }
    };
    // The lock is dropped whenever the page is hidden, so take it again on return.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
