"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncAll, syncAccount } from "@/app/actions/sync";
import { useClientAction } from "@/hooks/use-client-action";

export function SyncAllButton() {
  const { isPending, run } = useClientAction();

  function handleSync() {
    void run({
      action: syncAll,
      refresh: true,
      getFailure: (result) =>
        result.ok ? null : { title: "同步失败", description: result.error },
      successToast: (result) =>
        result.ok
          ? {
              title: "同步完成",
              description: `已处理 ${result.results.length} 个账号。`,
            }
          : null,
    });
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleSync}
      disabled={isPending}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "同步中..." : "同步所有邮箱"}
    </Button>
  );
}

export function SyncAccountButton({ accountId }: { accountId: string }) {
  const { isPending, run } = useClientAction();
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
        res.ok ? null : { title: "同步失败", description: res.error, toast: false },
      onSuccess: (res) => {
        if (!res.ok) return;
        showResult(`同步了 ${res.synced} 封邮件`);
      },
      onFailure: (failure) => {
        showResult(`错误: ${failure.description ?? "同步失败"}`);
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
      >
        <RefreshCw className={`mr-1 h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "同步中..." : "同步"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
