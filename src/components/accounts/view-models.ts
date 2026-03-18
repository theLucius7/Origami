import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import { getAccountWriteBackAvailability } from "@/lib/providers/writeBack";
import { EMPTY_ACCOUNT_RUNTIME_HEALTH } from "@/lib/queries/accounts";
import type { Account } from "@/lib/db/schema";
import type { OAuthAppOption } from "@/lib/oauth-apps.shared";
import type { AccountRuntimeHealthSummary } from "@/lib/queries/accounts";
import type { AccountSettingsView, OAuthAppUsageView } from "./types";

export function buildOAuthAppsWithUsage(
  accounts: Account[],
  oauthAppOptions: OAuthAppOption[]
): OAuthAppUsageView[] {
  const usageByAppKey = new Map<string, number>();

  for (const account of accounts) {
    if (account.provider !== "gmail" && account.provider !== "outlook") continue;
    const effectiveAppId = account.oauthAppId ?? DEFAULT_OAUTH_APP_ID;
    const key = `${account.provider}:${effectiveAppId}`;
    usageByAppKey.set(key, (usageByAppKey.get(key) ?? 0) + 1);
  }

  return oauthAppOptions.map((app) => ({
    ...app,
    usageCount: usageByAppKey.get(`${app.provider}:${app.id}`) ?? 0,
  }));
}

export function buildAccountSettingsViews(params: {
  accounts: Account[];
  oauthAppOptions: OAuthAppOption[];
  runtimeHealthByAccount: Map<string, AccountRuntimeHealthSummary>;
}): AccountSettingsView[] {
  const oauthAppLabelByKey = new Map<string, string>();

  for (const app of params.oauthAppOptions) {
    oauthAppLabelByKey.set(`${app.provider}:${app.id}`, app.label);
  }

  return params.accounts.map((account) => {
    const oauthAppLabel =
      account.provider === "gmail" || account.provider === "outlook"
        ? oauthAppLabelByKey.get(
            `${account.provider}:${account.oauthAppId ?? DEFAULT_OAUTH_APP_ID}`
          ) ?? (account.oauthAppId ?? DEFAULT_OAUTH_APP_ID)
        : null;

    return {
      ...account,
      ...EMPTY_ACCOUNT_RUNTIME_HEALTH,
      ...params.runtimeHealthByAccount.get(account.id),
      oauthAppLabel,
      ...getAccountWriteBackAvailability(account),
    };
  });
}
