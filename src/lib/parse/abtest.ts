import { collapse } from "./common";

export type AbKind = "subject" | "headline" | "cta";
export type AbTestData = { kind: AbKind; options: string[] };

export const AB_KIND_LABEL: Record<AbKind, string> = {
  subject: "Email subject line",
  headline: "Headline",
  cta: "Call to action",
};

const LEAD_IN =
  /^(?:(?:a\/?b|ab)\s*(?:test)?:?|(?:email\s+)?subject(?:\s+lines?)?:?|headlines?:?|titles?:?|hooks?:?|ctas?:?|buttons?:?|which is better:?|test:?)\s*/i;

export function parseAbTest(text: string): AbTestData {
  const t = collapse(text);
  const kind: AbKind = /\b(subject|email|newsletter|inbox)\b/i.test(t)
    ? "subject"
    : /\b(cta|button|call to action)\b/i.test(t)
      ? "cta"
      : "headline";

  // Quoted options win: "Your recap" vs "3 ideas that doubled our signups".
  const quoted = [...t.matchAll(/["“”]([^"“”]{2,120})["“”]/g)].map((m) => m[1].trim());
  if (quoted.length >= 2) return { kind, options: quoted.slice(0, 4) };

  let rest = t;
  for (let i = 0; i < 3; i++) rest = rest.replace(LEAD_IN, "");
  const options = rest
    .split(/\s+(?:vs\.?|versus|or)\s+|\s*\|\s*|\s*\/\/\s*/i)
    .map((o) => o.trim().replace(/^[:\-–]\s*|[?]$/g, ""))
    .filter((o) => o.length >= 2)
    .slice(0, 4);
  return { kind, options };
}

export function completeAbTest(d: AbTestData) {
  return d.options.length >= 2 ? 1 : d.options.length * 0.3;
}
