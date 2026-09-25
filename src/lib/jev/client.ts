import "server-only";
import { experimental_evaluate as evaluate } from "ai";
import { questions, QUESTION_COUNT } from "./questions";
import type { Answer, IntentResult } from "./types";

const MODEL = process.env.JEV_MODEL || "typesafe-ai/jev";
// One fast attempt: a stale answer is worse than falling back to the mock.
const TIMEOUT_MS = 3000;

let warned = false;

/** A real-looking key: not empty and not a copied placeholder like "sk-..." or "your-key-here". */
export function looksLikeKey(key: string | undefined): key is string {
  const k = key?.trim() ?? "";
  return k.length >= 12 && !/\.\.\.|your|xxx|placeholder|changeme|<|>/i.test(k);
}

/**
 * Offline by default. Jev runs through the Vercel AI Gateway when an AI Gateway key is set
 * (or, on Vercel, when the project's OIDC token is available). NEXT_PUBLIC_USE_MOCK=true
 * can still force offline for UI work and demos.
 */
export function classifierMode(): { mode: "online" | "offline"; reason: string } {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return { mode: "offline", reason: "NEXT_PUBLIC_USE_MOCK=true" };
  if (!looksLikeKey(process.env.AI_GATEWAY_API_KEY) && !process.env.VERCEL_OIDC_TOKEN) {
    return { mode: "offline", reason: "no AI_GATEWAY_API_KEY set" };
  }
  return { mode: "online", reason: `using ${MODEL} via AI Gateway` };
}

export function warnMockOnce(reason: string) {
  if (warned) return;
  warned = true;
  console.info(`[unfold] Offline classifier (jev-offline): ${reason}. Add an AI Gateway key to .env.local to go online.`);
}

/** 1 when all probability sits on one option, 0 when it is spread evenly. Used if the gateway reports no confidence. */
function concentration(probabilities: Record<string, number> | undefined) {
  const values = Object.values(probabilities ?? {});
  if (values.length < 2) return 0;
  const peak = Math.max(...values);
  return Math.max(0, Math.min(1, (values.length * peak - 1) / (values.length - 1)));
}

/** One call, every question in parallel. Throws on network / API errors and timeouts. */
export async function classifyWithJev(text: string, signal?: AbortSignal): Promise<IntentResult> {
  const started = performance.now();
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await evaluate({
    model: MODEL,
    state: { text },
    questions,
    maxRetries: 0,
    abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const latencyMs = Math.round(performance.now() - started);
  const a = res.answers;
  const reported = res.providerMetadata?.typesafe?.confidence as Record<string, number> | undefined;
  const confidence = (id: keyof typeof questions, probabilities?: Record<string, number>) =>
    reported?.[id] ?? concentration(probabilities);

  function answer<T extends string>(id: keyof typeof questions, r: { choice: T; probabilities?: Record<T, number> }): Answer<T> {
    const probabilities = r.probabilities ?? ({ [r.choice]: 1 } as Record<T, number>);
    return { value: r.choice, confidence: confidence(id, probabilities), probabilities: { ...probabilities } };
  }

  return {
    intent: answer("intent", a.intent),
    readiness: a.readiness.score,
    signals: {
      recurring: a.recurring.probability,
      urgency: { score: a.urgency.score, confidence: confidence("urgency", a.urgency.probabilities) },
      eventMode: answer("eventMode", a.eventMode),
      timerKind: answer("timerKind", a.timerKind),
      isShoppingList: a.isShoppingList.probability,
      contentFormat: answer("contentFormat", a.contentFormat),
    },
    latencyMs,
    questionCount: QUESTION_COUNT,
    model: res.response.modelId || MODEL,
    source: "jev",
  };
}
