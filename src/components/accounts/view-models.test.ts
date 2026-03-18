import { describe, expect, it } from "vitest";
import { buildAccountSettingsViews, buildOAuthAppsWithUsage } from "./view-models";
import { encrypt } from "@/lib/crypto";
import type { Account } from "@/lib/db/schema";
import type { OAuthAppOption } from "@/lib/oauth-apps.shared";

process.env.ENCRYPTION_KEY ??= "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function createAccount(overrides: Partial<Account>): Account {
  return {
    id: "acc_1",
    provider: "gmail",
    email: "user@example.com",
    displayName: "User",
    credentials: "encrypted",
    syncCursor: null,
    lastSyncedAt: null,
    createdAt: 0,
    syncReadBack: 0,
    syncStarBack: 0,
    initialFetchLimit: 200,
    oauthAppId: null,
    presetKey: null,
    authUser: null,
    imapHost: null,
    imapPort: null,
    imapSecure: 1,
    smtpHost: null,
    smtpPort: null,
    smtpSecure: 1,
    ...overrides,
  };
}

describe("accounts view-models", () => {
  it("attaches OAuth app usage counts", () => {
    const accounts = [
      createAccount({ id: "a1", provider: "gmail", oauthAppId: "team" }),
      createAccount({ id: "a2", provider: "gmail", oauthAppId: "team" }),
      createAccount({ id: "a3", provider: "outlook", oauthAppId: null }),
    ];
    const options: OAuthAppOption[] = [
      { id: "team", provider: "gmail", label: "Team Gmail", source: "db" },
      { id: "default", provider: "outlook", label: "Default Outlook", source: "env" },
    ];

    expect(buildOAuthAppsWithUsage(accounts, options)).toEqual([
      { id: "team", provider: "gmail", label: "Team Gmail", source: "db", usageCount: 2 },
      { id: "default", provider: "outlook", label: "Default Outlook", source: "env", usageCount: 1 },
    ]);
  });

  it("builds account settings views with runtime health and oauth labels", () => {
    const account = createAccount({
      id: "a1",
      provider: "gmail",
      oauthAppId: "team",
      syncReadBack: 1,
      syncStarBack: 1,
      credentials: encrypt(JSON.stringify({ scopes: ["https://www.googleapis.com/auth/gmail.modify"] })),
    });
    const options: OAuthAppOption[] = [
      { id: "team", provider: "gmail", label: "Team Gmail", source: "db" },
    ];
    const runtimeHealthByAccount = new Map([
      [
        "a1",
        {
          hydrationPendingCount: 1,
          hydrationFailedCount: 2,
          latestHydrationError: "timeout",
          latestHydrationAt: 123,
          readWriteBackPendingCount: 0,
          readWriteBackFailedCount: 0,
          latestReadWriteBackError: null,
          latestReadWriteBackAt: null,
          starWriteBackPendingCount: 0,
          starWriteBackFailedCount: 0,
          latestStarWriteBackError: null,
          latestStarWriteBackAt: null,
        },
      ],
    ]);

    const [view] = buildAccountSettingsViews({
      accounts: [account],
      oauthAppOptions: options,
      runtimeHealthByAccount,
    });

    expect(view.oauthAppLabel).toBe("Team Gmail");
    expect(view.hydrationFailedCount).toBe(2);
    expect(view.canWriteBackRead).toBe(true);
    expect(view.canWriteBackStar).toBe(true);
  });
});
