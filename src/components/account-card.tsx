"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { removeAccount, updateAccountInitialFetchLimit } from "@/actions/account";
import { SyncAccountButton } from "./sync-button";
import { formatRelativeTime } from "@/lib/format";
import { getProviderMeta } from "@/lib/provider-meta";
import type { Account } from "@/lib/db/schema";

export function AccountCard({ account }: { account: Account }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fetchLimit, setFetchLimit] = useState(String(account.initialFetchLimit ?? 200));
  const provider = getProviderMeta(account.provider);

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
