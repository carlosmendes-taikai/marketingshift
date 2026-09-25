import type { Experimental_EvaluationQuestion as EvaluationQuestion } from "ai";

// Question builders in the Vercel AI SDK's evaluate format ("noul" is a yes/no question).
const choice = <const T extends Record<string, string>>(instructions: string, criteria: T) =>
  ({ type: "choice", instructions, criteria }) as const;
const score = <const T extends readonly [string, string, ...string[]]>(instructions: string, criteria: T) =>
  ({ type: "score", instructions, criteria }) as const;
const noul = (instructions: string) => ({ type: "boolean", instructions }) as const;

/**
 * The full Jev question schema. Jev evaluates every question in parallel against
 * the same state, so we ask every signal every time (speculative fan-out) and let
 * code decide which ones matter for the chosen intent.
 *
 * Criteria rules: self-contained, non-overlapping, every signal has an escape option,
 * and never ask Jev to extract values, count or do date math.
 */
export const questions = {
  // ── Which UI ────────────────────────────────────────────────
  intent: choice("What is the person trying to create with this text", {
    utm: "Building a tracked campaign link: a web address together with a traffic source such as LinkedIn, a newsletter or ads, or a campaign name",
    idea: "Noting an idea for a piece of content to publish, such as a post, carousel, article or video about a topic",
    lead: "Logging a person they met or spoke with as a potential client or partner, often with their company and what they are interested in",
    draft: "A social media post to review and grade: a finished draft of several full sentences or paragraphs, or a link to a LinkedIn post (linkedin.com/posts or lnkd.in)",
    metrics: "Reporting the results of a campaign or post with numbers such as money spent, impressions, clicks, leads or sign-ups",
    promo: "Planning how to promote an upcoming event, launch or webinar they are organizing, on a given date",
    abtest: "Comparing two or more alternative subject lines, headlines or calls to action to pick the better one",
    event: "Scheduling a meeting, meal, call or gathering they will attend at a time, usually with other people",
    reminder: "Asking to be reminded to do a single task themselves, e.g. 'remind me to…'",
    todo: "Listing several separate things to do or buy",
    timer: "Starting a timer, countdown, focus session or stopwatch for a duration",
    calc: "A math calculation or percentage",
    contact: "Saving a person's name with a phone number or email address",
    link: "Saving a web link to read or revisit later, optionally with a note, with no campaign or traffic source, and not a LinkedIn post",
    timezone: "Converting a time of day between time zones or cities, or asking the time somewhere",
    none: "Too short, unclear, unfinished or none of the above",
  }),

  readiness: score("How complete is this input for what the person is creating", [
    "Just started, key details missing",
    "Partially specified, some details present",
    "Fully specified, ready to act on",
  ]),

  // ── Signals that pick the UI variant ────────────────────────
  recurring: noul("The text describes something that repeats on a schedule"),
  urgency: score("How urgent or time-sensitive the text sounds", [
    "Not urgent at all",
    "Somewhat time-sensitive",
    "Urgent, needs attention immediately",
  ]),
  eventMode: choice("How the gathering or meeting would take place", {
    in_person: "Meeting physically at a place",
    video_call: "A video call such as Zoom, Meet or FaceTime",
    phone_call: "A phone call",
    unspecified: "Not mentioned or not a meeting",
  }),
  timerKind: choice("What kind of timer is wanted", {
    countdown: "A plain countdown for a duration",
    focus: "A focus or deep-work session",
    break: "A rest or break",
    stopwatch: "Counting up with no end time",
  }),
  isShoppingList: noul("The listed items are things to buy"),

  // ── Content ideas: which brand publishes it, in which format ─
  brand: choice("Which brand should publish this content idea", {
    layerx: "LayerX, the technology company: its products, services, clients, partnerships and team",
    taikai: "TAIKAI, the hackathon and open innovation platform: hackathons, builders, challenges and community events such as Hacker House",
    ai_cmo: "/ai-cmo, a personal brand about using AI in marketing: AI tools, experiments, workflows and lessons from a CMO",
  }),
  contentFormat: choice("Which format suits this content idea best", {
    linkedin_post: "A short LinkedIn text post: one story, opinion or announcement",
    carousel: "A LinkedIn carousel: a step-by-step list, framework or visual breakdown across slides",
    article: "A long-form article or blog post: an in-depth guide, analysis or case study",
    video: "A video: a demo, interview, behind the scenes or anything best shown on camera",
  }),
} satisfies Record<string, EvaluationQuestion>;

export const QUESTION_COUNT = Object.keys(questions).length;
