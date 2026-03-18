import { describe, expect, it } from "vitest";
import { applyInboxEmailPatch, buildInboxSearchNavigationState, resolveVisibleSelectedMailId } from "./inbox-view-state";
import type { EmailListItem } from "@/lib/db/schema";

function makeEmail(overrides: Partial<EmailListItem> = {}): EmailListItem {
  return {
    id: overrides.id ?? "mail_1",
    accountId: overrides.accountId ?? "acc_1",
    remoteId: overrides.remoteId ?? null,
    messageId: overrides.messageId ?? null,
    subject: overrides.subject ?? "Subject",
    sender: overrides.sender ?? "Alice <alice@example.com>",
    snippet: overrides.snippet ?? "Snippet",
    isRead: overrides.isRead ?? 0,
    isStarred: overrides.isStarred ?? 0,
    localDone: overrides.localDone ?? 0,
    localArchived: overrides.localArchived ?? 0,
    localSnoozeUntil: overrides.localSnoozeUntil ?? null,
    receivedAt: overrides.receivedAt ?? 1_763_700_000,
    folder: overrides.folder ?? "INBOX",
    createdAt: overrides.createdAt ?? 1_763_700_000,
  };
}

describe("inbox-view-state", () => {
  it("keeps the selected mail in search navigation when it remains visible", () => {
    const result = buildInboxSearchNavigationState({
      accountId: "acc_1",
      starred: true,
      query: "  invoice  ",
      selectedId: "mail_2",
      results: [makeEmail({ id: "mail_1" }), makeEmail({ id: "mail_2" })],
    });

    expect(result).toEqual({
      normalizedQuery: "invoice",
      nextMailId: "mail_2",
      href: "/?account=acc_1&starred=1&search=invoice&mail=mail_2",
    });
  });

  it("drops the selected mail from navigation when search filters it out", () => {
    const result = buildInboxSearchNavigationState({
      accountId: "acc_1",
      query: "  from:alice  ",
      selectedId: "mail_2",
      results: [makeEmail({ id: "mail_1" })],
    });

    expect(result).toEqual({
      normalizedQuery: "from:alice",
      nextMailId: undefined,
      href: "/?account=acc_1&search=from%3Aalice",
    });
  });

  it("recognizes when the URL-selected mail is no longer visible", () => {
    expect(resolveVisibleSelectedMailId("mail_1", [makeEmail({ id: "mail_1" })])).toBe("mail_1");
    expect(resolveVisibleSelectedMailId("mail_2", [makeEmail({ id: "mail_1" })])).toBeUndefined();
    expect(resolveVisibleSelectedMailId(undefined, [makeEmail({ id: "mail_1" })])).toBeUndefined();
  });

  it("removes selected mail from the active inbox when a local patch hides it", () => {
    const emails = [makeEmail({ id: "mail_1" }), makeEmail({ id: "mail_2" })];

    const archived = applyInboxEmailPatch(emails, "mail_2", { localArchived: 1 }, {
      nowTs: 1_763_700_100,
      selectedId: "mail_2",
    });

    expect(archived.emails.map((email) => email.id)).toEqual(["mail_1"]);
    expect(archived.removedSelectedEmail).toBe(true);

    const unstarredInStarredView = applyInboxEmailPatch(
      [makeEmail({ id: "mail_3", isStarred: 1 })],
      "mail_3",
      { isStarred: 0 },
      {
        starred: true,
        nowTs: 1_763_700_100,
        selectedId: "mail_3",
      }
    );

    expect(unstarredInStarredView.emails).toEqual([]);
    expect(unstarredInStarredView.removedSelectedEmail).toBe(true);
  });
});
