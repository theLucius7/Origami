"use client";

import { updateAllAccountsWriteBackSettings } from "@/app/actions/account";
import { AccountCard } from "@/components/accounts/account-card";
import { maybeShowWriteBackEnabledToastOnce } from "@/components/accounts/accounts-page-notifications";
import type { AccountSettingsView, OAuthAppUsageView } from "@/components/accounts/types";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";
import { getAccountsMessages } from "@/i18n/accounts";

interface AccountsPanelProps {
  accounts: AccountSettingsView[];
  gmailOAuthApps: OAuthAppUsageView[];
  outlookOAuthApps: OAuthAppUsageView[];
}

export function AccountsPanel({
  accounts,
  gmailOAuthApps,
  outlookOAuthApps,
}: AccountsPanelProps) {
  const { toast } = useToast();
  const { isPending, run } = useClientAction();
  const { locale, messages } = useI18n();
  const t = getAccountsMessages(locale);

  const eligibleReadAccounts = accounts.filter((account) => account.canWriteBackRead);
  const eligibleStarAccounts = accounts.filter((account) => account.canWriteBackStar);
  const allReadEnabled =
    eligibleReadAccounts.length > 0 && eligibleReadAccounts.every((account) => account.syncReadBack === 1);
  const allStarEnabled =
    eligibleStarAccounts.length > 0 && eligibleStarAccounts.every((account) => account.syncStarBack === 1);

  function toggleAll(key: "syncReadBack" | "syncStarBack", checked: boolean) {
    void run({
      action: () =>
        updateAllAccountsWriteBackSettings(
          key === "syncReadBack"
            ? { syncReadBack: checked }
            : { syncStarBack: checked }
        ),
      refresh: true,
      errorToast: (error) => ({
        title: checked ? t.globalWriteBack.enableFailed : t.globalWriteBack.disableFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
      onSuccess: () => {
        if (checked) {
          maybeShowWriteBackEnabledToastOnce(toast, messages);
        }
      },
    });
  }

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">{t.globalWriteBack.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.globalWriteBack.description}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.globalWriteBack.readTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.globalWriteBack.readDescription}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.globalWriteBack.eligibleCount(eligibleReadAccounts.length, accounts.length)}
                  </p>
                </div>
                <Switch
                  checked={allReadEnabled}
                  disabled={isPending || eligibleReadAccounts.length === 0}
                  onCheckedChange={(checked) => toggleAll("syncReadBack", checked)}
                  aria-label={t.globalWriteBack.readAria}
                />
              </div>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.globalWriteBack.starTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.globalWriteBack.starDescription}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.globalWriteBack.eligibleCount(eligibleStarAccounts.length, accounts.length)}
                  </p>
                </div>
                <Switch
                  checked={allStarEnabled}
                  disabled={isPending || eligibleStarAccounts.length === 0}
                  onCheckedChange={(checked) => toggleAll("syncStarBack", checked)}
                  aria-label={t.globalWriteBack.starAria}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          oauthApps={account.provider === "gmail"
            ? gmailOAuthApps
            : account.provider === "outlook"
              ? outlookOAuthApps
              : []}
        />
      ))}
    </div>
  );
}
