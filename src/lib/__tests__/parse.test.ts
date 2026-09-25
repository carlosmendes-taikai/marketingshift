import { describe, expect, test } from "bun:test";
import { evaluate, parseCalc } from "@/lib/parse/calc";
import { parseContact } from "@/lib/parse/contact";
import { parseEvent } from "@/lib/parse/event";
import { parseIdea } from "@/lib/parse/idea";
import { addWorkingDays, parseLead } from "@/lib/parse/lead";
import { parseLink } from "@/lib/parse/link";
import { withBrand, withFormat } from "@/lib/parse/marketing";
import { parseReminder } from "@/lib/parse/reminder";
import { formatClock, parseTimer } from "@/lib/parse/timer";
import { dayShift, formatIn, parseTimezone, wallTimeToInstant } from "@/lib/parse/timezone";
import { parseTodo } from "@/lib/parse/todo";
import { parseUtm, slug } from "@/lib/parse/utm";

// Tuesday 22 Sep 2026, 10:00 local
const REF = new Date(2026, 8, 22, 10, 0);

describe("event", () => {
  test("dinner with priya friday 8pm", () => {
    const e = parseEvent("dinner with priya friday 8pm", REF);
    expect(e.title).toBe("Dinner");
    expect(e.people).toEqual(["Priya"]);
    expect(e.date?.getDay()).toBe(5);
    expect(e.date?.getHours()).toBe(20);
    expect(e.hasTime).toBe(true);
  });
  test("on zoom → link", () => {
    const e = parseEvent("dinner with priya friday 8pm on zoom", REF);
    expect(e.link).toBe("Zoom");
    expect(e.people).toEqual(["Priya"]);
    expect(e.title).toBe("Dinner");
  });
  test("multiple people", () => {
    expect(parseEvent("lunch with rahul and anna tomorrow", REF).people).toEqual(["Rahul", "Anna"]);
  });
  test("partial: no date", () => {
    const e = parseEvent("coffee with sam", REF);
    expect(e.date).toBeNull();
    expect(e.title).toBe("Coffee");
  });
  test("location", () => {
    const e = parseEvent("team sync at blue tokai monday 10am", REF);
    expect(e.location).toBe("Blue Tokai");
    expect(e.title).toBe("Team sync");
  });
  test("empty", () => {
    expect(parseEvent("", REF).title).toBe("");
  });
});

describe("reminder", () => {
  test("remind me to call mom tomorrow", () => {
    const r = parseReminder("remind me to call mom tomorrow", REF);
    expect(r.task).toBe("Call mom");
    expect(r.when?.getDate()).toBe(23);
    expect(r.hasTime).toBe(false);
  });
  test("urgent word stripped", () => {
    expect(parseReminder("remind me to pay rent tomorrow urgent", REF).task).toBe("Pay rent");
  });
  test("with time", () => {
    const r = parseReminder("remind me to stretch at 4pm", REF);
    expect(r.hasTime).toBe(true);
    expect(r.task).toBe("Stretch");
  });
  test("no time", () => {
    expect(parseReminder("remind me to water plants", REF).when).toBeNull();
  });
  test("don't forget", () => {
    expect(parseReminder("don't forget to email ravi", REF).task).toBe("Email ravi");
  });
});

describe("todo", () => {
  test("buy milk, eggs, bread and coffee", () => {
    const t = parseTodo("buy milk, eggs, bread and coffee");
    expect(t.items).toEqual(["Milk", "Eggs", "Bread", "Coffee"]);
    expect(t.verb).toBe("buy");
  });
  test("newlines", () => expect(parseTodo("wash car\nfile taxes").items).toEqual(["Wash car", "File taxes"]));
  test("ampersand", () => expect(parseTodo("pens & paper").items).toEqual(["Pens", "Paper"]));
  test("drops empties", () => expect(parseTodo("a,, b ,").items).toEqual(["A", "B"]));
  test("prefix", () => expect(parseTodo("todo: laundry; dishes").items).toEqual(["Laundry", "Dishes"]));
});

describe("timer", () => {
  test("25 min focus", () => expect(parseTimer("25 min focus")).toEqual({ seconds: 1500, label: "Focus" }));
  test("timer 10 minutes", () => expect(parseTimer("timer 10 minutes").seconds).toBe(600));
  test("1h 30m", () => expect(parseTimer("1h 30m").seconds).toBe(5400));
  test("pomodoro", () => expect(parseTimer("pomodoro").seconds).toBe(1500));
  test("no duration", () => expect(parseTimer("stopwatch").seconds).toBeNull());
  test("seconds", () => expect(parseTimer("45 sec plank").seconds).toBe(45));
  test("clock", () => {
    expect(formatClock(1500)).toBe("25:00");
    expect(formatClock(5400)).toBe("1:30:00");
  });
});

