"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncAll, syncAccount } from "@/app/actions/sync";
import { useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";
import { getSyncFailureMessage } from "./sync-errors";

export function SyncAllButton() {
  const { isPending, run } = useClientAction();
  const { locale, messages } = useI18n();

  function handleSync() {
    void run({
      action: syncAll,
      refresh: true,
      getFailure: (result) =>
        result.ok
          ? null
          : {
              title: messages.sync.failed,
              description: getSyncFailureMessage(locale, result),
            },
      successToast: (result) => {
        if (!result.ok) return null;

        const failed = result.results.filter((item) => item.error).length;
        const succeeded = result.results.length - failed;

        if (failed > 0) {
          return {
            title: messages.sync.partialFailureTitle,
            description: messages.sync.partialFailureSummary(succeeded, failed),
            variant: "error" as const,
          };
        }

        return {
          title: messages.sync.completed,
          description: messages.sync.processedAccounts(result.results.length),
        };
      },
    });
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start rounded-2xl"
      onClick={handleSync}
      disabled={isPending}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? messages.sync.syncing : messages.sync.syncAll}
    </Button>
  );
}

export function SyncAccountButton({ accountId, ariaLabel }: { accountId: string; ariaLabel?: string }) {
  const { isPending, run } = useClientAction();
  const { locale, messages } = useI18n();
  const [result, setResult] = useState<string | null>(null);

  function showResult(message: string) {
    setResult(message);
    window.setTimeout(() => setResult(null), 3000);
  }

  function handleSync() {
    void run({
      action: () => syncAccount(accountId),
      refresh: true,
      getFailure: (res) =>
        res.ok
          ? null
          : {
              title: messages.sync.failed,
              description: getSyncFailureMessage(locale, res),
              toast: false,
            },
      onSuccess: (res) => {
        if (!res.ok) return;
        showResult(messages.sync.syncedEmails(res.synced));
      },
      onFailure: (failure) => {
        showResult(`${messages.sync.errorPrefix}: ${failure.description ?? messages.sync.failed}`);
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isPending}
        aria-label={ariaLabel}
      >
        <RefreshCw className={`mr-1 h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? messages.sync.syncing : messages.sync.sync}
      </Button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  );
}
