import { z } from "zod";
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
 * Posts one card to the Zapier "Catch Hook" URL in ZAPIER_WEBHOOK_URL.
 * The URL is read on the server only, so it never reaches the browser.
 */
export async function POST(request: Request) {
  const url = process.env.ZAPIER_WEBHOOK_URL?.trim();
  if (!url || !/^https:\/\/hooks\.zapier\.com\//.test(url)) {
    return Response.json({ error: "Zapier is not set up yet" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > 20_000) return Response.json({ error: "Card is too large" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  const body = sendSchema.safeParse(json);
  if (!body.success) return Response.json({ error: "Expected a card" }, { status: 400 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body.data, sentAt: new Date().toISOString(), app: "Marketingshift" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Zapier answered ${res.status}`);
    return Response.json({ ok: true });
  } catch (err) {
    console.warn(`[zapier] send failed: ${err instanceof Error ? err.message : String(err)}`);
    return Response.json({ error: "Zapier did not accept the card" }, { status: 502 });
  }
}
