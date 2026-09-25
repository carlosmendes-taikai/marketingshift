import type { ContentFormat } from "@/lib/jev/types";
import { capitalize, collapse, tidy } from "./common";
import { FORMAT_RE, LEADING_FORMAT_RE, toFormat } from "./marketing";

/** Format is only set when the text names it; otherwise Jev's pick fills it in. */
export type IdeaData = { idea: string; format: ContentFormat | null };

const LEAD_IN =
  /^(?:(?:content )?idea:?|(?:we should |i should |let'?s )?(?:write |make |do |share )?(?:a |an )?(?:linkedin )?(?:post|piece|thread|content)\s+(?:about|on)|talk about|share)\s+/i;

export function parseIdea(text: string): IdeaData {
  let rest = collapse(text);
  let format: ContentFormat | null = null;

  const f = rest.match(FORMAT_RE);
  if (f) {
    format = toFormat(f[1]);
    rest = rest.replace(FORMAT_RE, "");
  }
  const lf = rest.match(LEADING_FORMAT_RE);
  if (lf) {
    format ??= toFormat(lf[1]);
    rest = rest.replace(LEADING_FORMAT_RE, "");
  }
  rest = rest.replace(LEAD_IN, "");
  return { idea: capitalize(tidy(rest)), format };
}

export function completeIdea(d: IdeaData) {
  const words = d.idea.split(/\s+/).filter(Boolean).length;
  return Math.min(0.8, words * 0.12) + (d.format ? 0.2 : 0);
}
