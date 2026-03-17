"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAllAccountsWriteBackSettings } from "@/app/actions/account";
import { AccountCard } from "@/components/accounts/account-card";
import { maybeShowWriteBackEnabledToastOnce } from "@/components/accounts/accounts-page-notifications";
import type { AccountSettingsView, OAuthAppUsageView } from "@/components/accounts/types";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

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
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const allReadEnabled = accounts.every((account) => account.syncReadBack === 1);
  const allStarEnabled = accounts.every((account) => account.syncStarBack === 1);

  function toggleAll(key: "syncReadBack" | "syncStarBack", checked: boolean) {
    startTransition(async () => {
      await updateAllAccountsWriteBackSettings(
        key === "syncReadBack"
          ? { syncReadBack: checked }
          : { syncStarBack: checked }
      );
      if (checked) {
        maybeShowWriteBackEnabledToastOnce(toast);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">全局写回开关</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              这里的“全局”是批量设置：切换后会直接更新所有账号的对应开关。默认全部关闭；写回失败会静默降级，不影响本地 triage。
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
                </div>
                <Switch
                  checked={allReadEnabled}
                  disabled={isPending}
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
                </div>
                <Switch
                  checked={allStarEnabled}
                  disabled={isPending}
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
