import type { Brand, ContentFormat } from "@/lib/jev/types";
import { capitalize, collapse, tidy } from "./common";
import { BRAND_RE, FORMAT_RE, LEADING_FORMAT_RE, toBrand, toFormat } from "./marketing";

/** Brand and format are only set when the text names them; otherwise Jev's pick fills them in. */
export type IdeaData = { idea: string; brand: Brand | null; format: ContentFormat | null };

const LEAD_IN =
  /^(?:(?:content )?idea:?|(?:we should |i should |let'?s )?(?:write |make |do |share )?(?:a |an )?(?:linkedin )?(?:post|piece|thread|content)\s+(?:about|on)|talk about|share)\s+/i;

export function parseIdea(text: string): IdeaData {
  let rest = collapse(text);
  let brand: Brand | null = null;
  let format: ContentFormat | null = null;

  const b = rest.match(BRAND_RE);
  if (b) {
    brand = toBrand(b[1]);
    rest = rest.replace(BRAND_RE, "");
  }
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
  return { idea: capitalize(tidy(rest)), brand, format };
}

export function completeIdea(d: IdeaData) {
  const words = d.idea.split(/\s+/).filter(Boolean).length;
  return Math.min(0.7, words * 0.12) + (d.brand ? 0.15 : 0) + (d.format ? 0.15 : 0);
}
