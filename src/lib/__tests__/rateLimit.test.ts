import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { allow, LIMITS } = await import("@/lib/rateLimit");

const from = (ip: string) => new Request("https://unfold.test/api", { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });

describe("per-visitor limits", () => {
  test("allows up to the per-minute limit, then blocks until the next minute", () => {
    const t = Date.UTC(2026, 8, 25, 12, 0, 5);
    const req = from("203.0.113.1");
    for (let i = 0; i < LIMITS.grade.perMinute; i++) expect(allow("grade", req, t)).toBe(true);
    expect(allow("grade", req, t + 1000)).toBe(false);
    expect(allow("grade", req, t + 60_000)).toBe(true);
  });
  test("each visitor has their own count", () => {
    const t = Date.UTC(2026, 8, 25, 13, 0, 5);
    for (let i = 0; i < LIMITS.grade.perMinute; i++) allow("grade", from("203.0.113.2"), t);
    expect(allow("grade", from("203.0.113.2"), t)).toBe(false);
    expect(allow("grade", from("203.0.113.3"), t)).toBe(true);
  });
  test("daily cap holds across minutes", () => {
    const start = Date.UTC(2026, 8, 26, 0, 0, 0);
    const req = from("203.0.113.4");
    let allowed = 0;
    for (let i = 0; i < LIMITS.grade.perDay + 20; i++) if (allow("grade", req, start + i * 60_000)) allowed++;
    expect(allowed).toBe(LIMITS.grade.perDay);
  });
});
