import { beforeEach, describe, expect, it, vi } from "vitest";

const parseAccountCredentialsMock = vi.fn();
const persistProviderCredentialsIfNeededMock = vi.fn();
const gmailMarkMessageReadMock = vi.fn();
const gmailSetMessageStarredMock = vi.fn();
const outlookMarkMessageReadMock = vi.fn();
const outlookSetMessageStarredMock = vi.fn();
const qqMarkMessageReadMock = vi.fn();
const qqSetMessageStarredMock = vi.fn();

vi.mock("@/lib/account-providers", () => ({
  parseAccountCredentials: parseAccountCredentialsMock,
  persistProviderCredentialsIfNeeded: persistProviderCredentialsIfNeededMock,
}));

vi.mock("./gmail", () => ({
  GMAIL_MODIFY_SCOPE: "https://www.googleapis.com/auth/gmail.modify",
  hasGmailModifyScope: (scopes?: string[]) =>
    Array.isArray(scopes) && scopes.includes("https://www.googleapis.com/auth/gmail.modify"),
  GmailProvider: class GmailProvider {
    markMessageRead = gmailMarkMessageReadMock;
    setMessageStarred = gmailSetMessageStarredMock;
  },
}));

vi.mock("./outlook", () => ({
  OUTLOOK_REQUIRED_WRITEBACK_SCOPE: "mail.readwrite",
  hasOutlookWriteBackScope: (scopes?: string[]) =>
    Array.isArray(scopes) && scopes.map((scope) => scope.toLowerCase()).includes("mail.readwrite"),
  OutlookProvider: class OutlookProvider {
    markMessageRead = outlookMarkMessageReadMock;
    setMessageStarred = outlookSetMessageStarredMock;
  },
}));

vi.mock("./qq", () => ({
  QQProvider: class QQProvider {
    markMessageRead = qqMarkMessageReadMock;
    setMessageStarred = qqSetMessageStarredMock;
  },
}));

const baseAccount = {
  id: "acc-1",
  provider: "gmail",
  email: "user@example.com",
  displayName: "User",
  credentials: "encrypted",
  oauthAppId: null,
  presetKey: null,
  authUser: null,
  imapHost: null,
  imapPort: null,
  imapSecure: 1,
  smtpHost: null,
  smtpPort: null,
  smtpSecure: 1,
  syncCursor: null,
  syncReadBack: 0,
  syncStarBack: 0,
  initialFetchLimit: 200,
  lastSyncedAt: null,
  createdAt: 0,
};

describe("writeBack service", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.GMAIL_CLIENT_ID = "gmail-client";
    process.env.GMAIL_CLIENT_SECRET = "gmail-secret";
    process.env.OUTLOOK_CLIENT_ID = "outlook-client";
    process.env.OUTLOOK_CLIENT_SECRET = "outlook-secret";
    parseAccountCredentialsMock.mockReset();
    persistProviderCredentialsIfNeededMock.mockReset();
    gmailMarkMessageReadMock.mockReset();
    gmailSetMessageStarredMock.mockReset();
    outlookMarkMessageReadMock.mockReset();
    outlookSetMessageStarredMock.mockReset();
    qqMarkMessageReadMock.mockReset();
    qqSetMessageStarredMock.mockReset();

    parseAccountCredentialsMock.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["https://www.googleapis.com/auth/gmail.modify", "mail.readwrite"],
      email: "qq@example.com",
      authCode: "qq-auth",
    });
    persistProviderCredentialsIfNeededMock.mockResolvedValue(undefined);
    gmailMarkMessageReadMock.mockResolvedValue(undefined);
    gmailSetMessageStarredMock.mockResolvedValue(undefined);
    outlookMarkMessageReadMock.mockResolvedValue(undefined);
    outlookSetMessageStarredMock.mockResolvedValue(undefined);
    qqMarkMessageReadMock.mockResolvedValue(undefined);
    qqSetMessageStarredMock.mockResolvedValue(undefined);
  });

  it("returns skipped when read-back toggle is disabled", async () => {
    const { writeBackRead } = await import("./writeBack");

    const result = await writeBackRead(baseAccount, "remote-1");

    expect(result).toEqual({ success: false, skipped: true });
    expect(parseAccountCredentialsMock).not.toHaveBeenCalled();
    expect(gmailMarkMessageReadMock).not.toHaveBeenCalled();
  });

  it("returns skipped when provider scope is missing", async () => {
    parseAccountCredentialsMock.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["mail.send"],
    });
    const { writeBackRead } = await import("./writeBack");

    const result = await writeBackRead(
      { ...baseAccount, syncReadBack: 1, provider: "outlook" },
      "remote-2"
    );

    expect(result).toEqual({
      success: false,
      skipped: true,
      error: "missing scope mail.readwrite",
    });
    expect(outlookMarkMessageReadMock).not.toHaveBeenCalled();
  });

  it("returns success when Gmail read-back succeeds", async () => {
    const { writeBackRead } = await import("./writeBack");

    const result = await writeBackRead(
      { ...baseAccount, syncReadBack: 1, provider: "gmail" },
      "gmail-remote-1"
    );

    expect(result).toEqual({ success: true, skipped: false });
    expect(gmailMarkMessageReadMock).toHaveBeenCalledWith("gmail-remote-1");
    expect(persistProviderCredentialsIfNeededMock).toHaveBeenCalledTimes(1);
  });

  it("returns error result when Outlook star-back throws", async () => {
    outlookSetMessageStarredMock.mockRejectedValue(new Error("403 Forbidden"));
    const { writeBackStar } = await import("./writeBack");

    const result = await writeBackStar(
      { ...baseAccount, syncStarBack: 1, provider: "outlook" },
      "outlook-remote-1",
      true
    );

    expect(result).toEqual({
      success: false,
      skipped: false,
      error: "403 Forbidden",
    });
    expect(outlookSetMessageStarredMock).toHaveBeenCalledWith("outlook-remote-1", true);
  });

  it("routes QQ star-back with existing credentials", async () => {
    const { writeBackStar } = await import("./writeBack");

    const result = await writeBackStar(
      {
        ...baseAccount,
        provider: "qq",
        email: "qq@example.com",
        syncStarBack: 1,
      },
      "12345",
      false
    );

    expect(result).toEqual({ success: true, skipped: false });
    expect(qqSetMessageStarredMock).toHaveBeenCalledWith("12345", false);
  });
});
