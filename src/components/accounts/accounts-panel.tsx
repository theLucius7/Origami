"use client";

import { updateAllAccountsWriteBackSettings } from "@/app/actions/account";
import { AccountCard } from "@/components/accounts/account-card";
import { maybeShowWriteBackEnabledToastOnce } from "@/components/accounts/accounts-page-notifications";
import type { AccountSettingsView, OAuthAppUsageView } from "@/components/accounts/types";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";

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
        title: checked ? "批量开启写回失败" : "批量关闭写回失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
      onSuccess: () => {
        if (checked) {
          maybeShowWriteBackEnabledToastOnce(toast);
        }
      },
    });
  }

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">全局写回开关</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              这里的“全局”是批量设置：默认只会影响当前具备对应写回能力 / 权限的账号；没有权限的账号会被自动跳过。写回失败会静默降级，不影响本地 triage。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">全局开启“已读写回”</p>
                  <p className="text-xs text-muted-foreground">
                    当你在 Origami 标记已读时，尝试同步把远端邮件也标为已读。
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    仅作用于 {eligibleReadAccounts.length}/{accounts.length} 个可写回账号
                  </p>
                </div>
                <Switch
                  checked={allReadEnabled}
                  disabled={isPending || eligibleReadAccounts.length === 0}
                  onCheckedChange={(checked) => toggleAll("syncReadBack", checked)}
                  aria-label="全局已读写回"
                />
              </div>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">全局开启“星标写回”</p>
                  <p className="text-xs text-muted-foreground">
                    当你在 Origami 加星标/去星标时，尝试同步远端的星标状态。
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    仅作用于 {eligibleStarAccounts.length}/{accounts.length} 个可写回账号
                  </p>
                </div>
                <Switch
                  checked={allStarEnabled}
                  disabled={isPending || eligibleStarAccounts.length === 0}
                  onCheckedChange={(checked) => toggleAll("syncStarBack", checked)}
                  aria-label="全局星标写回"
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
