import { z } from "zod";
import { cardDetails } from "@/lib/connectors/cardDetails";
import { SHEETS_URL_RE } from "@/lib/connectors/sheetsLink";
import { INTENT_KEYS } from "@/lib/jev/types";
import { allow } from "@/lib/rateLimit";

export const runtime = "nodejs";

const sendSchema = z.object({
  /** The visitor's own Apps Script web app. Only Google Apps Script URLs are ever called. */
  url: z.string().regex(SHEETS_URL_RE),
  intent: z.enum(INTENT_KEYS).exclude(["none"]),
  label: z.string().max(100),
  summary: z.string().max(1000),
  text: z.string().max(6000),
  data: z.record(z.string(), z.unknown()),
});

/**
 * Appends one card as a row in the visitor's own Google Sheet, through the Apps Script web app
 * they connected (see docs/google-sheets.md). The browser can't read Apps Script replies directly
 * (CORS), so the server passes the card along and reports back. The URL is never stored.
 */
export async function POST(request: Request) {
  if (!allow("sheets", request)) return Response.json({ error: "Too many cards sent at once. Try again in a minute." }, { status: 429 });
  const raw = await request.text();
  if (raw.length > 40_000) return Response.json({ error: "Card is too large" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  const body = sendSchema.safeParse(json);
  if (!body.success) return Response.json({ error: "Connect a Google Sheet first" }, { status: 400 });

  const { url, data, ...card } = body.data;
  try {
    const res = await fetch(url, {
      method: "POST",
      // Apps Script answers with a redirect to the script's output; fetch follows it.
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ ...card, details: cardDetails(data), data, sentAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    const reply = await res.json().catch(() => null);
    if (!res.ok || !reply?.ok) throw new Error(`Google Sheets answered ${res.status}`);
    return Response.json({ ok: true });
  } catch (err) {
    console.warn(`[sheets] send failed: ${err instanceof Error ? err.message : String(err)}`);
    return Response.json({ error: "Your Google Sheet did not accept the card. Check the link and that access is set to Anyone." }, { status: 502 });
  }
}
