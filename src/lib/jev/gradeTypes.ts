import type { AbKind } from "@/lib/parse/abtest";

// Shared by the grading route (server) and the cards (browser).

export const HOOK_LABELS = ["Forgettable", "Weak", "Decent", "Strong", "Impossible to scroll past"] as const;
export const STRENGTH_LABELS = ["Forgettable", "Weak", "Decent", "Strong", "Irresistible"] as const;

export const AUDIENCE_OPTIONS = {
  founders: "Founders and CEOs building or running a company: fundraising, hiring, strategy, running a startup",
  marketers: "Marketers and growth people: brand, content, campaigns, demand generation, positioning",
  developers: "Software developers and engineers: code, tools, technical architecture, engineering practice",
  unclear: "No single one of these groups is clearly the main audience, or the post is for a general audience",
} as const;
export type Audience = keyof typeof AUDIENCE_OPTIONS;
export const AUDIENCE_LABEL: Record<Audience, string> = {
  founders: "Founders",
  marketers: "Marketers",
  developers: "Developers",
  unclear: "No clear audience",
};

/** Jev is "not sure" below this confidence. */
export const CONFIDENCE_FLOOR = 0.6;

export type PostGrade = {
  /** The text that was graded. Differs from the input when a LinkedIn link was pasted. */
  post: string;
  hook: { score: number; label: string; confidence: number };
  audience: { choice: Audience; probabilities: Record<Audience, number>; confidence: number };
  soundsAi: { probability: number; confidence: number };
};

export type OptionsGrade = {
  kind: AbKind;
  options: { text: string; winProbability: number; score: number; label: string }[];
  /** Index of the winning option. */
  winner: number;
  confidence: number;
};
