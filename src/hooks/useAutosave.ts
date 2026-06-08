import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * Calls `save(value)` after `delay` ms whenever `value` changes.
 * Skips the first run (initial mount).
 */
export function useAutosave<T>(value: T, save: (v: T) => void | Promise<void>, delay = 600) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRun = useRef(true);
  const timer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    setStatus("saving");
    timer.current = window.setTimeout(async () => {
      try {
        await save(value);
        setStatus("saved");
        if (savedTimer.current) window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(() => setStatus("idle"), 1500);
      } catch {
        setStatus("idle");
      }
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  return status;
}
