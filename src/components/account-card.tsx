"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { removeAccount, updateAccountInitialFetchLimit } from "@/actions/account";
import { SyncAccountButton } from "./sync-button";
import { formatRelativeTime } from "@/lib/format";
import type { Account } from "@/lib/db/schema";

const PROVIDER_STYLES: Record<string, { label: string; color: string }> = {
  gmail: { label: "Gmail", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  outlook: { label: "Outlook", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  qq: { label: "QQ 邮箱", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export function AccountCard({ account }: { account: Account }) {
  const [isPending, startTransition] = useTransition();
  const [fetchLimit, setFetchLimit] = useState(String(account.initialFetchLimit ?? 200));
  const style = PROVIDER_STYLES[account.provider] ?? { label: account.provider, color: "bg-gray-100" };

  function handleRemove() {
    if (!confirm(`确定要删除 ${account.email} 吗？关联的邮件数据也会被删除。`)) return;
    startTransition(async () => {
      await removeAccount(account.id);
    });
  }

  function handleFetchLimitChange(value: string) {
    setFetchLimit(value);
    startTransition(async () => {
      await updateAccountInitialFetchLimit(account.id, Number(value));
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{account.displayName ?? account.email}</span>
              <Badge variant="secondary" className={style.color}>
                {style.label}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{account.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {account.lastSyncedAt
                ? `上次同步: ${formatRelativeTime(account.lastSyncedAt)}`
                : "尚未同步"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
      </CardContent>
    </Card>
  );
}
