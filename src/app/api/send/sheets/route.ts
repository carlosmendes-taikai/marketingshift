import { z } from "zod";
import { cardDetails } from "@/lib/connectors/cardDetails";
import { INTENT_KEYS } from "@/lib/jev/types";

export const runtime = "nodejs";

const sendSchema = z.object({
  intent: z.enum(INTENT_KEYS).exclude(["none"]),
  label: z.string().max(100),
  summary: z.string().max(1000),
  text: z.string().max(2000),
  data: z.record(z.string(), z.unknown()),
});

/**
 * Appends one card as a row in Google Sheets, through the Apps Script web app in
 * SHEETS_WEBHOOK_URL (see docs/google-sheets.md). The URL is read on the server only.
 */
export async function POST(request: Request) {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    return Response.json({ error: "Google Sheets is not set up yet" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > 20_000) return Response.json({ error: "Card is too large" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  const body = sendSchema.safeParse(json);
  if (!body.success) return Response.json({ error: "Expected a card" }, { status: 400 });

  const { data, ...card } = body.data;
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
    return Response.json({ error: "Google Sheets did not accept the card" }, { status: 502 });
  }
}
