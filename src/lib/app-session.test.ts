import { beforeEach, describe, expect, it, vi } from "vitest";

const getOwnerAuthSessionMock = vi.fn();
const getInstallationMock = vi.fn();
const readSessionFromCookiesMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getOwnerAuthSession: getOwnerAuthSessionMock,
}));

vi.mock("@/lib/queries/installation", () => ({
  getInstallation: getInstallationMock,
}));

vi.mock("@/lib/session", () => ({
  readSessionFromCookies: readSessionFromCookiesMock,
}));

describe("getOwnerAppAuthContext", () => {
  beforeEach(() => {
    getOwnerAuthSessionMock.mockReset();
    getInstallationMock.mockReset();
    readSessionFromCookiesMock.mockReset();
  });

  it("prefers better-auth owner session and uses installation setup state", async () => {
    getInstallationMock.mockResolvedValue({
      id: "main",
      ownerGithubId: "123",
      ownerGithubLogin: "lucius7",
      ownerUserId: "user_1",
      setupCompletedAt: 123456,
    });
    getOwnerAuthSessionMock.mockResolvedValue({
      userId: "user_1",
      githubId: "123",
      githubLogin: "lucius7",
      githubName: "Lucius",
      githubAvatarUrl: null,
      setupComplete: false,
    });

    const { getOwnerAppAuthContext } = await import("./app-session");
    const result = await getOwnerAppAuthContext({
      requestHeaders: new Headers({ cookie: "better-auth.session=1" }),
      cookieStore: { get: vi.fn() },
    });

    expect(result).toEqual({
      installation: {
        id: "main",
        ownerGithubId: "123",
        ownerGithubLogin: "lucius7",
        ownerUserId: "user_1",
        setupCompletedAt: 123456,
      },
      isSetupComplete: true,
      session: {
        source: "better-auth",
        userId: "user_1",
        githubId: "123",
        githubLogin: "lucius7",
        githubName: "Lucius",
        githubAvatarUrl: null,
      },
    });
    expect(readSessionFromCookiesMock).not.toHaveBeenCalled();
  });

  it("falls back to legacy session and derives setup state from installation", async () => {
    getInstallationMock.mockResolvedValue({
      id: "main",
      ownerGithubId: "123",
      ownerGithubLogin: "lucius7",
      ownerUserId: "user_1",
      setupCompletedAt: 999,
    });
    getOwnerAuthSessionMock.mockResolvedValue(null);
    readSessionFromCookiesMock.mockResolvedValue({
      githubId: "123",
      githubLogin: "lucius7",
      githubName: null,
      githubAvatarUrl: null,
      setupComplete: false,
    });

    const { getOwnerAppAuthContext } = await import("./app-session");
    const result = await getOwnerAppAuthContext({
      cookieStore: { get: vi.fn() },
    });

    expect(result?.isSetupComplete).toBe(true);
    expect(result?.session).toEqual({
      source: "legacy",
      userId: null,
      githubId: "123",
      githubLogin: "lucius7",
      githubName: null,
      githubAvatarUrl: null,
    });
  });

  it("rejects legacy session when installation owner github id mismatches", async () => {
    getInstallationMock.mockResolvedValue({
      id: "main",
      ownerGithubId: "999",
      ownerGithubLogin: "other-owner",
      ownerUserId: null,
      setupCompletedAt: null,
    });
    getOwnerAuthSessionMock.mockResolvedValue(null);
    readSessionFromCookiesMock.mockResolvedValue({
      githubId: "123",
      githubLogin: "lucius7",
      githubName: null,
      githubAvatarUrl: null,
      setupComplete: false,
    });

    const { getOwnerAppAuthContext } = await import("./app-session");
    const result = await getOwnerAppAuthContext({
      cookieStore: { get: vi.fn() },
    });

    expect(result).toBeNull();
  });
});
