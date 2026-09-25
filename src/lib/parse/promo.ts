import { capitalize, collapse, findDate, removeRange, tidy } from "./common";

export type PromoStep = {
  id: string;
  label: string;
  /** What to publish on that day. */
  hint: string;
  date: Date;
  /** Already in the past relative to today. */
  past: boolean;
};

export type PromoData = { name: string; date: Date | null; steps: PromoStep[] };

/** Days relative to the event. Negative is before. */
const PLAN: { id: string; offset: number; label: string; hint: string }[] = [
  { id: "announce", offset: -28, label: "Announce", hint: "Save the date post and registration link" },
  { id: "reminder", offset: -14, label: "Reminder", hint: "Speakers, agenda or what attendees will get" },
  { id: "week", offset: -7, label: "One week to go", hint: "Social proof: who is coming, partners, last seats" },
  { id: "last-call", offset: -1, label: "Last call", hint: "Final reminder with the link, tomorrow is the day" },
  { id: "recap", offset: 2, label: "Recap", hint: "Photos, highlights and thank yous" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function promoSteps(date: Date, ref: Date = new Date()): PromoStep[] {
  const today = startOfDay(ref);
  return PLAN.map((p) => {
    const day = addDays(date, p.offset);
    return { id: p.id, label: p.label, hint: p.hint, date: day, past: day < today };
  });
}

const LEAD_IN = /^(?:(?:make a |build a |create a )?promo(?:tion)?(?: plan)?(?: for)?|promote|plan(?: the)? promo(?:tion)? for|launch plan for|marketing plan for)\s+/i;

export function parsePromo(text: string, ref: Date = new Date()): PromoData {
  let rest = ` ${collapse(text)} `;
  const hit = findDate(rest, ref);
  if (hit) rest = removeRange(rest, hit.index, hit.text.length);
  const name = capitalize(tidy(collapse(rest).replace(LEAD_IN, "").replace(/^(?:our|my|the|a|an)\s+/i, "").replace(/\b(?:event|on)$/i, "")));
  const date = hit ? startOfDay(hit.start) : null;
  return { name, date, steps: date ? promoSteps(date, ref) : [] };
}

export function completePromo(d: PromoData) {
  return (d.name ? 0.5 : 0) + (d.date ? 0.5 : 0);
}
