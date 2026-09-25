"use client";

import { useEffect, useRef } from "react";

type Step = { text: string; then?: string };

export const DEMO_SCRIPT: Step[] = [
  { text: "linkedin campaign spring launch", then: " acme.com/launch" },
  { text: "post about how we doubled our newsletter signups" },
  { text: "met Ana from Acme, interested in a product demo" },
  { text: "linkedin ads 500 spent, 12k impressions, 340 clicks, 25 leads" },
  { text: "promote our spring webinar on nov 15" },
  { text: 'subject: "Your monthly recap" vs "3 ideas that doubled our signups"' },
  { text: "call with the design team tuesday 3pm", then: " on meet" },
  { text: "remind me to send the newsletter friday urgent" },
  { text: "launch checklist: brief, visuals, landing page, emails" },
  { text: "3pm lisbon in new york" },
];

export type DemoApi = {
  getText: () => string;
  setText: (t: string) => void;
  /** Complete the current card; returns false if there's nothing to complete. */
  complete: () => boolean;
  clear: () => void;
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

const jitter = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** ?demo=1 types a scripted sequence at human speed; &loop=1 repeats it forever. */
export function useDemoScript(enabled: boolean, loop: boolean, api: DemoApi) {
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const type = async (s: string) => {
      let current = apiRef.current.getText();
      for (const ch of s) {
        current += ch;
        apiRef.current.setText(current);
        await sleep(ch === " " ? jitter(110, 200) : jitter(45, 90), signal);
      }
    };

    (async () => {
      await sleep(900, signal);
      do {
        for (const step of DEMO_SCRIPT) {
          await type(step.text);
          if (step.then) {
            await sleep(1100, signal);
            await type(step.then);
          }
          await sleep(1400, signal);
          if (!apiRef.current.complete()) {
            await sleep(600, signal);
            if (!apiRef.current.complete()) apiRef.current.clear();
          }
          await sleep(750, signal);
        }
        if (loop) await sleep(1200, signal);
      } while (loop && !signal.aborted);
    })().catch(() => {});

    return () => ctrl.abort();
  }, [enabled, loop]);

  // Hide the cursor after 2s idle so recordings stay clean.
  useEffect(() => {
    if (!enabled) return;
    let id: ReturnType<typeof setTimeout>;
    const wake = () => {
      document.body.classList.remove("demo-idle");
      clearTimeout(id);
      id = setTimeout(() => document.body.classList.add("demo-idle"), 2000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      clearTimeout(id);
      window.removeEventListener("mousemove", wake);
      document.body.classList.remove("demo-idle");
    };
  }, [enabled]);
}
