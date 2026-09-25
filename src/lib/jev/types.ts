import { z } from "zod";

export const INTENT_KEYS = [
  "utm",
  "idea",
  "lead",
  "event",
  "reminder",
  "todo",
  "timer",
  "calc",
  "contact",
  "link",
  "timezone",
  "none",
] as const;
export type IntentKey = (typeof INTENT_KEYS)[number];
export type CardIntent = Exclude<IntentKey, "none">;

export const EVENT_MODES = ["in_person", "video_call", "phone_call", "unspecified"] as const;
export const TIMER_KINDS = ["countdown", "focus", "break", "stopwatch"] as const;
export const BRANDS = ["layerx", "taikai", "ai_cmo"] as const;
export const CONTENT_FORMATS = ["linkedin_post", "carousel", "article", "video"] as const;

export type EventMode = (typeof EVENT_MODES)[number];
export type TimerKind = (typeof TIMER_KINDS)[number];
export type Brand = (typeof BRANDS)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

function answerSchema<const T extends readonly [string, ...string[]]>(values: T) {
  const e = z.enum(values);
  return z.object({
    value: e,
    confidence: z.number(),
    probabilities: z.partialRecord(e, z.number()),
  });
}

export type Answer<T extends string> = {
  value: T;
  confidence: number;
  probabilities: Partial<Record<T, number>>;
};

export const signalsSchema = z.object({
  recurring: z.number(),
  urgency: z.object({ score: z.number(), confidence: z.number() }),
  eventMode: answerSchema(EVENT_MODES),
  timerKind: answerSchema(TIMER_KINDS),
  isShoppingList: z.number(),
  brand: answerSchema(BRANDS),
  contentFormat: answerSchema(CONTENT_FORMATS),
});
export type Signals = z.infer<typeof signalsSchema>;
export type SignalKey = keyof Signals;

export const intentResultSchema = z.object({
  intent: answerSchema(INTENT_KEYS),
  readiness: z.number(),
  signals: signalsSchema,
  latencyMs: z.number(),
  questionCount: z.number(),
  model: z.string(),
  cached: z.boolean().optional(),
  error: z.boolean().optional(),
  source: z.enum(["jev", "mock"]).optional(),
});
export type IntentResult = z.infer<typeof intentResultSchema>;

export const intentRequestSchema = z.object({ text: z.string().max(2000) });

function neutralAnswer<T extends string>(value: T): Answer<T> {
  return { value, confidence: 1, probabilities: { [value]: 1 } as Partial<Record<T, number>> };
}

export function neutralSignals(): Signals {
  return {
    recurring: 0,
    urgency: { score: 0, confidence: 1 },
    eventMode: neutralAnswer("unspecified"),
    timerKind: neutralAnswer("countdown"),
    isShoppingList: 0,
    brand: neutralAnswer("layerx"),
    contentFormat: neutralAnswer("linkedin_post"),
  };
}

export function noneResult(extra: Partial<IntentResult> = {}): IntentResult {
  return {
    intent: neutralAnswer("none"),
    readiness: 0,
    signals: neutralSignals(),
    latencyMs: 0,
    questionCount: 0,
    model: "none",
    ...extra,
  };
}
