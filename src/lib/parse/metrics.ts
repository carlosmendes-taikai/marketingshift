import { collapse } from "./common";

export type MetricsData = {
  channel: string | null;
  currency: "€" | "$" | "£";
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  leads: number | null;
  /** Worked out from the numbers above; null when an input is missing. */
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  cpl: number | null;
  conversion: number | null;
};

const CHANNELS: [RegExp, string][] = [
  [/\bgoogle ?ads\b|\badwords\b/i, "Google Ads"],
  [/\blinked ?in\b/i, "LinkedIn"],
  [/\bmeta\b|\bfacebook\b|\bfb\b/i, "Meta"],
  [/\binstagram\b|\binsta\b/i, "Instagram"],
  [/\btwitter\b|\bx ads\b/i, "X"],
  [/\btik ?tok\b/i, "TikTok"],
  [/\byoutube\b/i, "YouTube"],
  [/\breddit\b/i, "Reddit"],
  [/\bnewsletter\b|\bemail\b|\bmailchimp\b/i, "Email"],
];

const NUM = String.raw`((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*([km])?\b`;
const toNum = (n: string, suffix?: string) => {
  const v = Number(n.replace(/,/g, ""));
  return suffix?.toLowerCase() === "k" ? v * 1_000 : suffix?.toLowerCase() === "m" ? v * 1_000_000 : v;
};

/** A number next to one of the words, either "340 clicks" or "clicks: 340". */
function metric(text: string, words: string): number | null {
  const after = new RegExp(`${NUM}\\s*(?:${words})\\b`, "i").exec(text);
  if (after) return toNum(after[1], after[2]);
  const before = new RegExp(`\\b(?:${words})\\s*:?\\s*${NUM}`, "i").exec(text);
  return before ? toNum(before[1], before[2]) : null;
}

function spend(text: string): { value: number | null; currency: MetricsData["currency"] } {
  const currency = /\$|\busd\b|dollars?/i.test(text) ? "$" : /£|\bgbp\b/i.test(text) ? "£" : "€";
  const symbol = new RegExp(String.raw`[€$£]\s*${NUM}|${NUM}\s*(?:€|\$|£|eur(?:os?)?|usd|dollars?|gbp)`, "i").exec(text);
  if (symbol) return { value: symbol[1] ? toNum(symbol[1], symbol[2]) : toNum(symbol[3], symbol[4]), currency };
  return { value: metric(text, "spent|spend|budget|cost"), currency };
}

const ratio = (a: number | null, b: number | null, scale = 1) => (a !== null && b ? (a / b) * scale : null);

export function parseMetrics(text: string): MetricsData {
  const t = collapse(text);
  const channel = CHANNELS.find(([re]) => re.test(t))?.[1] ?? null;
  const s = spend(t);
  const impressions = metric(t, "impressions?|imps?|views|reach");
  const clicks = metric(t, "clicks?");
  const leads = metric(t, "leads?|sign ?ups?|signups|registrations?|conversions?|applications?|downloads?");
  return {
    channel,
    currency: s.currency,
    spend: s.value,
    impressions,
    clicks,
    leads,
    ctr: ratio(clicks, impressions, 100),
    cpc: ratio(s.value, clicks),
    cpm: ratio(s.value, impressions, 1000),
    cpl: ratio(s.value, leads),
    conversion: ratio(leads, clicks, 100),
  };
}

export function completeMetrics(d: MetricsData) {
  const inputs = [d.spend, d.impressions, d.clicks, d.leads].filter((v) => v !== null).length;
  return Math.min(1, inputs * 0.3);
}

export function formatMoney(n: number, currency: MetricsData["currency"]) {
  return `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: n < 100 && !Number.isInteger(n) ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function formatCount(n: number) {
  return new Intl.NumberFormat("en-US", { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}