describe("calc", () => {
  test("18% of 3450", () => expect(parseCalc("18% of 3450").result).toBeCloseTo(621));
  test("(120+80)*3", () => expect(parseCalc("(120+80)*3").result).toBe(600));
  test("precedence", () => expect(evaluate("2+3*4^2")).toBe(50));
  test("right assoc power", () => expect(evaluate("2^3^2")).toBe(512));
  test("unary minus", () => expect(evaluate("-3+5")).toBe(2));
  test("x and ÷", () => expect(parseCalc("12 x 4 ÷ 2").result).toBe(24));
  test("invalid", () => expect(parseCalc("(1+").result).toBeNull());
  test("percent off", () => expect(parseCalc("20% off 1500").result).toBe(1200));
});

describe("contact", () => {
  test("rahul 98200 12345 rahul@mail.com", () => {
    const c = parseContact("rahul 98200 12345 rahul@mail.com");
    expect(c).toEqual({ name: "Rahul", phone: "98200 12345", email: "rahul@mail.com", initials: "R" });
  });
  test("+91", () => expect(parseContact("anna sharma +91 98765 43210").phone).toBe("+91 98765 43210"));
  test("initials", () => expect(parseContact("anna sharma a@b.co").initials).toBe("AS"));
  test("email only", () => expect(parseContact("sam@x.io").name).toBe(""));
  test("save prefix", () => expect(parseContact("save priya 9820012345").name).toBe("Priya"));
});

describe("link", () => {
  test("https://vercel.com/blog check later", () => {
    const l = parseLink("https://vercel.com/blog check later");
    expect(l.domain).toBe("vercel.com");
    expect(l.monogram).toBe("V");
    expect(l.note).toBe("Check later");
  });
  test("www", () => expect(parseLink("www.example.org").domain).toBe("example.org"));
  test("bare domain", () => expect(parseLink("read linear.app/method").url).toBe("https://linear.app/method"));
  test("trailing punctuation", () => expect(parseLink("see https://a.dev/x.").url).toBe("https://a.dev/x"));
  test("no url", () => expect(parseLink("nothing here").url).toBeNull());
});

describe("timezone", () => {
  const at = new Date(Date.UTC(2026, 0, 15, 12, 0)); // January: no DST in the US
  test("3pm pst in ist", () => {
    const tz = parseTimezone("3pm pst in ist", at);
    expect(tz.from.tz).toBe("America/Los_Angeles");
    expect(tz.to?.tz).toBe("Asia/Kolkata");
    expect(formatIn("America/Los_Angeles", tz.instant!)).toBe("3:00 PM");
    expect(formatIn("Asia/Kolkata", tz.instant!)).toBe("4:30 AM");
    expect(dayShift("America/Los_Angeles", "Asia/Kolkata", tz.instant!)).toBe(1);
  });
  test("time in tokyo is now, local → tokyo", () => {
    const tz = parseTimezone("what time is it in tokyo", at);
    expect(tz.isNow).toBe(true);
    expect(tz.to?.label).toBe("Tokyo");
  });
  test("3pm lisbon in new york", () => {
    const tz = parseTimezone("3pm lisbon in new york", at);
    expect([tz.from.label, tz.to?.label]).toEqual(["Lisbon", "New York"]);
    expect(formatIn("America/New_York", tz.instant!)).toBe("10:00 AM");
  });
  test("cities without their own zone name", () => {
    const tz = parseTimezone("3pm lisbon to rio de janeiro", at);
    expect([tz.from.label, tz.to?.label]).toEqual(["Lisbon", "Rio de Janeiro"]);
    expect(formatIn("America/Sao_Paulo", tz.instant!)).toBe("12:00 PM");
  });
  test("any world city with its own zone", () => {
    expect(parseTimezone("3pm lisbon to nairobi", at).to?.tz).toBe("Africa/Nairobi");
    expect(parseTimezone("9am mexico city to buenos aires", at).to?.label).toBe("Buenos Aires");
    expect(parseTimezone("10am são paulo in lisbon", at).from.label).toBe("São Paulo");
  });
  test("unknown place is flagged, not converted to local time", () => {
    const tz = parseTimezone("3pm lisbon to atlantis", at);
    expect(tz.to).toBeNull();
    expect(tz.unknown).toBe("Atlantis");
  });
  test("everyday words are not places", () => expect(parseTimezone("christmas campaign at 3pm", at).to).toBeNull());
  test("single zone after a time is the source", () => expect(parseTimezone("9am london", at).from.label).toBe("London"));
  test("24h clock", () => expect(formatIn("Europe/Paris", parseTimezone("14:30 paris to new york", at).instant!)).toBe("2:30 PM"));
  test("DST-aware wall time", () => {
    const summer = new Date(Date.UTC(2026, 6, 1, 12));
    expect(formatIn("America/New_York", wallTimeToInstant("America/New_York", 9, 0, summer))).toBe("9:00 AM");
  });
});

