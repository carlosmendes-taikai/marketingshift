export type DraftData = {
  /** The post text, line breaks kept. Empty when only a LinkedIn link was pasted. */
  post: string;
  /** A public LinkedIn post link to fetch and grade instead of pasted text. */
  linkedinUrl: string | null;
  firstLine: string;
  chars: number;
  words: number;
  readingSeconds: number;
  hashtags: number;
  /** What shows in the feed before "…see more". Null when the whole post fits. */
  preview: string | null;
};

/** LinkedIn's feed shows about 210 characters or 3 lines before "…see more". */
export const SEE_MORE_CHARS = 210;
export const SEE_MORE_LINES = 3;
export const LINKEDIN_MAX_CHARS = 3000;

const LINKEDIN_POST_URL = /^https:\/\/(?:www\.)?(?:linkedin\.com\/(?:posts|feed\/update)\/\S+|lnkd\.in\/\S+)$/i;

export function seeMorePreview(post: string): string | null {
  const lines = post.split("\n");
  let cut = post.length;
  if (lines.length > SEE_MORE_LINES) cut = lines.slice(0, SEE_MORE_LINES).join("\n").length;
  cut = Math.min(cut, SEE_MORE_CHARS);
  if (cut >= post.length) return null;
  // Don't cut mid-word.
  if (/\S/.test(post[cut] ?? "") && /\S/.test(post[cut - 1] ?? "")) {
    const space = post.lastIndexOf(" ", cut);
    if (space > cut - 25) cut = space;
  }
  return post.slice(0, cut).trimEnd();
}

export function parseDraft(text: string): DraftData {
  const raw = text.trim();
  const linkedinUrl = LINKEDIN_POST_URL.test(raw) ? raw : null;
  const post = linkedinUrl ? "" : raw.replace(/\r\n/g, "\n");
  const words = post.split(/\s+/).filter(Boolean).length;
  return {
    post,
    linkedinUrl,
    firstLine: post.split("\n").find((l) => l.trim())?.trim() ?? "",
    chars: post.length,
    words,
    readingSeconds: Math.max(words ? 5 : 0, Math.round((words / 230) * 60)),
    hashtags: (post.match(/(^|\s)#[\p{L}\d_]+/gu) ?? []).length,
    preview: seeMorePreview(post),
  };
}

export function completeDraft(d: DraftData) {
  if (d.linkedinUrl) return 1;
  return Math.min(1, d.words / 60);
}
