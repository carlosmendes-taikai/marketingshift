import { z } from "zod";
import { classifierMode } from "@/lib/jev/client";
import { gradeOptions, gradePost } from "@/lib/jev/grade";
import type { OptionsGrade, PostGrade } from "@/lib/jev/gradeTypes";
import { getLinkedInPost, isUrl, LinkedInError } from "@/lib/jev/linkedin";
import { LRU } from "@/lib/lru";
import { allow } from "@/lib/rateLimit";

export const runtime = "nodejs";

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("post"), post: z.string().trim().min(1).max(6000) }),
  z.object({
    type: z.literal("options"),
    kind: z.enum(["subject", "headline", "cta"]),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
  }),
]);

const cache = new LRU<string, PostGrade | OptionsGrade>(200);

/** Second Jev call for cards that need a judgment on the whole text: post drafts and A/B tests. */
export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Nothing to grade yet" }, { status: 400 });
  if (classifierMode().mode === "offline") {
    return Response.json({ error: "Jev is offline, so grading is unavailable" }, { status: 503 });
  }

  const key = JSON.stringify(body.data);
  const hit = cache.get(key);
  if (hit) return Response.json(hit);
  if (!allow("grade", request)) {
    return Response.json({ error: "You've graded a lot in a short time. Try again in a minute." }, { status: 429 });
  }

  try {
    let result: PostGrade | OptionsGrade;
    if (body.data.type === "post") {
      const input = body.data.post;
      const post = isUrl(input) ? await getLinkedInPost(input) : input;
      result = await gradePost(post, request.signal);
    } else {
      result = await gradeOptions(body.data.kind, body.data.options, request.signal);
    }
    cache.set(key, result);
    return Response.json(result);
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    if (err instanceof LinkedInError) return Response.json({ error: err.message }, { status: 422 });
    console.warn(`[grade] failed: ${err instanceof Error ? err.message : String(err)}`);
    return Response.json({ error: "Jev could not grade this right now. Try again in a moment." }, { status: 502 });
  }
}
