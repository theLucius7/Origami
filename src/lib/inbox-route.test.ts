import { describe, expect, it } from "vitest";
import { buildInboxHref, buildMailDetailHref } from "./inbox-route";

describe("inbox-route", () => {
  it("builds inbox hrefs from active filters", () => {
    expect(
      buildInboxHref({
        accountId: "acc_123",
        starred: true,
        search: "  from:alice invoice  ",
        mailId: "mail_456",
      })
    ).toBe("/?account=acc_123&starred=1&search=from%3Aalice+invoice&mail=mail_456");
  });

  it("omits empty search values", () => {
    expect(buildInboxHref({ search: "   " })).toBe("/");
  });

  it("builds mail detail hrefs while preserving inbox context", () => {
    expect(
      buildMailDetailHref("mail_456", {
        accountId: "acc_123",
        search: "from:alice",
      })
    ).toBe("/mail/mail_456?account=acc_123&search=from%3Aalice");
  });
});
