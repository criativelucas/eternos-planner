import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Calls `save(value)` after `delay` ms whenever `value` changes and `enabled` is true.
 * Pending saves are flushed (not discarded) on unmount.
 * `save` must resolve to false (or throw) when persistence failed.
 */
export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<boolean | void>,
  delay = 600,
  enabled = true,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const run = async (v: T) => {
    pending.current = null;
    try {
      const ok = await saveRef.current(v);
      if (ok === false) { setStatus("error"); return; }
      setStatus("saved");
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  };

  const key = JSON.stringify(value);
  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    pending.current = value;
    setStatus("saving");
    timer.current = window.setTimeout(() => run(value), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // Flush on unmount
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (pending.current !== null) saveRef.current(pending.current);
  }, []);

  return status;
}
