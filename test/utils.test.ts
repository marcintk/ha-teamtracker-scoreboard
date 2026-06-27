import { describe, expect, it } from "vitest";
import { safeLogoUrl, timeAgo, VALID_STATES } from "../src/utils.js";

describe("timeAgo", () => {
  it('formats seconds as "Xs"', () => expect(timeAgo(10_000)).toBe("10s"));
  it('formats 59 seconds as "59s"', () => expect(timeAgo(59_999)).toBe("59s"));
  it('formats 60 seconds as "1m"', () => expect(timeAgo(60_000)).toBe("1m"));
  it('formats minutes as "Xm"', () => expect(timeAgo(150_000)).toBe("2m"));
  it('formats 41 minutes as "41m"', () => expect(timeAgo(2_460_000)).toBe("41m"));
  it('formats 3600 seconds as "1h"', () => expect(timeAgo(3_600_000)).toBe("1h"));
  it('formats hours as "Xh"', () => expect(timeAgo(7_200_000)).toBe("2h"));
});

describe("safeLogoUrl", () => {
  it("returns https URLs unchanged", () => {
    expect(safeLogoUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
  });

  it("rejects http URLs", () => {
    expect(safeLogoUrl("http://example.com/logo.png")).toBe("");
  });

  it("returns empty string for null, undefined, and empty string", () => {
    expect(safeLogoUrl(null)).toBe("");
    expect(safeLogoUrl(undefined)).toBe("");
    expect(safeLogoUrl("")).toBe("");
  });
});

describe("VALID_STATES", () => {
  it("contains PRE, IN, POST, and BYE", () => {
    expect(VALID_STATES.has("PRE")).toBe(true);
    expect(VALID_STATES.has("IN")).toBe(true);
    expect(VALID_STATES.has("POST")).toBe(true);
    expect(VALID_STATES.has("BYE")).toBe(true);
  });

  it("does not contain unrecognised states", () => {
    const states = VALID_STATES as ReadonlySet<string>;
    expect(states.has("UNKNOWN")).toBe(false);
    expect(states.has("")).toBe(false);
  });
});
