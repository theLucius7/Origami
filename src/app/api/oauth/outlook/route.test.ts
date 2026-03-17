import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { encodeOAuthState } from "@/lib/oauth-state";

const addOAuthAccountMock = vi.fn();
const exchangeOutlookCodeMock = vi.fn();
const getAccountRecordByEmailMock = vi.fn();
const updateWhereMock = vi.fn();
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));

vi.mock("@/app/actions/account", () => ({
  addOAuthAccount: addOAuthAccountMock,
}));

vi.mock("@/lib/providers/outlook", () => ({
  exchangeOutlookCode: exchangeOutlookCodeMock,
}));

vi.mock("@/lib/queries/accounts", () => ({
  getAccountRecordByEmail: getAccountRecordByEmailMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  accounts: { id: "accounts.id" },
}));

vi.mock("@/lib/session", () => ({
  readSessionFromCookies: vi.fn().mockResolvedValue({
    githubId: "123",
    githubLogin: "lucius7",
    githubName: null,
    githubAvatarUrl: null,
    setupComplete: true,
  }),
}));

describe("GET /api/oauth/outlook", () => {
  beforeEach(() => {
    addOAuthAccountMock.mockReset();
    exchangeOutlookCodeMock.mockReset();
    getAccountRecordByEmailMock.mockReset();
    updateWhereMock.mockReset();
    updateSetMock.mockClear();
    updateMock.mockClear();

    exchangeOutlookCodeMock.mockResolvedValue({
      email: "user@outlook.com",
      displayName: "Outlook User",
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["mail.readwrite", "mail.send"],
      appId: "default",
    });
    addOAuthAccountMock.mockResolvedValue(undefined);
    getAccountRecordByEmailMock.mockResolvedValue({ id: "acc-outlook-1" });
    updateWhereMock.mockResolvedValue(undefined);
  });

  it("upgrades OAuth scopes and auto-enables write-back after Outlook reauth", async () => {
    process.env.AUTH_SECRET = "test-auth-secret";
    const { GET } = await import("./route");

    const state = await encodeOAuthState(
      {
        appId: "default",
        intent: "writeback",
        enableReadBack: true,
        enableStarBack: true,
      },
      { sessionGithubId: "123" }
    );
    const request = new NextRequest(`http://localhost:3000/api/oauth/outlook?code=test-code&state=${state}`);

    const response = await GET(request);

    expect(exchangeOutlookCodeMock).toHaveBeenCalledWith("test-code", "default");
    expect(addOAuthAccountMock).toHaveBeenCalledWith(
      "outlook",
      "user@outlook.com",
      "Outlook User",
      "access",
      "refresh",
      ["mail.readwrite", "mail.send"],
      200,
      "default"
    );
    expect(getAccountRecordByEmailMock).toHaveBeenCalledWith("user@outlook.com");
    expect(updateSetMock).toHaveBeenCalledWith({ syncReadBack: 1, syncStarBack: 1 });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/accounts?success=outlook&writebackEnabled=1"
    );
  });

  it("redirects to accounts with encoded error when provider exchange fails", async () => {
    exchangeOutlookCodeMock.mockRejectedValue(new Error("consent denied"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/oauth/outlook?code=test-code");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/accounts?error=consent%20denied"
    );
    errorSpy.mockRestore();
  });
});
