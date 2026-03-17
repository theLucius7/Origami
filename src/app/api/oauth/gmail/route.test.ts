import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { encodeOAuthState } from "@/lib/oauth-state";

const addOAuthAccountMock = vi.fn();
const exchangeGmailCodeMock = vi.fn();
const getAccountRecordByEmailMock = vi.fn();
const updateWhereMock = vi.fn();
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));

vi.mock("@/app/actions/account", () => ({
  addOAuthAccount: addOAuthAccountMock,
}));

vi.mock("@/lib/providers/gmail", () => ({
  exchangeGmailCode: exchangeGmailCodeMock,
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

describe("GET /api/oauth/gmail", () => {
  beforeEach(() => {
    addOAuthAccountMock.mockReset();
    exchangeGmailCodeMock.mockReset();
    getAccountRecordByEmailMock.mockReset();
    updateWhereMock.mockReset();
    updateSetMock.mockClear();
    updateMock.mockClear();

    exchangeGmailCodeMock.mockResolvedValue({
      email: "user@gmail.com",
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["https://www.googleapis.com/auth/gmail.modify"],
      appId: "default",
    });
    addOAuthAccountMock.mockResolvedValue(undefined);
    getAccountRecordByEmailMock.mockResolvedValue({ id: "acc-gmail-1" });
    updateWhereMock.mockResolvedValue(undefined);
  });

  it("upgrades OAuth scopes and auto-enables write-back after Gmail reauth", async () => {
    process.env.AUTH_SECRET = "test-auth-secret";
    const { GET } = await import("./route");

    const state = await encodeOAuthState(
      {
        appId: "default",
        intent: "writeback",
        enableReadBack: true,
        enableStarBack: false,
      },
      { sessionGithubId: "123" }
    );
    const request = new NextRequest(`http://localhost:3000/api/oauth/gmail?code=test-code&state=${state}`);

    const response = await GET(request);

    expect(exchangeGmailCodeMock).toHaveBeenCalledWith("test-code", "default");
    expect(addOAuthAccountMock).toHaveBeenCalledWith(
      "gmail",
      "user@gmail.com",
      "user@gmail.com",
      "access",
      "refresh",
      ["https://www.googleapis.com/auth/gmail.modify"],
      200,
      "default"
    );
    expect(getAccountRecordByEmailMock).toHaveBeenCalledWith("user@gmail.com");
    expect(updateMock).toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenCalledWith({ syncReadBack: 1 });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/accounts?success=gmail&writebackEnabled=1"
    );
  });

  it("returns 400 when code is missing", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/oauth/gmail");

    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
