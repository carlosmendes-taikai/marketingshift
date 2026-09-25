import type { ContentFormat } from "@/lib/jev/types";

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  linkedin_post: "LinkedIn post",
  carousel: "Carousel",
  article: "Article",
  video: "Video",
};

/** How each choice is written into the text when picked on the card: "… as a carousel". */
export const FORMAT_PHRASE: Record<ContentFormat, string> = {
  linkedin_post: "as a LinkedIn post",
  carousel: "as a carousel",
  article: "as an article",
  video: "as a video",
};

const FORMAT_WORD = "(linkedin post|post|carousel|article|blog post|blog|video|reel)";

/** "as a carousel", "as an article" anywhere in the text. */
export const FORMAT_RE = new RegExp(`\\s*\\bas\\s+an?\\s+${FORMAT_WORD}(?=\\s|$|[,.])`, "i");
/** "carousel about …", "write an article on …" at the start. */
export const LEADING_FORMAT_RE = new RegExp(`^(?:write|make|do|create|record|film)?\\s*(?:an?\\s+)?${FORMAT_WORD}\\s+(?:about|on|for)\\s+`, "i");

export function toFormat(word: string): ContentFormat | null {
  const w = word.toLowerCase();
  if (w === "carousel") return "carousel";
  if (w === "article" || w.startsWith("blog")) return "article";
  if (w === "video" || w === "reel") return "video";
  if (w === "linkedin post") return "linkedin_post";
  return null; // a plain "post" is not specific enough
}

/** Replace any existing format choice in the text with a new one. */
export function withFormat(text: string, format: ContentFormat) {
  const base = text.replace(FORMAT_RE, "").replace(LEADING_FORMAT_RE, "post about ").trimEnd();
  return `${base} ${FORMAT_PHRASE[format]}`;
}
