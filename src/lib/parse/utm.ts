import { collapse } from "./common";

export type UtmData = {
  /** The destination, with https:// added when missing. */
  url: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  /** The full tracked link, once there is a URL and a source. */
  tagged: string | null;
};

/** Words people type → utm_source, and the medium each source implies. Longest phrases first. */
const SOURCES: [RegExp, string, string][] = [
  [/\bgoogle ?ads\b|\badwords\b/i, "google", "cpc"],
  [/\blinked ?in\b/i, "linkedin", "social"],
  [/\btwitter\b|\bx\.com\b|\bx\b/i, "x", "social"],
  [/\binstagram\b|\binsta\b|\big\b/i, "instagram", "social"],
  [/\bfacebook\b|\bfb\b/i, "facebook", "social"],
  [/\btik ?tok\b/i, "tiktok", "social"],
  [/\byoutube\b|\byt\b/i, "youtube", "social"],
  [/\breddit\b/i, "reddit", "social"],
  [/\bthreads\b/i, "threads", "social"],
  [/\bbluesky\b/i, "bluesky", "social"],
  [/\bdiscord\b/i, "discord", "social"],
  [/\btelegram\b/i, "telegram", "social"],
  [/\bwhats ?app\b/i, "whatsapp", "social"],
  [/\bnewsletter\b|\bsubstack\b/i, "newsletter", "email"],
  [/\bemail\b|\bmailchimp\b|\bhubspot\b/i, "email", "email"],
  [/\bluma\b/i, "luma", "referral"],
];

/** An explicit medium overrides the one implied by the source. */
const MEDIUMS: [RegExp, string][] = [
  [/\b(?:paid|sponsored|ads?)\b/i, "paid-social"],
  [/\bcpc\b|\bppc\b/i, "cpc"],
  [/\borganic\b/i, "social"],
  [/\breferral\b|\bpartner\b/i, "referral"],
  [/\bdisplay\b|\bbanner\b/i, "display"],
];

const URL_RE = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s]*)?)/i;
const FILLER = /\b(utm|link|url|tag|tagged|track(?:ed|ing)?|for|the|a|an|to|on|via|from|campaign|medium|source|content)\b/gi;

/** Lowercase, hyphens instead of spaces, only characters that survive a URL untouched. */
export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9_.\s-]/g, " ")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUtmUrl(url: string, tags: { source: string; medium: string | null; campaign: string | null; content: string | null }) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  u.searchParams.set("utm_source", tags.source);
  if (tags.medium) u.searchParams.set("utm_medium", tags.medium);
  if (tags.campaign) u.searchParams.set("utm_campaign", tags.campaign);
  if (tags.content) u.searchParams.set("utm_content", tags.content);
  return u.toString();
}

export function parseUtm(text: string): UtmData {
  let rest = ` ${collapse(text)} `;

  let url: string | null = null;
  const u = rest.match(URL_RE);
  if (u && u.index !== undefined) {
    url = /^https?:\/\//i.test(u[1]) ? u[1] : `https://${u[1]}`;
    rest = rest.slice(0, u.index) + " " + rest.slice(u.index + u[0].length);
  }

  // "content banner-a" / "ad variant b" → utm_content, taken from the end of the text.
  let content: string | null = null;
  const c = rest.match(/\b(?:content|variant|creative)\s*:?\s+(.+)$/i);
  if (c && c.index !== undefined) {
    content = slug(c[1]) || null;
    rest = rest.slice(0, c.index);
  }

  let source: string | null = null;
  let medium: string | null = null;
  for (const [re, s, m] of SOURCES) {
    if (re.test(rest)) {
      source = s;
      medium = m;
      rest = rest.replace(re, " ");
      break;
    }
  }
  for (const [re, m] of MEDIUMS) {
    if (re.test(rest)) {
      medium = m === "paid-social" && medium !== "social" ? "paid" : m;
      rest = rest.replace(re, " ");
      break;
    }
  }

  const campaign = slug(rest.replace(FILLER, " ")) || null;
  const tagged = url && source ? buildUtmUrl(url, { source, medium, campaign, content }) : null;
  return { url, source, medium, campaign, content, tagged };
}

export function completeUtm(d: UtmData) {
  return (d.url ? 0.35 : 0) + (d.source ? 0.25 : 0) + (d.campaign ? 0.3 : 0) + (d.medium ? 0.1 : 0);
}
