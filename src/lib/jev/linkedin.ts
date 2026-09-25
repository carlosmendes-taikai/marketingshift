import "server-only";
// Turns a public LinkedIn post link into the post’s text.
// Only LinkedIn addresses are ever fetched, including every redirect along the way.

const ALLOWED_HOSTS = new Set(["lnkd.in", "linkedin.com", "www.linkedin.com"]);
const MAX_REDIRECTS = 5;
const MAX_BYTES = 3_000_000;

export class LinkedInError extends Error {}

export function isUrl(text: string) {
  return /^https?:\/\/\S+$/i.test(text);
}

function assertLinkedIn(url: URL) {
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new LinkedInError("Only LinkedIn post links are supported. For anything else, paste the text of the post.");
  }
}

async function fetchPage(link: string) {
  let url = new URL(link);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertLinkedIn(url);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        "Accept-Language": "en",
      },
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) break;
    const html = await response.text();
    return html.length > MAX_BYTES ? html.slice(0, MAX_BYTES) : html;
  }
  throw new LinkedInError("LinkedIn would not open that link. Check it is a public post, or paste the text instead.");
}

function findPostText(html: string) {
  const scripts = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const [, json] of scripts) {
    try {
      const data = JSON.parse(json);
      const body = data?.articleBody ?? data?.text;
      if (typeof body === "string" && body.trim()) return body;
    } catch {
      // Not the block we want. Keep looking.
    }
  }
  return null;
}

export async function getLinkedInPost(link: string) {
  let html: string;
  try {
    html = await fetchPage(link);
  } catch (error) {
    if (error instanceof LinkedInError) throw error;
    throw new LinkedInError("Could not reach LinkedIn. Try again, or paste the text of the post.");
  }
  const text = findPostText(html);
  if (!text) {
    throw new LinkedInError("LinkedIn did not share the text of this post. It may be private. Paste the text instead.");
  }
  // LinkedIn pads lines with trailing spaces.
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