describe("utm", () => {
  test("the brief's example", () => {
    const u = parseUtm("linkedin campaign october hacker house taikai.network/hh2");
    expect(u.source).toBe("linkedin");
    expect(u.medium).toBe("social");
    expect(u.campaign).toBe("october-hacker-house");
    expect(u.content).toBeNull();
    expect(u.tagged).toBe("https://taikai.network/hh2?utm_source=linkedin&utm_medium=social&utm_campaign=october-hacker-house");
  });
  test("source → medium mapping", () => {
    expect(parseUtm("x launch taikai.network").medium).toBe("social");
    expect(parseUtm("instagram launch taikai.network").medium).toBe("social");
    expect(parseUtm("newsletter launch taikai.network").medium).toBe("email");
    const g = parseUtm("google ads spring promo layerx.xyz");
    expect([g.source, g.medium, g.campaign]).toEqual(["google", "cpc", "spring-promo"]);
  });
  test("optional content, lowercase and hyphens", () => {
    const u = parseUtm("LinkedIn campaign Web Summit 2026 https://layerx.xyz/ws content Banner A");
    expect(u.campaign).toBe("web-summit-2026");
    expect(u.content).toBe("banner-a");
    expect(u.tagged).toContain("utm_content=banner-a");
  });
  test("keeps an existing query string", () =>
    expect(parseUtm("newsletter recap https://taikai.network/?ref=home").tagged).toBe(
      "https://taikai.network/?ref=home&utm_source=newsletter&utm_medium=email&utm_campaign=recap",
    ));
  test("no source yet → no tagged link", () => expect(parseUtm("campaign october taikai.network").tagged).toBeNull());
  test("slug", () => expect(slug("  Hacker House & Friends!! ")).toBe("hacker-house-and-friends"));
});

describe("content idea", () => {
  test("the brief's example", () =>
    expect(parseIdea("post about how we ran hacker house with dehouse")).toEqual({
      idea: "How we ran hacker house with dehouse",
      brand: null,
      format: null,
    }));
  test("brand and format named in the text", () =>
    expect(parseIdea("carousel about 5 lessons from web summit for /ai-cmo")).toEqual({
      idea: "5 lessons from web summit",
      brand: "ai_cmo",
      format: "carousel",
    }));
  test("one-click choices rewrite the text", () => {
    const t = withFormat(withBrand("post about how we ran hacker house", "taikai"), "video");
    expect(t).toBe("post about how we ran hacker house for TAIKAI as a video");
    const again = withFormat(withBrand(t, "layerx"), "article");
    expect(again).toBe("post about how we ran hacker house for LayerX as an article");
    expect(parseIdea(again)).toEqual({ idea: "How we ran hacker house", brand: "layerx", format: "article" });
  });
  test("a leading format is replaced, not duplicated", () =>
    expect(withFormat("carousel about web summit", "article")).toBe("post about web summit as an article"));
});

describe("lead", () => {
  test("the brief's example, follow-up in 3 working days", () => {
    const l = parseLead("met Ana from Sonae, interested in AI workshop", REF);
    expect([l.name, l.company, l.interest]).toEqual(["Ana", "Sonae", "AI workshop"]);
    expect(l.followUp).toEqual(new Date(2026, 8, 25)); // Tue → Fri
    expect(l.followUpSet).toBe(false);
  });
  test("working days skip the weekend", () => expect(addWorkingDays(new Date(2026, 8, 24), 3)).toEqual(new Date(2026, 8, 29))); // Thu → Tue
  test("explicit follow-up day", () => {
    const l = parseLead("spoke with joão silva at galp, wants a hackathon, follow up monday", REF);
    expect([l.name, l.company, l.interest]).toEqual(["João Silva", "Galp", "A hackathon"]);
    expect(l.followUp).toEqual(new Date(2026, 8, 28));
    expect(l.followUpSet).toBe(true);
  });
  test("name only", () => expect(parseLead("met rui", REF)).toMatchObject({ name: "Rui", company: null, interest: null }));
});
