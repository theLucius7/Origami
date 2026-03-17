import type { Account } from "@/lib/db/schema";
import type { OAuthAppOption } from "@/lib/oauth-apps.shared";
import type { AccountRuntimeHealthSummary } from "@/lib/queries/accounts";

export type AccountSettingsView = Account &
  AccountRuntimeHealthSummary & {
    canWriteBackRead: boolean;
    canWriteBackStar: boolean;
    readBackNotice: string | null;
    starBackNotice: string | null;
    oauthAppLabel: string | null;
  };

export type OAuthAppUsageView = OAuthAppOption & {
  usageCount: number;
};
