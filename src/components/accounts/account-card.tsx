"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  removeAccount,
  updateAccountInitialFetchLimit,
  updateAccountWriteBackSettings,
} from "@/app/actions/account";
import { getGmailOAuthUrl, getOutlookOAuthUrl } from "@/app/actions/oauth";
import { maybeShowWriteBackEnabledToastOnce } from "@/components/accounts/accounts-page-notifications";
import { EditMailboxAccountDialog } from "@/components/accounts/edit-mailbox-account-dialog";
import type { AccountSettingsView, OAuthAppUsageView } from "@/components/accounts/types";
import { SyncAccountButton } from "@/components/sync/sync-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getProviderMeta } from "@/config/providers";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/format";
import { getMailboxPreset } from "@/lib/providers/imap-smtp/presets";

interface AccountCardProps {
  account: AccountSettingsView;
  oauthApps: OAuthAppUsageView[];
}

export function AccountCard({ account, oauthApps }: AccountCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fetchLimit, setFetchLimit] = useState(String(account.initialFetchLimit ?? 200));
  const provider = getProviderMeta(account.provider);
  const isMailboxAccount = account.provider === "qq" || account.provider === "imap_smtp";
  const supportsOauthReauth = account.provider === "gmail" || account.provider === "outlook";
  const preset = useMemo(
    () => getMailboxPreset(account.presetKey ?? (account.provider === "qq" ? "qq" : null)),
    [account.presetKey, account.provider]
  );
  const currentOauthAppId = account.oauthAppId ?? "default";
  const [selectedOauthAppId, setSelectedOauthAppId] = useState(currentOauthAppId);
  const selectedOAuthApp = oauthApps.find((item) => item.id === selectedOauthAppId) ?? null;

  function handleRemove() {
    if (!confirm(`确定要删除 ${account.email} 吗？关联的邮件数据也会被删除。`)) return;
    startTransition(async () => {
      await removeAccount(account.id);
      router.refresh();
    });
  }

  function handleFetchLimitChange(value: string) {
    setFetchLimit(value);
    startTransition(async () => {
      await updateAccountInitialFetchLimit(account.id, Number(value));
      router.refresh();
    });
  }

  function handleWriteBackToggle(key: "syncReadBack" | "syncStarBack", checked: boolean) {
    startTransition(async () => {
      await updateAccountWriteBackSettings(
        account.id,
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

  function handleReauthorize(target?: "read" | "star") {
    startTransition(async () => {
      const options = {
        appId: selectedOauthAppId,
        intent: "writeback" as const,
        enableReadBack: target === "read" || account.syncReadBack === 1,
        enableStarBack: target === "star" || account.syncStarBack === 1,
      };

      const url = account.provider === "gmail"
        ? await getGmailOAuthUrl(options)
        : await getOutlookOAuthUrl(options);

      window.location.href = url;
    });
  }

  const readScopeMissing = supportsOauthReauth && !account.canWriteBackRead;
  const starScopeMissing = supportsOauthReauth && !account.canWriteBackStar;
  const shouldShowReadNotice = account.syncReadBack === 1 && account.readBackNotice;
  const shouldShowStarNotice = account.syncStarBack === 1 && account.starBackNotice;
  const hostSummary = isMailboxAccount && preset?.key === "custom"
    ? `IMAP ${account.imapHost ?? "-"}:${account.imapPort ?? "-"} · SMTP ${account.smtpHost ?? "-"}:${account.smtpPort ?? "-"}`
    : null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{account.displayName ?? account.email}</span>
              <Badge variant="secondary" className={provider.badgeClass}>
                {provider.label}
              </Badge>
              {account.provider === "imap_smtp" && preset && (
                <Badge variant="outline">{preset.label}</Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{account.email}</p>
            {isMailboxAccount && preset && (
              <p className="mt-1 text-xs text-muted-foreground">
                {preset.key === "custom"
                  ? "自定义服务器配置"
                  : `预设：${preset.label}`}
                {hostSummary ? ` · ${hostSummary}` : ""}
              </p>
            )}
            {supportsOauthReauth && account.oauthAppLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                OAuth 应用：{account.oauthAppLabel}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {account.lastSyncedAt
                ? `上次同步: ${formatRelativeTime(account.lastSyncedAt)}`
                : "尚未同步"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isMailboxAccount && <EditMailboxAccountDialog account={account} />}
            <SyncAccountButton accountId={account.id} />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {supportsOauthReauth && (
          <div className="space-y-3 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">OAuth 应用</p>
              <p className="text-xs text-muted-foreground">
                可切换用于重新授权的 OAuth 应用。切换后需要重新走一次授权流程，账号才会真正绑定到新的应用。
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm md:max-w-sm"
                value={selectedOauthAppId}
                onChange={(event) => setSelectedOauthAppId(event.target.value)}
                disabled={isPending || oauthApps.length === 0}
              >
                {oauthApps.map((app) => (
                  <option key={`${app.provider}-${app.id}`} value={app.id}>
                    {app.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => handleReauthorize()}
                disabled={isPending || oauthApps.length === 0}
              >
                使用当前应用重新授权
              </Button>
            </div>
            {selectedOAuthApp && (
              <p className="text-xs text-muted-foreground">
                当前选择：{selectedOAuthApp.label}
                {selectedOAuthApp.source === "db" ? "（数据库）" : "（环境变量）"}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">首次同步抓取范围</p>
            <p className="text-xs text-muted-foreground">
              仅影响首次同步的最近邮件数量，默认只拉标题与摘要，正文按需点击时再获取。
            </p>
          </div>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={fetchLimit}
            onChange={(event) => handleFetchLimitChange(event.target.value)}
            disabled={isPending}
          >
            <option value="50">50 封</option>
            <option value="200">200 封</option>
            <option value="1000">1000 封</option>
          </select>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">远端写回</p>
            <p className="text-xs text-muted-foreground">
              默认关闭。开启后，本地操作完成后会尝试把“已读 / 星标”同步写回原邮箱；失败时会静默降级，不阻塞本地操作。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">已读状态回写</p>
                  <p className="text-xs text-muted-foreground">
                    标为已读时，同步将原邮箱中的邮件也标为已读，会修改原邮箱。
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    当前状态：{account.syncReadBack === 1 ? "已开启" : "已关闭"}
                  </p>
                </div>
                <Switch
                  checked={account.syncReadBack === 1}
                  disabled={isPending || readScopeMissing}
                  onCheckedChange={(checked) => handleWriteBackToggle("syncReadBack", checked)}
                  aria-label="已读状态回写"
                />
              </div>
              {readScopeMissing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                  <span>⚠️ 缺少写入权限</span>
                  <Button
                    variant="link"
                    className="h-auto px-0 py-0 text-xs text-amber-800"
                    onClick={() => handleReauthorize("read")}
                    disabled={isPending}
                  >
                    需要重新授权
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">星标回写</p>
                  <p className="text-xs text-muted-foreground">
                    加/取消星标时，同步修改原邮箱中的星标状态，会修改原邮箱。
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    当前状态：{account.syncStarBack === 1 ? "已开启" : "已关闭"}
                  </p>
                </div>
                <Switch
                  checked={account.syncStarBack === 1}
                  disabled={isPending || starScopeMissing}
                  onCheckedChange={(checked) => handleWriteBackToggle("syncStarBack", checked)}
                  aria-label="星标回写"
                />
              </div>
              {starScopeMissing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                  <span>⚠️ 缺少写入权限</span>
                  <Button
                    variant="link"
                    className="h-auto px-0 py-0 text-xs text-amber-800"
                    onClick={() => handleReauthorize("star")}
                    disabled={isPending}
                  >
                    需要重新授权
                  </Button>
                </div>
              )}
            </div>
          </div>

          {(shouldShowReadNotice || shouldShowStarNotice) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-medium">当前账号已开启写回，但授权仍需补齐</p>
              {shouldShowReadNotice && <p className="mt-1">- 已读写回：{account.readBackNotice}</p>}
              {shouldShowStarNotice && <p className="mt-1">- 星标写回：{account.starBackNotice}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
