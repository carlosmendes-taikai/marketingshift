"use client";

import { useEffect, useRef, useState } from "react";

type State<T> = {
  status: "idle" | "loading" | "done" | "error";
  result: T | null;
  error: string | null;
  /** Jev said it's busy and the card is waiting to retry on its own. */
  busy?: boolean;
};

/** When Jev is overloaded, retry on our own this many times, a few seconds apart. */
const AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 4000;

// Survives the card remounting while you type, so a finished grade is not asked for twice.
const memory = new Map<string, unknown>();

/**
 * Ask /api/grade once the text stops changing. `request` is null until there is
 * something worth grading; pass `enabled: false` for ghost previews.
 */
export function useGrade<T>(request: object | null, enabled: boolean, delayMs = 900): State<T> & { retry: () => void } {
  const key = request ? JSON.stringify(request) : null;
  const [state, setState] = useState<State<T> & { key: string | null }>({ status: "idle", result: null, error: null, key: null });
  const [attempt, setAttempt] = useState(0);
  const retries = useRef(new Map<string, number>());

  useEffect(() => {
    if (!key || !enabled) return;
    if (memory.has(key)) return;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setState({ status: "loading", result: null, error: null, key });
      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: key,
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => ({}));
        const tries = retries.current.get(key) ?? 0;
        if (!res.ok && json.busy && tries < AUTO_RETRIES) {
          retries.current.set(key, tries + 1);
          setState({ status: "loading", result: null, error: null, key, busy: true });
          setTimeout(() => !ctrl.signal.aborted && setAttempt((n) => n + 1), RETRY_DELAY_MS * (tries + 1));
          return;
        }
        if (!res.ok) throw new Error(json.error ?? "Jev could not grade this right now.");
        memory.set(key, json);
        setState({ status: "done", result: json as T, error: null, key });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setState({ status: "error", result: null, error: err instanceof Error ? err.message : String(err), key });
      }
    }, delayMs);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [key, enabled, delayMs, attempt]);

  // Already graded (even by an earlier card) → answer straight from memory.
  // A result for older text reads as loading until the new one arrives.
  const cached = key ? (memory.get(key) as T | undefined) : undefined;
  const current = cached
    ? { status: "done" as const, result: cached, error: null }
    : state.key === key
      ? state
      : { status: key && enabled ? ("loading" as const) : ("idle" as const), result: null, error: null };
  return {
    ...current,
    retry: () => {
      if (key) retries.current.delete(key);
      setAttempt((n) => n + 1);
    },
  };
}
