import type { Answer, ContentFormat, EventMode, IntentResult, SignalKey, Signals, TimerKind } from "@/lib/jev/types";

export const SIGNAL_THRESHOLDS = {
  choiceMin: 0.6,
  /** Once shown, a choice value survives a small dip in confidence. */
  choiceKeep: 0.5,
  noulOn: 0.65,
  noulOff: 0.45,
  urgentOn: 1.2,
  urgentOff: 1.0,
} as const;

export type GatedSignals = {
  eventMode: EventMode | null;
  timerKind: TimerKind | null;
  /** Jev's pick for a content idea. Always its top answer: the card lets you change it in one click. */
  contentFormat: ContentFormat | null;
  recurring: boolean;
  isShoppingList: boolean;
  /** Continuous 0..2, used for smooth mappings. */
  urgency: number;
  /** Past the caution threshold (with hysteresis). */
  urgent: boolean;
};

export const neutralGated: GatedSignals = {
  eventMode: null,
  timerKind: null,
  contentFormat: null,
  recurring: false,
  isShoppingList: false,
  urgency: 0,
  urgent: false,
};

const ESCAPES = new Set(["unspecified", "other"]);

function gateChoice<T extends string>(a: Answer<T>, prev: T | null): T | null {
  if (ESCAPES.has(a.value)) return null;
  if (a.confidence >= SIGNAL_THRESHOLDS.choiceMin) return a.value;
  if (prev === a.value && a.confidence >= SIGNAL_THRESHOLDS.choiceKeep) return prev;
  return null;
}

function gateNoul(p: number, prev: boolean): boolean {
  if (p >= SIGNAL_THRESHOLDS.noulOn) return true;
  if (p <= SIGNAL_THRESHOLDS.noulOff) return false;
  return prev;
}

type ChoiceKey = "eventMode" | "timerKind";
type PickKey = "contentFormat";
type NoulKey = "recurring" | "isShoppingList";
const CHOICE_KEYS: ChoiceKey[] = ["eventMode", "timerKind"];
const PICK_KEYS: PickKey[] = ["contentFormat"];
const NOUL_KEYS: NoulKey[] = ["recurring", "isShoppingList"];

/**
 * Read only the signals the committed intent uses, applying thresholds and
 * hysteresis so badges and icons don't blink while typing.
 */
export function gateSignals(prev: GatedSignals, result: IntentResult, used: readonly SignalKey[]): GatedSignals {
  const s: Signals = result.signals;
  const next: GatedSignals = { ...neutralGated };
  const uses = new Set(used);

  for (const k of CHOICE_KEYS) {
    if (!uses.has(k)) continue;
    // Each key maps to its own answer type; the cast keeps the loop generic.
    (next as Record<ChoiceKey, string | null>)[k] = gateChoice(s[k] as Answer<string>, prev[k]);
  }
  for (const k of PICK_KEYS) {
    if (!uses.has(k)) continue;
    (next as Record<PickKey, string | null>)[k] = s[k].value;
  }
  for (const k of NOUL_KEYS) {
    if (!uses.has(k)) continue;
    next[k] = gateNoul(s[k], prev[k]);
  }
  if (uses.has("urgency")) {
    next.urgency = s.urgency.score;
    next.urgent = prev.urgent ? s.urgency.score > SIGNAL_THRESHOLDS.urgentOff : s.urgency.score > SIGNAL_THRESHOLDS.urgentOn;
  }
  return next;
}
