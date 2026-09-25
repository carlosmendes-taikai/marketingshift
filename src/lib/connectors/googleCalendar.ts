import type { EventData } from "@/lib/parse/event";
import type { LeadData } from "@/lib/parse/lead";
import type { ReminderData } from "@/lib/parse/reminder";

/** What Google Calendar's "create event" link needs. Timed entries are converted to UTC. */
type CalendarEntry = {
  title: string;
  start: Date | null;
  hasTime: boolean;
  minutes: number;
  details?: string;
  location?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const dayStamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

function calendarDates(start: Date, hasTime: boolean, minutes: number) {
  if (hasTime) return `${utcStamp(start)}/${utcStamp(new Date(start.getTime() + minutes * 60_000))}`;
  const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return `${dayStamp(start)}/${dayStamp(next)}`;
}

/** A prefilled Google Calendar link. No login or API key: the person confirms in Google Calendar. */
export function googleCalendarUrl(entry: CalendarEntry) {
  const params = new URLSearchParams({ action: "TEMPLATE", text: entry.title });
  if (entry.start) params.set("dates", calendarDates(entry.start, entry.hasTime, entry.minutes));
  if (entry.details) params.set("details", entry.details);
  if (entry.location) params.set("location", entry.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function eventCalendarUrl(d: EventData) {
  const details = [d.people.length ? `With ${d.people.join(", ")}` : "", d.link ? `On ${d.link}` : ""].filter(Boolean).join("\n");
  return googleCalendarUrl({
    title: d.title || "Event",
    start: d.date,
    hasTime: d.hasTime,
    minutes: 60,
    details: details || undefined,
    location: d.location ?? d.link ?? undefined,
  });
}

export function reminderCalendarUrl(d: ReminderData) {
  return googleCalendarUrl({ title: d.task || "Reminder", start: d.when, hasTime: d.hasTime, minutes: 15 });
}

export function leadCalendarUrl(d: LeadData) {
  const who = [d.name || "lead", d.company && `(${d.company})`].filter(Boolean).join(" ");
  return googleCalendarUrl({
    title: `Follow up with ${who}`,
    start: d.followUp,
    hasTime: false,
    minutes: 0,
    details: d.interest ? `Interested in: ${d.interest}` : undefined,
  });
}
