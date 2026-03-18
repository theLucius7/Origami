"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clock3, Trash2 } from "lucide-react";
import {
  removeAccount,
  updateAccountInitialFetchLimit,
  updateAccountWriteBackSettings,
} from "@/app/actions/account";
import { getGmailOAuthUrl, getOutlookOAuthUrl } from "@/app/actions/oauth";
import { maybeShowWriteBackEnabledToastOnce } from "@/components/accounts/accounts-page-notifications";
import { EditMailboxAccountDialog } from "@/components/accounts/edit-mailbox-account-dialog";
import type { AccountSettingsView, OAuthAppUsageView } from "@/components/accounts/types";
import { useI18n } from "@/components/providers/i18n-provider";
import { SyncAccountButton } from "@/components/sync/sync-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getProviderMeta } from "@/config/providers";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { getAccountsMessages } from "@/i18n/accounts";
import { formatRelativeTime } from "@/lib/format";
import { getMailboxPreset, getMailboxPresetLabel } from "@/lib/providers/imap-smtp/presets";
import { mapRuntimeErrorToMessage } from "@/lib/runtime-errors";
import { useToast } from "@/hooks/use-toast";

interface AccountCardProps {
  account: AccountSettingsView;
  oauthApps: OAuthAppUsageView[];
}

