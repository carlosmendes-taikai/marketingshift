import * as chrono from "chrono-node";

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const titleCase = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => capitalize(w))
    .join(" ");

export const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Strip dangling connector words left behind after removing a phrase. */
export function tidy(s: string) {
  let out = collapse(s.replace(/[,;]+\s*$/g, "").replace(/^\s*[,;:-]+/g, ""));
  const dangling = /\s+(on|at|by|for|with|to|in|and|the|this|next|from|every)$/i;
  const leading = /^(on|at|by|for|and|the|to)\s+/i;
  for (let i = 0; i < 4; i++) {
    const next = out.replace(dangling, "").replace(leading, "");
    if (next === out) break;
    out = next;
  }
  return out.trim();
}

export type DateHit = {
  start: Date;
  end: Date | null;
  hasTime: boolean;
  text: string;
  index: number;
};

export function findDate(text: string, ref: Date = new Date()): DateHit | null {
  const results = chrono.parse(text, ref, { forwardDate: true });
  if (!results.length) return null;
  const r = results[0];
  // chrono is happy to read a bare number as a date; require something date-like.
  if (/^\d+$/.test(r.text.trim())) return null;
  return {
    start: r.start.date(),
    end: r.end ? r.end.date() : null,
    hasTime: r.start.isCertain("hour"),
    text: r.text,
    index: r.index,
  };
}

export function removeRange(text: string, index: number, length: number) {
  return text.slice(0, index) + " " + text.slice(index + length);
}
