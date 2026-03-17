"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncAll, syncAccount } from "@/app/actions/sync";

export function SyncAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      await syncAll();
      router.refresh();
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleSync() {
    startTransition(async () => {
      const res = await syncAccount(accountId);
      if (!res.ok) {
        setResult(`错误: ${res.error}`);
      } else {
        setResult(`同步了 ${res.synced} 封邮件`);
        router.refresh();
      }
      setTimeout(() => setResult(null), 3000);
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
