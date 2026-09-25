import { capitalize, collapse, findDate, removeRange, tidy, titleCase } from "./common";

export type LeadData = {
  name: string;
  company: string | null;
  interest: string | null;
  followUp: Date;
  /** False when the follow-up date is the default of three working days. */
  followUpSet: boolean;
  /** True when a time was given ("monday 9 am"); otherwise the follow-up is all day. */
  followUpHasTime: boolean;
  /** Email addresses in the note, invited to the follow-up. */
  guests: string[];
};

export const FOLLOW_UP_WORKING_DAYS = 3;

/** Start of the day that is `n` working days (Mon to Fri) after `from`. */
export function addWorkingDays(from: Date, n: number) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

const MET = /^(?:lead:?\s*|(?:i\s+)?(?:met|meet|spoke (?:to|with)|talked (?:to|with)|chatted with|call with|coffee with|new lead:?)\s+)/i;
const INTEREST = /[,;]?\s*\b(?:(?:is |are |was |were )?interested in|wants?(?: to)?|looking for|asked about|keen on|needs?|curious about)\s+(.+)$/i;
const COMPANY = /\s+(?:from|at|of|@)\s+(.+?)\s*$/i;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
/** "…, follow up with x next monday 9 am" / "f/u friday" / "reach out tuesday": the part that sets the follow-up. */
const FOLLOW_CLAUSE = /[.,;]?\s*\b(?:follow(?:ing)?[- ]?up|f\/u|reach out|ping (?:her|him|them)|call (?:her|him|them) back)\b(.*)$/i;

const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

export function parseLead(text: string, ref: Date = new Date()): LeadData {
  let rest = collapse(text);

  const guests = [...new Set(rest.match(EMAIL)?.map((e) => e.toLowerCase()) ?? [])];
  rest = collapse(rest.replace(EMAIL, " "));

  // The follow-up date comes from the "follow up …" part when there is one, else any future date.
  let when: { start: Date; hasTime: boolean } | null = null;
  const clause = rest.match(FOLLOW_CLAUSE);
  if (clause && clause.index !== undefined) {
    const hit = findDate(clause[1], ref);
    if (hit) when = { start: hit.start, hasTime: hit.hasTime };
    rest = rest.slice(0, clause.index);
  }
  // Remove every other date ("met james today") so it doesn't end up in the name or company.
  for (let i = 0; i < 3; i++) {
    const hit = findDate(rest, ref);
    if (!hit) break;
    if (!when && hit.start > endOfDay(ref)) when = { start: hit.start, hasTime: hit.hasTime };
    rest = collapse(removeRange(rest, hit.index, hit.text.length));
  }

  const followUp = when
    ? when.hasTime
      ? when.start
      : new Date(when.start.getFullYear(), when.start.getMonth(), when.start.getDate())
    : addWorkingDays(ref, FOLLOW_UP_WORKING_DAYS);

  let interest: string | null = null;
  const i = rest.match(INTEREST);
  if (i && i.index !== undefined) {
    interest = capitalize(tidy(i[1].replace(/[.!,;]+$/, "").replace(/^(?:a|an|the|some)\s+/i, ""))) || null;
    rest = rest.slice(0, i.index);
  }

  rest = rest.replace(MET, "").replace(/[.,;]+\s*$/, "");
  let company: string | null = null;
  const c = rest.match(COMPANY);
  if (c && c.index !== undefined) {
    company = titleCase(tidy(c[1])) || null;
    rest = rest.slice(0, c.index);
  }

  return {
    name: titleCase(tidy(rest)),
    company,
    interest,
    followUp,
    followUpSet: when !== null,
    followUpHasTime: when?.hasTime ?? false,
    guests,
  };
}

export function completeLead(d: LeadData) {
  return (d.name ? 0.4 : 0) + (d.company ? 0.3 : 0) + (d.interest ? 0.3 : 0);
}