export function AccountCard({ account, oauthApps }: AccountCardProps) {
  const { toast } = useToast();
  const { isPending, run } = useClientAction();
  const { locale, messages } = useI18n();
  const t = getAccountsMessages(locale);
  const [fetchLimit, setFetchLimit] = useState(String(account.initialFetchLimit ?? 200));
  const provider = getProviderMeta(account.provider, locale);
  const isMailboxAccount = account.provider === "qq" || account.provider === "imap_smtp";
  const supportsOauthReauth = account.provider === "gmail" || account.provider === "outlook";
  const preset = useMemo(
    () => getMailboxPreset(account.presetKey ?? (account.provider === "qq" ? "qq" : null)),
    [account.presetKey, account.provider]
  );
  const presetLabel = getMailboxPresetLabel(
    account.presetKey ?? (account.provider === "qq" ? "qq" : null),
    locale
  );
  const currentOauthAppId = account.oauthAppId ?? "default";
  const [selectedOauthAppId, setSelectedOauthAppId] = useState(currentOauthAppId);
  const selectedOAuthApp = oauthApps.find((item) => item.id === selectedOauthAppId) ?? null;

  function handleRemove() {
    if (!confirm(t.accountCard.removeConfirm(account.email))) return;

    void run({
      action: () => removeAccount(account.id),
      refresh: true,
      successToast: {
        title: t.accountCard.removeSuccessTitle,
        description: t.accountCard.removeSuccessDescription(account.email),
      },
      errorToast: (error) => ({
        title: t.accountCard.removeFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function handleFetchLimitChange(value: string) {
    const previous = fetchLimit;
    setFetchLimit(value);

    void run({
      action: () => updateAccountInitialFetchLimit(account.id, Number(value)),
      refresh: true,
      errorToast: (error) => ({
        title: t.accountCard.updateFetchLimitFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
      onError: () => setFetchLimit(previous),
    });
  }

  function handleWriteBackToggle(key: "syncReadBack" | "syncStarBack", checked: boolean) {
    const label = key === "syncReadBack" ? t.accountCard.readWriteBack : t.accountCard.starWriteBack;

    void run({
      action: () =>
        updateAccountWriteBackSettings(
          account.id,
          key === "syncReadBack"
            ? { syncReadBack: checked }
            : { syncStarBack: checked }
        ),
      refresh: true,
      errorToast: (error) => ({
        title: t.accountCard.toggleWriteBackFailed(checked, label),
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

  function handleReauthorize(target?: "read" | "star") {
    void run({
      action: async () => {
        const options = {
          appId: selectedOauthAppId,
          intent: "writeback" as const,
          enableReadBack: target === "read" || account.syncReadBack === 1,
          enableStarBack: target === "star" || account.syncStarBack === 1,
        };

        return account.provider === "gmail"
          ? getGmailOAuthUrl(options)
          : getOutlookOAuthUrl(options);
      },
      onSuccess: (url) => {
        window.location.href = url;
      },
      errorToast: (error) => ({
        title: t.accountCard.reauthorizeLinkFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  const readScopeMissing = supportsOauthReauth && !account.canWriteBackRead;
  const starScopeMissing = supportsOauthReauth && !account.canWriteBackStar;
  const shouldShowReadNotice = account.syncReadBack === 1 && account.readBackNotice;
  const shouldShowStarNotice = account.syncStarBack === 1 && account.starBackNotice;
  const hostSummary =
    isMailboxAccount && preset?.key === "custom"
      ? `IMAP ${account.imapHost ?? "-"}:${account.imapPort ?? "-"} · SMTP ${account.smtpHost ?? "-"}:${account.smtpPort ?? "-"}`
      : null;
  const hasRuntimeAttention =
    account.hydrationPendingCount > 0 ||
    account.hydrationFailedCount > 0 ||
    account.readWriteBackPendingCount > 0 ||
    account.readWriteBackFailedCount > 0 ||
    account.starWriteBackPendingCount > 0 ||
    account.starWriteBackFailedCount > 0;

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
                <Badge variant="outline">{presetLabel}</Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{account.email}</p>
            {isMailboxAccount && preset && (
              <p className="mt-1 text-xs text-muted-foreground">
                {preset.key === "custom" ? t.accountCard.customServer : t.accountCard.preset(presetLabel)}
                {hostSummary ? ` · ${hostSummary}` : ""}
              </p>
            )}
            {supportsOauthReauth && account.oauthAppLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.accountCard.oauthAppLine(account.oauthAppLabel)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {account.lastSyncedAt
                ? t.accountCard.lastSync(formatRelativeTime(account.lastSyncedAt))
                : t.accountCard.notSynced}
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
              <p className="text-sm font-medium">{t.accountCard.oauthTitle}</p>
              <p className="text-xs text-muted-foreground">{t.accountCard.oauthDescription}</p>
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
                {t.accountCard.reauthorize}
              </Button>
            </div>
            {selectedOAuthApp && (
              <p className="text-xs text-muted-foreground">
                {t.accountCard.selectedApp(
                  selectedOAuthApp.label,
                  selectedOAuthApp.source === "db" ? t.accountCard.sourceDb : t.accountCard.sourceEnv
                )}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{t.accountCard.initialFetchTitle}</p>
            <p className="text-xs text-muted-foreground">{t.accountCard.initialFetchDescription}</p>
          </div>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={fetchLimit}
            onChange={(event) => handleFetchLimitChange(event.target.value)}
            disabled={isPending}
          >
            <option value="50">50</option>
            <option value="200">200</option>
            <option value="1000">1000</option>
          </select>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{t.accountCard.writeBackTitle}</p>
            <p className="text-xs text-muted-foreground">{t.accountCard.writeBackDescription}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.accountCard.readCardTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.accountCard.readCardDescription}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.accountCard.currentStatus(account.syncReadBack === 1)}
                  </p>
                </div>
                <Switch
                  checked={account.syncReadBack === 1}
                  disabled={isPending || readScopeMissing}
                  onCheckedChange={(checked) => handleWriteBackToggle("syncReadBack", checked)}
                  aria-label={t.accountCard.readAria}
                />
              </div>
              {readScopeMissing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                  <span>{t.accountCard.missingPermission}</span>
                  <Button
                    variant="link"
                    className="h-auto px-0 py-0 text-xs text-amber-800"
                    onClick={() => handleReauthorize("read")}
                    disabled={isPending}
                  >
                    {t.accountCard.needReauthorize}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.accountCard.starCardTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.accountCard.starCardDescription}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.accountCard.currentStatus(account.syncStarBack === 1)}
                  </p>
                </div>
                <Switch
                  checked={account.syncStarBack === 1}
                  disabled={isPending || starScopeMissing}
                  onCheckedChange={(checked) => handleWriteBackToggle("syncStarBack", checked)}
                  aria-label={t.accountCard.starAria}
                />
              </div>
              {starScopeMissing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                  <span>{t.accountCard.missingPermission}</span>
                  <Button
                    variant="link"
                    className="h-auto px-0 py-0 text-xs text-amber-800"
                    onClick={() => handleReauthorize("star")}
                    disabled={isPending}
                  >
                    {t.accountCard.needReauthorize}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {(shouldShowReadNotice || shouldShowStarNotice) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-medium">{t.accountCard.noticeTitle}</p>
              {shouldShowReadNotice && (
                <p className="mt-1">{t.accountCard.readNotice(account.readBackNotice ?? "")}</p>
              )}
              {shouldShowStarNotice && (
                <p className="mt-1">{t.accountCard.starNotice(account.starBackNotice ?? "")}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{t.accountCard.runtimeTitle}</p>
            <p className="text-xs text-muted-foreground">{t.accountCard.runtimeDescription}</p>
          </div>

          {hasRuntimeAttention ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {t.accountCard.hydration}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.accountCard.runtimeCount(account.hydrationFailedCount, account.hydrationPendingCount)}
                </p>
                {account.latestHydrationError && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="line-clamp-2 text-foreground/90">
                      {t.accountCard.latestError(
                        mapRuntimeErrorToMessage({ locale, error: account.latestHydrationError }) ?? account.latestHydrationError
                      )}
                    </p>
                    {account.latestHydrationAt && (
                      <p className="mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeTime(account.latestHydrationAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {t.accountCard.readRuntime}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.accountCard.runtimeCount(
                    account.readWriteBackFailedCount,
                    account.readWriteBackPendingCount
                  )}
                </p>
                {account.latestReadWriteBackError && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="line-clamp-2 text-foreground/90">
                      {t.accountCard.latestError(
                        mapRuntimeErrorToMessage({ locale, error: account.latestReadWriteBackError }) ?? account.latestReadWriteBackError
                      )}
                    </p>
                    {account.latestReadWriteBackAt && (
                      <p className="mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeTime(account.latestReadWriteBackAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {t.accountCard.starRuntime}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.accountCard.runtimeCount(
                    account.starWriteBackFailedCount,
                    account.starWriteBackPendingCount
                  )}
                </p>
                {account.latestStarWriteBackError && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="line-clamp-2 text-foreground/90">
                      {t.accountCard.latestError(
                        mapRuntimeErrorToMessage({ locale, error: account.latestStarWriteBackError }) ?? account.latestStarWriteBackError
                      )}
                    </p>
                    {account.latestStarWriteBackAt && (
                      <p className="mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeTime(account.latestStarWriteBackAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              {t.accountCard.noRuntimeIssues}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
