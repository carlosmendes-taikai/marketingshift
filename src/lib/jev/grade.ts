import "server-only";
import { experimental_evaluate as evaluate, type Experimental_EvaluationQuestion as EvaluationQuestion } from "ai";
import { AB_KIND_LABEL, type AbKind } from "@/lib/parse/abtest";
import { AUDIENCE_OPTIONS, type Audience, HOOK_LABELS, type OptionsGrade, type PostGrade, STRENGTH_LABELS } from "./gradeTypes";

const MODEL = process.env.JEV_MODEL || "typesafe-ai/jev";
// Grading runs once per card, not per keystroke, so it can wait longer than intent classification.
const TIMEOUT_MS = 8000;

/** 1 when all probability sits on one option, 0 when it is spread evenly. */
function concentration(probabilities: Record<string, number> | undefined) {
  const values = Object.values(probabilities ?? {});
  if (values.length < 2) return 0;
  const peak = Math.max(...values);
  return Math.max(0, Math.min(1, (values.length * peak - 1) / (values.length - 1)));
}

// The post grader's questions, unchanged.
const HOOK_LEVELS = [
  "Generic or forgettable: a first line a professional scrolls past without noticing",
  "Weak: a first line with a faint point of interest, but vague or predictable",
  "Decent: a first line that is clear and relevant, giving a mild reason to keep reading",
  "Strong and specific: a first line with a concrete claim, number, tension, or story that pulls a professional in",
  "Impossible to scroll past: a first line so specific and surprising that a professional has to read the next line",
];

const postQuestions = {
  hook: {
    type: "score" as const,
    instructions:
      'How strongly does the first line of this LinkedIn post, in `firstLine`, make a busy professional want to keep reading? Judge the first line on its own, as it appears in the feed before "see more".',
    criteria: HOOK_LEVELS,
  },
  audience: {
    type: "choice" as const,
    instructions: "Who is this LinkedIn post, in `post`, mainly written for?",
    criteria: { ...AUDIENCE_OPTIONS },
  },
  soundsAi: {
    type: "boolean" as const,
    instructions: "Does this LinkedIn post, in `post`, read like it was written by an AI tool rather than by a person?",
    criteria: {
      true: "The post reads as AI-written: generic phrasing, stock transitions, tidy rhythm with no personal texture, buzzwords, or formulaic structure.",
      false: "The post reads as written by a person: a specific voice, personal details, natural quirks, or opinions only this writer would have.",
    },
  },
} satisfies Record<string, EvaluationQuestion>;

export async function gradePost(post: string, signal?: AbortSignal): Promise<PostGrade> {
  const firstLine = post.split("\n").find((l) => l.trim())?.trim() ?? post;
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await evaluate({
    model: MODEL,
    state: { firstLine, post },
    questions: postQuestions,
    maxRetries: 1,
    abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const { hook, audience, soundsAi } = res.answers;
  const reported = res.providerMetadata?.typesafe?.confidence as Record<string, number> | undefined;

  // Jev scores levels 0 to 4. Shift to 1 to 5 for display.
  const hookScore = hook.score + 1;
  const level = Math.min(HOOK_LABELS.length, Math.max(1, Math.round(hookScore)));
  const audienceProbabilities = Object.fromEntries(
    Object.keys(AUDIENCE_OPTIONS).map((k) => [k, audience.probabilities?.[k as Audience] ?? 0]),
  ) as Record<Audience, number>;

  return {
    post,
    hook: { score: hookScore, label: HOOK_LABELS[level - 1], confidence: reported?.hook ?? concentration(hook.probabilities) },
    audience: {
      choice: audience.choice,
      probabilities: audienceProbabilities,
      confidence: reported?.audience ?? concentration(audienceProbabilities),
    },
    // Booleans carry no confidence. Use how far the answer leans away from 50/50.
    soundsAi: { probability: soundsAi.probability, confidence: Math.max(soundsAi.probability, 1 - soundsAi.probability) },
  };
}

const LETTERS = ["a", "b", "c", "d"] as const;

const AUDIENCE_FOR: Record<AbKind, string> = {
  subject: "open this email",
  headline: "click or keep reading",
  cta: "click this button",
};

/** Which option wins, and how strong each one is on its own. */
export async function gradeOptions(kind: AbKind, options: string[], signal?: AbortSignal): Promise<OptionsGrade> {
  const opts = options.slice(0, LETTERS.length);
  const what = AB_KIND_LABEL[kind].toLowerCase();
  const state = Object.fromEntries(opts.map((o, i) => [`option_${LETTERS[i]}`, o]));
  const questions: Record<string, EvaluationQuestion> = {
    winner: {
      type: "choice",
      instructions: `Which ${what} would make more busy professionals ${AUDIENCE_FOR[kind]}?`,
      criteria: Object.fromEntries(opts.map((o, i) => [LETTERS[i], o])),
    },
  };
  opts.forEach((_, i) => {
    questions[`strength_${LETTERS[i]}`] = {
      type: "score",
      instructions: `How likely is the ${what} in \`option_${LETTERS[i]}\` to make a busy professional ${AUDIENCE_FOR[kind]}? Judge it on its own: specificity, curiosity and clarity.`,
      criteria: [
        "Forgettable: vague, generic or confusing",
        "Weak: clear but gives little reason to act",
        "Decent: clear and relevant with a mild pull",
        "Strong: specific, with a concrete benefit, number or tension",
        "Irresistible: so specific and intriguing that most would act",
      ],
    };
  });

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await evaluate({
    model: MODEL,
    state,
    questions,
    maxRetries: 1,
    abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const answers = res.answers as Record<string, { type: string; choice?: string; score?: number; probabilities?: Record<string, number> }>;
  const winner = answers.winner;
  const reported = res.providerMetadata?.typesafe?.confidence as Record<string, number> | undefined;

  return {
    kind,
    options: opts.map((text, i) => {
      const score = (answers[`strength_${LETTERS[i]}`]?.score ?? 0) + 1;
      const level = Math.min(STRENGTH_LABELS.length, Math.max(1, Math.round(score)));
      return { text, winProbability: winner.probabilities?.[LETTERS[i]] ?? (winner.choice === LETTERS[i] ? 1 : 0), score, label: STRENGTH_LABELS[level - 1] };
    }),
    winner: LETTERS.indexOf(winner.choice as (typeof LETTERS)[number]),
    confidence: reported?.winner ?? concentration(winner.probabilities),
  };
}
