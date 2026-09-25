import { capitalize, collapse, findDate, removeRange, tidy, titleCase } from "./common";

export type LeadData = {
  name: string;
  company: string | null;
  interest: string | null;
  followUp: Date;
  /** False when the follow-up date is the default of three working days. */
  followUpSet: boolean;
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
const FOLLOW = /[,;]?\s*\bfollow(?:[- ]?up)?(?:\s+(?:on|by|next))?\s*$/i;

export function parseLead(text: string, ref: Date = new Date()): LeadData {
  let rest = ` ${collapse(text)} `;

  // An explicit follow-up day ("follow up friday") wins over the default.
  const date = findDate(rest, ref);
  let followUp = addWorkingDays(ref, FOLLOW_UP_WORKING_DAYS);
  let followUpSet = false;
  if (date && date.start.getTime() > ref.getTime()) {
    followUp = new Date(date.start.getFullYear(), date.start.getMonth(), date.start.getDate());
    followUpSet = true;
    rest = removeRange(rest, date.index, date.text.length);
  }
  rest = collapse(rest).replace(FOLLOW, "");

  let interest: string | null = null;
  const i = rest.match(INTEREST);
  if (i && i.index !== undefined) {
    interest = capitalize(tidy(i[1].replace(/[.!]+$/, "").replace(/^(?:a|an|the|some)\s+/i, ""))) || null;
    rest = rest.slice(0, i.index);
  }

  rest = rest.replace(MET, "").replace(/[,;]+\s*$/, "");
  let company: string | null = null;
  const c = rest.match(COMPANY);
  if (c && c.index !== undefined) {
    company = titleCase(tidy(c[1])) || null;
    rest = rest.slice(0, c.index);
  }

  return { name: titleCase(tidy(rest)), company, interest, followUp, followUpSet };
}

export function completeLead(d: LeadData) {
  return (d.name ? 0.4 : 0) + (d.company ? 0.3 : 0) + (d.interest ? 0.3 : 0);
}
