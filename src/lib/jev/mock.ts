import { completenessFor } from "@/lib/parse";
import { ZONE_PATTERN } from "@/lib/parse/timezone";
import {
  type Answer,
  BRANDS,
  type CardIntent,
  CONTENT_FORMATS,
  EVENT_MODES,
  INTENT_KEYS,
  type IntentKey,
  type IntentResult,
  noneResult,
  TIMER_KINDS,
} from "./types";

/** Keep in sync with questions.ts (asserted in tests). */
export const MOCK_QUESTION_COUNT = 9;
export const MOCK_MODEL = "jev-offline";

const has = (re: RegExp, t: string) => re.test(t);

const DATE_WORDS = /\b(today|tonight|tomorrow|tmrw|mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?|next week|this week|noon|midnight|morning|evening|\d{1,2}\s?(am|pm)|\d{1,2}:\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/;
const GATHER = /\b(dinner|lunch|breakfast|brunch|coffee|meeting|meet|call|sync|standup|party|drinks|date|catch ?up|interview|appointment|hangout|1:1|session with|with [a-z]+)\b/;
const URL_LIKE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|dev|io|app|org|net|co|ai|in|so|network|xyz|pt|me)\b/;
const SOURCE_WORD = /\b(linked ?in|twitter|x|instagram|insta|ig|facebook|fb|tik ?tok|youtube|reddit|newsletter|substack|email|google ?ads|adwords|threads|bluesky|discord|telegram|whats ?app|luma)\b/;
const MET_WORD = /^(lead:?|new lead|(i )?(met|spoke (to|with)|talked (to|with)|chatted with))\b/;
const IDEA_START =
  /^((content )?idea:?|(we should |i should |let'?s )?(write |make |do |share |record |film )?(a |an )?(linkedin )?(post|carousel|article|blog post|video|reel|thread)s? (about|on))\b/;

const ZONE_WORD = new RegExp(`\\b(${ZONE_PATTERN})\\b`, "g");
const CLOCK = /\b\d{1,2}(:\d{2})?\s*(am|pm)\b|\b\d{1,2}:\d{2}\b|\b(noon|midnight)\b/;

type Scores = Partial<Record<IntentKey, number>>;

function intentScores(raw: string): Scores {
  const t = raw.toLowerCase().trim();
  const words = t.split(/\s+/).filter(Boolean);
  const s: Scores = {};
  const add = (k: IntentKey, v: number) => (s[k] = (s[k] ?? 0) + v);

  // A long, multi-sentence text or a LinkedIn post link is a draft to review.
  const sentences = (raw.match(/[.!?](\s|$)/g) ?? []).length + (raw.match(/\n/g) ?? []).length;
  if (has(/^https:\/\/(www\.)?(linkedin\.com\/(posts|feed\/update)\/|lnkd\.in\/)\S+$/, t)) add("draft", 12);
  else if (words.length >= 40 || (words.length >= 20 && sentences >= 2)) add("draft", 9);
  // Campaign results: numbers next to metric words.
  const metricHits = (t.match(/\d[\d,.]*\s*[km]?\s*(impressions?|clicks?|leads?|sign ?ups?|registrations?|conversions?|views|reach)\b|\b(spent|spend|budget|cpc|ctr|cpl|roas)\b/g) ?? []).length;
  if (metricHits >= 2) add("metrics", 5 + metricHits);
  // Event promo plan: "promote X on nov 15".
  if (has(/\b(promo|promote|promotion|launch plan|marketing plan)\b/, t)) add("promo", has(DATE_WORDS, t) || /\d/.test(t) ? 7 : 5);
  // A/B test: two options with vs, or quoted options with a subject/headline keyword.
  const quotes = (raw.match(/["“”]/g) ?? []).length;
  if (has(/\b(a\/?b( test)?|subject( lines?)?|headlines?|cta)\b/, t) && (has(/\s(vs\.?|versus)\s/, t) || quotes >= 4)) add("abtest", 9);
  else if (has(/\s(vs\.?|versus)\s/, t) && quotes >= 4) add("abtest", 7);

  const url = has(URL_LIKE, t);
  if (url) add("link", 6);
  // A link with a traffic source or a campaign is a UTM link, not a bookmark.
  if (has(/\butm\b/, t)) add("utm", url ? 8 : 5);
  if (url && (has(SOURCE_WORD, t) || has(/\bcampaign\b/, t))) add("utm", 8);
  else if (has(/\bcampaign\b/, t) && has(SOURCE_WORD, t)) add("utm", 5);
  if (has(MET_WORD, t)) add("lead", 6);
  if (has(/\b(interested in|looking for|asked about|keen on|curious about)\b/, t)) add("lead", 3);
  if (has(IDEA_START, t)) add("idea", 7);
  else if (has(/\b(post|carousel|article|video|content) (idea|about)\b/, t)) add("idea", 5);
  if (has(/[\w.+-]+@[\w-]+\.\w+/, t)) add("contact", 5);
  if (has(/(\+?\d{1,3}[\s-]?)?(\d{3}[\s-]?\d{3}[\s-]?\d{3,4}|[6-9]\d{4}[\s-]?\d{3,5})\b/, t)) add("contact", 4);
  if (has(/\b(remind|reminder|don'?t forget|remember to)\b/, t)) add("reminder", 6);
  if (has(/^[\d\s+\-*/x×÷^().,%]+$/, t) && has(/\d\s*[+\-*/x×÷^%]\s*[\d(]/, t)) add("calc", 7);
  if (has(/\d\s*%\s*(of|off)\b/, t)) add("calc", 6);
  if (has(/\b(what'?s|calculate|compute)\b.*\d/, t)) add("calc", 3);
  if (has(/\b(timer|countdown|stopwatch|pomodoro)\b/, t)) add("timer", 6);
  if (has(/\b\d+\s*(h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)\b/, t)) add("timer", 3);
  if (has(/\b(focus|break|rest|nap|deep work)\b/, t) && has(/\d/, t)) add("timer", 2.5);
  // Time zones: two zones, a clock time plus a zone, or "time in tokyo"
  const zoneHits = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(ZONE_WORD)?.length ?? 0;
  if (zoneHits >= 2 && (has(CLOCK, t) || has(/\b(in|to)\b/, t))) add("timezone", 7);
  else if (zoneHits === 1 && (has(CLOCK, t) || has(/\btime\b/, t))) add("timezone", 5.5);
  const listSeps = (t.match(/,|\band\b|&|\n/g) ?? []).length;
  if (listSeps >= 2) add("todo", 4);
  else if (listSeps === 1 && has(/^(buy|get|todo|to do|groceries)\b/, t)) add("todo", 3);
  if (has(/^(buy|get|pick up|grab)\b/, t)) add("todo", 2);
  const gather = has(GATHER, t);
  if (has(DATE_WORDS, t)) add("event", gather ? 2.5 : words.length <= 4 ? 2 : 1);
  if (gather) add("event", 3);
  if (has(/\b(on|over|via) (zoom|meet|teams|facetime)\b/, t)) add("event", 2);
  if (t.length < 3) add("none", 8);
  else if (words.length === 1) add("none", 3);
  else add("none", 1.5);

  // Mutual exclusions mirror the criteria wording.
  if ((s.draft ?? 0) >= 9) {
    for (const k of ["idea", "event", "todo", "link", "utm", "lead", "reminder"] as const) s[k] = Math.min(s[k] ?? 0, 3);
  }
  if ((s.metrics ?? 0) >= 7) {
    s.calc = Math.min(s.calc ?? 0, 1);
    s.todo = Math.min(s.todo ?? 0, 1);
    s.utm = Math.min(s.utm ?? 0, 2);
  }
  if ((s.promo ?? 0) >= 7) s.event = Math.min(s.event ?? 0, 2);
  if ((s.abtest ?? 0) >= 7) {
    s.reminder = Math.min(s.reminder ?? 0, 2);
    s.idea = Math.min(s.idea ?? 0, 2);
  }
  if ((s.utm ?? 0) >= 8) s.link = Math.min(s.link ?? 0, 2);
  if ((s.reminder ?? 0) >= 6) s.event = Math.min(s.event ?? 0, 2.5);
  if ((s.lead ?? 0) >= 6) {
    s.event = Math.min(s.event ?? 0, 2);
    s.contact = Math.min(s.contact ?? 0, 3);
    s.todo = Math.min(s.todo ?? 0, 2);
  }
  if ((s.idea ?? 0) >= 5) {
    s.event = Math.min(s.event ?? 0, 2);
    s.todo = Math.min(s.todo ?? 0, 2);
  }
  if ((s.contact ?? 0) >= 4) s.timer = 0;
  // An email address is not a web link.
  if (has(/[\w.+-]+@[\w-]+\.\w+/, t) && !has(/https?:\/\/|www\./, t)) s.link = Math.min(s.link ?? 0, 2);
  if ((s.timezone ?? 0) >= 5.5) {
    s.event = Math.min(s.event ?? 0, 2);
    s.timer = Math.min(s.timer ?? 0, 1);
  }
  return s;
}

function softmax(scores: Scores, temp = 1): Record<IntentKey, number> {
  const exps = INTENT_KEYS.map((k) => Math.exp((scores[k] ?? 0) / temp));
  const sum = exps.reduce((a, b) => a + b, 0);
  return Object.fromEntries(INTENT_KEYS.map((k, i) => [k, exps[i] / sum])) as Record<IntentKey, number>;
}

function pick<T extends string>(values: readonly T[], value: T, confidence: number): Answer<T> {
  const rest = (1 - confidence) / Math.max(1, values.length - 1);
  const probabilities = Object.fromEntries(values.map((v) => [v, v === value ? confidence : rest])) as Record<T, number>;
  return { value, confidence, probabilities };
}

function choose<T extends string>(values: readonly T[], t: string, rules: [RegExp, T][], fallback: T): Answer<T> {
  for (const [re, v] of rules) if (re.test(t)) return pick(values, v, 0.86);
  return pick(values, fallback, 0.74);
}

export function mockClassify(text: string): IntentResult {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return noneResult({ model: MOCK_MODEL, questionCount: MOCK_QUESTION_COUNT, source: "mock" });

  const probs = softmax(intentScores(t), 0.8);
  const top = INTENT_KEYS.reduce((a, b) => (probs[b] > probs[a] ? b : a));
  const intent: Answer<IntentKey> = { value: top, confidence: probs[top], probabilities: probs };

  const readiness = top === "none" ? 0 : Math.min(2, completenessFor(top as CardIntent, text) * 2);

  const recurring = /\b(every|daily|weekly|monthly|each (day|week|morning)|\dx a week|times a week|repeat)/.test(t) ? 0.88 : 0.08;
  const urgentHit = /\b(urgent|asap|immediately|right now|important|critical|!!)/.test(t);
  const soonHit = /\b(today|tonight|soon|by \d|deadline|tomorrow)\b/.test(t);
  const urgencyScore = urgentHit ? 1.75 : soonHit ? 0.9 : 0.2;

  return {
    intent,
    readiness,
    signals: {
      recurring,
      urgency: { score: urgencyScore, confidence: 0.8 },
      eventMode: choose(EVENT_MODES, t, [
        [/\b(zoom|meet|teams|facetime|video|skype|discord)\b/, "video_call"],
        [/\b(phone|call|ring)\b/, "phone_call"],
        [/\b(dinner|lunch|breakfast|coffee|drinks|party|at [a-z]+)\b/, "in_person"],
      ], "unspecified"),
      timerKind: choose(TIMER_KINDS, t, [
        [/\b(focus|pomodoro|deep work|study|work)\b/, "focus"],
        [/\b(break|rest|nap|breather)\b/, "break"],
        [/\b(stopwatch|count up)\b/, "stopwatch"],
      ], "countdown"),
      isShoppingList: /\b(buy|get|groceries|shopping|milk|eggs|bread|coffee|pick up|order)\b/.test(t) ? 0.88 : 0.1,
      brand: choose(BRANDS, t, [
        [/\bfor layer ?x\b/, "layerx"],
        [/\btaikai\b|\bhack(athon|er ?house)s?\b|\bbuilders?\b/, "taikai"],
        [/\bai[- ]?cmo\b|\b(ai|claude|gpt|llm|agents?|automation|prompts?)\b/, "ai_cmo"],
      ], "layerx"),
      contentFormat: choose(CONTENT_FORMATS, t, [
        [/\b(carousel|slides|step[- ]by[- ]step|frameworks?|\d+ (tips|ways|steps|lessons))\b/, "carousel"],
        [/\b(article|blog|guide|deep dive|case study)\b/, "article"],
        [/\b(video|reel|demo|interview|behind the scenes)\b/, "video"],
      ], "linkedin_post"),
    },
    latencyMs: Math.round(90 + Math.random() * 130),
    questionCount: MOCK_QUESTION_COUNT,
    model: MOCK_MODEL,
    source: "mock",
  };
}

export async function mockClassifyAsync(text: string, signal?: AbortSignal): Promise<IntentResult> {
  const result = mockClassify(text);
  await new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, result.latencyMs);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  return result;
}
