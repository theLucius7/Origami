import { describe, expect, it } from "vitest";
import { buildFtsSearchQuery, isFtsFallbackableError } from "./emails";

describe("emails search helpers", () => {
  it("builds FTS prefix query for simple safe tokens", () => {
    expect(buildFtsSearchQuery(["invoice followup"]))
      .toBe("invoice* followup*");
  });

  it("falls back from FTS for email-like or hyphenated tokens", () => {
    expect(buildFtsSearchQuery(["alice@example.com"]))
      .toBeNull();
    expect(buildFtsSearchQuery(["error-500"]))
      .toBeNull();
  });

  it("falls back from FTS for reserved keywords", () => {
    expect(buildFtsSearchQuery(["or"]))
      .toBeNull();
    expect(buildFtsSearchQuery(["and report"]))
      .toBeNull();
  });

  it("recognizes recoverable FTS errors", () => {
    expect(isFtsFallbackableError(new Error('fts5: syntax error near "@"')))
      .toBe(true);
    expect(isFtsFallbackableError(new Error("no such column: foo")))
      .toBe(true);
    expect(isFtsFallbackableError(new Error("database is locked")))
      .toBe(false);
  });
});
