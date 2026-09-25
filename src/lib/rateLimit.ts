import "server-only";
import { LRU } from "./lru";

/**
 * Per-visitor limits on paid Jev calls, so a busy day can't run up the AI Gateway bill.
 * Counts live in the server's memory: good enough to stop one visitor hammering the API,
 * not a hard global cap (set a spending limit on the AI Gateway for that).
 */
type Limit = { perMinute: number; perDay: number };

export const LIMITS = {
  /** Card choice runs on every pause while typing. Over the limit, the free offline classifier answers. */
  intent: { perMinute: 60, perDay: 1500 },
  /** Post drafts and A/B tests: one call per finished card. */
  grade: { perMinute: 10, perDay: 150 },
  /** Google Sheets rows (free, but keeps the endpoint from being used as a relay). */
  sheets: { perMinute: 20, perDay: 300 },
} satisfies Record<string, Limit>;

type Counter = { minute: number; minuteCount: number; day: number; dayCount: number };
const counters = new LRU<string, Counter>(20_000);

/** The visitor's IP as Vercel reports it. */
export function visitorId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** Counts one call and says whether it's allowed. */
export function allow(bucket: keyof typeof LIMITS, request: Request, now = Date.now()): boolean {
  const limit = LIMITS[bucket];
  const key = `${bucket}:${visitorId(request)}`;
  const minute = Math.floor(now / 60_000);
  const day = Math.floor(now / 86_400_000);
  const c = counters.get(key) ?? { minute, minuteCount: 0, day, dayCount: 0 };
  if (c.minute !== minute) Object.assign(c, { minute, minuteCount: 0 });
  if (c.day !== day) Object.assign(c, { day, dayCount: 0 });
  if (c.minuteCount >= limit.perMinute || c.dayCount >= limit.perDay) {
    counters.set(key, c);
    return false;
  }
  c.minuteCount++;
  c.dayCount++;
  counters.set(key, c);
  return true;
}
