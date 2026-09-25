import { describe, expect, test } from "bun:test";
import { mockClassify, MOCK_QUESTION_COUNT } from "@/lib/jev/mock";
import { QUESTION_COUNT } from "@/lib/jev/questions";
import { rawState } from "@/lib/decide";
import { intentResultSchema } from "@/lib/jev/types";

const EXAMPLES: [string, string][] = [
  ["linkedin campaign october hacker house taikai.network/hh2", "utm"],
  ["newsletter recap https://taikai.network", "utm"],
  ["utm google ads spring promo layerx.xyz", "utm"],
  ["post about how we ran hacker house with dehouse", "idea"],
  ["carousel about 5 lessons from web summit", "idea"],
  ["idea: behind the scenes of our ai content engine", "idea"],
  ["met Ana from Sonae, interested in AI workshop", "lead"],
  ["spoke with joão at galp, wants a hackathon", "lead"],
  ["We ran a hacker house for 40 builders. Here is what we learned in 48 hours. Food matters more than you think, and so does sleep. Thanks to everyone who came.", "draft"],
  ["https://www.linkedin.com/posts/carlos_hackathon-activity-123", "draft"],
  ["linkedin ads 500 spent, 12k impressions, 340 clicks, 25 leads", "metrics"],
  ["promote hacker house on nov 15", "promo"],
  ['subject: "Your hacker house recap" vs "What 40 builders shipped in 48h"', "abtest"],
  ["dinner with priya friday 8pm", "event"],
  ["call with the dehouse team tuesday 3pm on meet", "event"],
  ["remind me to call mom tomorrow", "reminder"],
  ["remind me to send the newsletter friday 9am", "reminder"],
  ["buy milk, eggs, bread and coffee", "todo"],
  ["launch checklist: brief, visuals, landing page, emails", "todo"],
  ["25 min focus", "timer"],
  ["timer 10 minutes", "timer"],
  ["18% of 3450", "calc"],
  ["(120+80)*3", "calc"],
  ["rahul 98200 12345 rahul@mail.com", "contact"],
  ["https://vercel.com/blog check later", "link"],
  ["3pm pst in ist", "timezone"],
  ["what time is it in tokyo", "timezone"],
];

describe("mock classifier", () => {
  test("question count matches schema", () => expect(MOCK_QUESTION_COUNT).toBe(QUESTION_COUNT));
  for (const [text, intent] of EXAMPLES) {
    test(`${text} → ${intent} (committed)`, () => {
      const r = mockClassify(text);
      expect(intentResultSchema.parse(r)).toBeTruthy();
      expect(r.intent.value).toBe(intent as never);
      expect(rawState(r)).toEqual({ kind: "committed", intent } as never);
    });
  }
  test("short text → none", () => expect(mockClassify("a").intent.value).toBe("none"));
  test("on zoom → video_call", () => expect(mockClassify("dinner with priya friday 8pm on zoom").signals.eventMode.value).toBe("video_call"));
  test("urgent → high urgency", () => expect(mockClassify("remind me to pay rent tomorrow urgent").signals.urgency.score).toBeGreaterThan(1.2));
  test("content idea brand and format", () => {
    const r = mockClassify("carousel about hacker house lessons");
    expect(r.signals.brand.value).toBe("taikai");
    expect(r.signals.contentFormat.value).toBe("carousel");
  });
  test("plain text with no card → none", () => expect(mockClassify("the city felt quiet this morning").intent.value).toBe("none"));
});
