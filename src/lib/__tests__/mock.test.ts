import { describe, expect, test } from "bun:test";
import { mockClassify, MOCK_QUESTION_COUNT } from "@/lib/jev/mock";
import { QUESTION_COUNT } from "@/lib/jev/questions";
import { rawState } from "@/lib/decide";
import { intentResultSchema } from "@/lib/jev/types";

const EXAMPLES: [string, string][] = [
  ["linkedin campaign spring launch acme.com/launch", "utm"],
  ["newsletter recap https://acme.com", "utm"],
  ["utm google ads spring promo acme.com", "utm"],
  ["post about how we doubled our newsletter signups", "idea"],
  ["carousel about 5 lessons from our first conference", "idea"],
  ["idea: behind the scenes of our ai content engine", "idea"],
  ["met Ana from Acme, interested in a product demo", "lead"],
  ["spoke with sam at globex, wants a workshop", "lead"],
  ["We rebuilt our onboarding in 30 days. Here is what we learned along the way. Fewer steps matter more than you think, and so does clear copy. Thanks to everyone who tested it.", "draft"],
  ["https://www.linkedin.com/posts/someone_onboarding-activity-123", "draft"],
  ["linkedin ads 500 spent, 12k impressions, 340 clicks, 25 leads", "metrics"],
  ["promote our spring webinar on nov 15", "promo"],
  ['subject: "Your monthly recap" vs "3 ideas that doubled our signups"', "abtest"],
  ["dinner with priya friday 8pm", "event"],
  ["call with the design team tuesday 3pm on meet", "event"],
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
  test("content idea format", () => {
    const r = mockClassify("carousel about 5 onboarding lessons");
    expect(r.signals.contentFormat.value).toBe("carousel");
  });
  test("plain text with no card → none", () => expect(mockClassify("the city felt quiet this morning").intent.value).toBe("none"));
});
