import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_OAUTH_APP_ID } from "./oauth-apps.shared";

const whereMock = vi.fn();
const fromMock = vi.fn();
const selectMock = vi.fn(() => ({ from: fromMock }));
const decryptMock = vi.fn((value: string) => `decrypted:${value}`);

let allRows: Array<Record<string, unknown>> = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  oauthApps: { id: "oauth_apps.id", provider: "oauth_apps.provider" },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: decryptMock,
}));

describe("oauth app resolver", () => {
  beforeEach(() => {
    vi.resetModules();
    selectMock.mockClear();
    whereMock.mockReset();
    fromMock.mockImplementation(() => ({
      where: whereMock,
      then: (resolve: (rows: Array<Record<string, unknown>>) => unknown) =>
        Promise.resolve(resolve(allRows)),
    }));
    decryptMock.mockClear();
    allRows = [];

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.GMAIL_CLIENT_ID = "gmail-client";
    process.env.GMAIL_CLIENT_SECRET = "gmail-secret";
    process.env.OUTLOOK_CLIENT_ID = "outlook-client";
    process.env.OUTLOOK_CLIENT_SECRET = "outlook-secret";
  });

  it("resolves default Gmail and Outlook apps from env", async () => {
    const { resolveGmailOAuthApp, resolveOutlookOAuthApp } = await import("./oauth-apps");

    await expect(resolveGmailOAuthApp()).resolves.toEqual({
      appId: DEFAULT_OAUTH_APP_ID,
      source: "env",
      clientId: "gmail-client",
      clientSecret: "gmail-secret",
      redirectUrl: "http://localhost:3000/api/oauth/gmail",
      sendScopes: expect.arrayContaining([
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.send",
      ]),
    });

    await expect(resolveOutlookOAuthApp()).resolves.toEqual({
      appId: DEFAULT_OAUTH_APP_ID,
      source: "env",
      tenant: "common",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientId: "outlook-client",
      clientSecret: "outlook-secret",
      redirectUrl: "http://localhost:3000/api/oauth/outlook",
      requiredSendScope: "mail.send",
    });
  });

  it("resolves db-backed OAuth apps and decrypts stored secrets", async () => {
    allRows = [
      {
        id: "team-gmail",
        provider: "gmail",
        label: "Team Gmail",
        clientId: "db-gmail-client",
        clientSecret: "encrypted-secret",
        tenant: null,
      },
    ];
    whereMock.mockResolvedValue(allRows);

    const { resolveGmailOAuthApp } = await import("./oauth-apps");
    const result = await resolveGmailOAuthApp("team-gmail");

    expect(result).toEqual({
      appId: "team-gmail",
      source: "db",
      clientId: "db-gmail-client",
      clientSecret: "decrypted:encrypted-secret",
      redirectUrl: "http://localhost:3000/api/oauth/gmail",
      sendScopes: expect.arrayContaining([
        "https://www.googleapis.com/auth/gmail.modify",
      ]),
    });
    expect(decryptMock).toHaveBeenCalledWith("encrypted-secret");
  });

  it("lists env-backed default apps alongside db apps", async () => {
    allRows = [
      {
        id: "team-gmail",
        provider: "gmail",
        label: "Team Gmail",
        clientId: "db-gmail-client",
        clientSecret: "encrypted-secret",
        tenant: null,
      },
      {
        id: "team-outlook",
        provider: "outlook",
        label: "Team Outlook",
        clientId: "db-outlook-client",
        clientSecret: "encrypted-outlook-secret",
        tenant: "organizations",
      },
    ];

    const { listOAuthAppOptions } = await import("./oauth-apps");
    const result = await listOAuthAppOptions();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "default", provider: "gmail", source: "env" }),
        expect.objectContaining({ id: "default", provider: "outlook", source: "env" }),
        expect.objectContaining({ id: "team-gmail", provider: "gmail", source: "db" }),
        expect.objectContaining({ id: "team-outlook", provider: "outlook", source: "db" }),
      ])
    );
  });
});
