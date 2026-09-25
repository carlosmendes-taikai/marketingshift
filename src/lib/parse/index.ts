import type { CardIntent } from "@/lib/jev/types";
import { completeCalc, parseCalc, type CalcData } from "./calc";
import { completeContact, parseContact, type ContactData } from "./contact";
import { completeEvent, parseEvent, type EventData } from "./event";
import { completeIdea, parseIdea, type IdeaData } from "./idea";
import { completeLead, parseLead, type LeadData } from "./lead";
import { completeLink, parseLink, type LinkData } from "./link";
import { completeReminder, parseReminder, type ReminderData } from "./reminder";
import { completeTimer, parseTimer, type TimerData } from "./timer";
import { completeTimezone, parseTimezone, type TimezoneData } from "./timezone";
import { completeTodo, parseTodo, type TodoData } from "./todo";
import { completeUtm, parseUtm, type UtmData } from "./utm";

export type ParsedMap = {
  utm: UtmData;
  idea: IdeaData;
  lead: LeadData;
  event: EventData;
  reminder: ReminderData;
  todo: TodoData;
  timer: TimerData;
  calc: CalcData;
  contact: ContactData;
  link: LinkData;
  timezone: TimezoneData;
};

export type ParseContext = { ref?: Date };

type Parser<K extends CardIntent> = {
  parse: (text: string, ctx: ParseContext) => ParsedMap[K];
  complete: (data: ParsedMap[K]) => number;
};

export const parsers: { [K in CardIntent]: Parser<K> } = {
  utm: { parse: (t) => parseUtm(t), complete: completeUtm },
  idea: { parse: (t) => parseIdea(t), complete: completeIdea },
  lead: { parse: (t, c) => parseLead(t, c.ref), complete: completeLead },
  event: { parse: (t, c) => parseEvent(t, c.ref), complete: completeEvent },
  reminder: { parse: (t, c) => parseReminder(t, c.ref), complete: completeReminder },
  todo: { parse: (t) => parseTodo(t), complete: completeTodo },
  timer: { parse: (t) => parseTimer(t), complete: completeTimer },
  calc: { parse: (t) => parseCalc(t), complete: completeCalc },
  contact: { parse: (t) => parseContact(t), complete: completeContact },
  link: { parse: (t) => parseLink(t), complete: completeLink },
  timezone: { parse: (t, c) => parseTimezone(t, c.ref), complete: completeTimezone },
};

export function parseFor<K extends CardIntent>(intent: K, text: string, ctx: ParseContext = {}): ParsedMap[K] {
  return parsers[intent].parse(text, ctx);
}

/** 0..1, how filled-in the parsed card is. */
export function completenessFor<K extends CardIntent>(intent: K, text: string, ctx: ParseContext = {}): number {
  const p = parsers[intent];
  return p.complete(p.parse(text, ctx));
}
