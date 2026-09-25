import { describe, expect, test } from "bun:test";
import { eventCalendarUrl, googleCalendarUrl, reminderCalendarUrl } from "@/lib/connectors/googleCalendar";
import { parseEvent } from "@/lib/parse/event";
import { parseReminder } from "@/lib/parse/reminder";

const params = (url: string) => new URL(url).searchParams;
const REF = new Date(2026, 8, 25, 10, 0); // Friday 25 Sep 2026, 10:00 local

describe("Google Calendar links", () => {
  test("timed event: one hour, in UTC, with people and call link", () => {
    const d = parseEvent("dinner with priya tomorrow 8pm on zoom", REF);
    const p = params(eventCalendarUrl(d));
    expect(p.get("action")).toBe("TEMPLATE");
    expect(p.get("text")).toBe("Dinner");
    const start = new Date(2026, 8, 26, 20, 0);
    const end = new Date(2026, 8, 26, 21, 0);
    const stamp = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    expect(p.get("dates")).toBe(`${stamp(start)}/${stamp(end)}`);
    expect(p.get("details")).toContain("With Priya");
    expect(p.get("location")).toBe("Zoom");
  });

  test("date without a time becomes an all-day entry", () => {
    const p = params(googleCalendarUrl({ title: "Launch day", start: new Date(2026, 9, 1), hasTime: false, minutes: 60 }));
    expect(p.get("dates")).toBe("20261001/20261002");
  });

  test("no date leaves the date for Google Calendar to pick", () => {
    const p = params(eventCalendarUrl(parseEvent("coffee with ana", REF)));
    expect(p.has("dates")).toBe(false);
  });

  test("reminder uses the task as the title", () => {
    const p = params(reminderCalendarUrl(parseReminder("remind me to send the newsletter tomorrow 9am", REF)));
    expect(p.get("text")).toBe("Send the newsletter");
    expect(p.get("dates")).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });
});
