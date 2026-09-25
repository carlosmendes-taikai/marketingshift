import {
  AlarmClock,
  Bell,
  Calculator,
  CalendarDays,
  CircleAlert,
  Coffee,
  Contact,
  Focus,
  Globe,
  Lightbulb,
  Link2,
  ListChecks,
  Repeat,
  ShoppingCart,
  Tags,
  Timer,
  UserRound,
} from "lucide-react";
import type { CardIntent } from "@/lib/jev/types";
import type { ParsedMap } from "@/lib/parse";
import { BRAND_LABEL, FORMAT_LABEL } from "@/lib/parse/marketing";
import { formatClock } from "@/lib/parse/timer";
import { formatIn } from "@/lib/parse/timezone";
import type { GatedSignals } from "@/lib/signals";
import { CalcCard } from "./CalcCard";
import { ContactCard } from "./ContactCard";
import { EventCard } from "./EventCard";
import { IdeaCard } from "./IdeaCard";
import { LeadCard } from "./LeadCard";
import { LinkCard } from "./LinkCard";
import { ReminderPill } from "./ReminderPill";
import { formatWhen } from "./shared";
import { TimerRing } from "./TimerRing";
import { TimezoneCard } from "./TimezoneCard";
import { TodoList } from "./TodoList";
import type { BadgeSpec, Registry } from "./types";
import { UtmCard } from "./UtmCard";

const repeats = (s: GatedSignals): BadgeSpec[] => (s.recurring ? [{ id: "repeat", label: "Repeats", icon: Repeat }] : []);
const urgent = (s: GatedSignals): BadgeSpec[] => (s.urgent ? [{ id: "urgent", label: "Urgent", icon: CircleAlert, tone: "caution" }] : []);

/**
 * intent → everything needed to render it. Adding a UI type means one entry here,
 * one criterion in questions.ts, one parser and one component.
 * Order is the order of the "/" palette: marketing cards first.
 */
export const registry: Registry = {
  utm: {
    label: "UTM link",
    example: "linkedin campaign october hacker house taikai.network/hh2",
    icon: Tags,
    signals: [],
    summary: (d) => d.tagged ?? ([d.source, d.campaign].filter(Boolean).join(" · ") || "UTM link"),
    Component: UtmCard,
  },
  idea: {
    label: "Content idea",
    example: "post about how we ran hacker house with dehouse",
    icon: Lightbulb,
    signals: ["brand", "contentFormat"],
    resolve: (d, s) => ({ ...d, brand: d.brand ?? s.brand, format: d.format ?? s.contentFormat }),
    summary: (d) =>
      [d.idea || "Content idea", d.brand && BRAND_LABEL[d.brand], d.format && FORMAT_LABEL[d.format]].filter(Boolean).join(" · "),
    Component: IdeaCard,
  },
  lead: {
    label: "Lead",
    example: "met Ana from Sonae, interested in AI workshop",
    icon: UserRound,
    signals: [],
    summary: (d) =>
      [
        [d.name || "Lead", d.company].filter(Boolean).join(", "),
        d.interest,
        `Follow up ${formatWhen(d.followUp, false).day}`,
      ]
        .filter(Boolean)
        .join(" · "),
    Component: LeadCard,
  },
  event: {
    label: "Event",
    example: "call with the dehouse team tuesday 3pm on meet",
    icon: CalendarDays,
    signals: ["eventMode", "recurring"],
    badges: repeats,
    summary: (d) => [d.title || "Event", d.date && Object.values(formatWhen(d.date, d.hasTime)).filter(Boolean).join(", ")].filter(Boolean).join(" · "),
    Component: EventCard,
  },
  reminder: {
    label: "Reminder",
    example: "remind me to send the newsletter friday 9am",
    icon: Bell,
    signals: ["urgency", "recurring"],
    badges: (s) => [...urgent(s), ...repeats(s)],
    edge: (s) => (s.urgent ? "var(--caution)" : null),
    summary: (d) => [d.task || "Reminder", d.when && formatWhen(d.when, d.hasTime).day].filter(Boolean).join(" · "),
    Component: ReminderPill,
  },
  todo: {
    label: "Checklist",
    example: "launch checklist: brief, visuals, landing page, emails",
    icon: ListChecks,
    signals: ["isShoppingList", "urgency"],
    headerIcon: (s) => (s.isShoppingList ? ShoppingCart : ListChecks),
    headerLabel: (s) => (s.isShoppingList ? "Shopping" : "Checklist"),
    badges: urgent,
    summary: (d) => `${d.items.length} item${d.items.length === 1 ? "" : "s"} · ${d.items.slice(0, 3).join(", ")}`,
    Component: TodoList,
  },
  timer: {
    label: "Timer",
    example: "25 min focus",
    icon: Timer,
    signals: ["timerKind"],
    headerIcon: (s) => (s.timerKind === "focus" ? Focus : s.timerKind === "break" ? Coffee : s.timerKind === "stopwatch" ? AlarmClock : Timer),
    headerLabel: (s) => (s.timerKind === "focus" ? "Focus" : s.timerKind === "break" ? "Break" : s.timerKind === "stopwatch" ? "Stopwatch" : "Timer"),
    summary: (d) => [d.label || "Timer", d.seconds && formatClock(d.seconds)].filter(Boolean).join(" · "),
    Component: TimerRing,
  },
  calc: {
    label: "Calculate",
    example: "18% of 3450",
    icon: Calculator,
    signals: [],
    summary: (d) => (d.result !== null ? `${d.expression} = ${d.result.toLocaleString("en-US")}` : d.expression),
    Component: CalcCard,
  },
  contact: {
    label: "Contact",
    example: "ana silva +351 912 345 678 ana@sonae.pt",
    icon: Contact,
    signals: [],
    summary: (d) => [d.name || "Contact", d.phone ?? d.email].filter(Boolean).join(" · "),
    Component: ContactCard,
  },
  link: {
    label: "Bookmark",
    example: "https://vercel.com/blog check later",
    icon: Link2,
    signals: [],
    summary: (d) => [d.domain ?? "Link", d.note].filter(Boolean).join(" · "),
    Component: LinkCard,
  },
  timezone: {
    label: "Time zone",
    example: "3pm lisbon in new york",
    icon: Globe,
    signals: [],
    summary: (d) =>
      d.to && d.instant ? `${formatIn(d.from.tz, d.instant)} ${d.from.label} → ${formatIn(d.to.tz, d.instant)} ${d.to.label}` : "Time zones",
    Component: TimezoneCard,
  },
};

export const CARD_INTENTS = Object.keys(registry) as CardIntent[];

/** A card label mid-sentence: "Add content idea", but acronyms stay as written: "Add UTM link". */
export const inSentence = (label: string) => (/^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1));

/** The card's data with Jev-decided fields filled in, for summaries and "Send to". */
export function resolved<K extends CardIntent>(intent: K, data: ParsedMap[K], signals: GatedSignals) {
  const def = registry[intent];
  return def.resolve ? def.resolve(data, signals) : data;
}
