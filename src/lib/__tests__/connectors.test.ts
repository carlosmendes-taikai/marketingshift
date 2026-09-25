import { describe, expect, test } from "bun:test";
import { cardDetails } from "@/lib/connectors/cardDetails";
import { eventCalendarUrl, googleCalendarUrl, leadCalendarUrl, reminderCalendarUrl } from "@/lib/connectors/googleCalendar";
import { parseEvent } from "@/lib/parse/event";
import { parseLead } from "@/lib/parse/lead";
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

describe("Lead follow-up", () => {
  test("all-day entry on the follow-up date", () => {
    const p = params(leadCalendarUrl(parseLead("met Ana from Acme, interested in a product demo", REF)));
    expect(p.get("text")).toBe("Follow up with Ana (Acme)");
    expect(p.get("dates")).toBe("20260930/20261001"); // Fri 25 Sep + 3 working days = Wed 30 Sep
    expect(p.get("details")).toBe("Interested in: Product demo");
  });
});

describe("Timed follow-up with guests", () => {
  test("30-minute slot at the given time, guests prefilled", () => {
    const p = params(leadCalendarUrl(parseLead("met james from acme today, interested in our playbook. follow up with james@acme.com next monday 9 am", REF)));
    expect(p.get("text")).toBe("Follow up with James (Acme)");
    const stamp = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    expect(p.get("dates")).toBe(`${stamp(new Date(2026, 8, 28, 9, 0))}/${stamp(new Date(2026, 8, 28, 9, 30))}`);
    expect(p.get("add")).toBe("james@acme.com");
  });
  test("event guests", () => {
    const p = params(eventCalendarUrl(parseEvent("call with ana@acme.com and bo@globex.com tuesday 3pm", REF)));
    expect(p.get("add")).toBe("ana@acme.com,bo@globex.com");
  });
});

describe("Card details for Google Sheets", () => {
  test("readable lines, empty fields left out", () => {
    expect(
      cardDetails({ title: "Call", date: "2026-09-29T14:00:00.000Z", hasTime: true, people: ["Ana", "Rui"], link: null, location: "" }),
    ).toBe("Title: Call\nDate: 2026-09-29 14:00 UTC\nHas time: Yes\nPeople: Ana, Rui");
  });
});
