"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Star, Clock3, Archive, CheckCircle2 } from "lucide-react";
import type { EmailListItem } from "@/lib/db/schema";
import { formatRelativeTime } from "@/lib/format";
import { getProviderMeta } from "@/config/providers";

interface MailListProps {
  emails: EmailListItem[];
  selectedId?: string;
  selectedIds: string[];
  accountProviders: Record<string, string>;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

export function MailList({
  emails,
  selectedId,
  selectedIds,
  accountProviders,
  onSelect,
  onToggleSelect,
}: MailListProps) {
  const [nowTs] = useState(() => Math.floor(Date.now() / 1000));
  if (emails.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>暂无邮件</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {emails.map((email) => {
          const provider = accountProviders[email.accountId] ?? "qq";
          const isSelectedForBatch = selectedIds.includes(email.id);
          const isSnoozed = !!email.localSnoozeUntil && email.localSnoozeUntil > nowTs;

          return (
            <div
              key={email.id}
              className={cn(
                "flex gap-2 p-3 transition-colors hover:bg-accent",
                selectedId === email.id && "bg-accent",
                !email.isRead && "bg-primary/[0.03]"
              )}
            >
              <button
                type="button"
                onClick={() => onToggleSelect(email.id)}
                className={cn(
                  "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelectedForBatch
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                )}
                aria-label={isSelectedForBatch ? "取消选择" : "选择邮件"}
              >
                {isSelectedForBatch && <Check className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => onSelect(email.id)}
                className="flex min-w-0 flex-1 flex-col gap-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      getProviderMeta(provider).dotClass
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 truncate text-sm",
                      !email.isRead && "font-semibold"
                    )}
                  >
                    {email.sender?.replace(/<.*>/, "").trim() || email.sender}
                  </span>
                  {email.isStarred === 1 && (
                    <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {email.receivedAt ? formatRelativeTime(email.receivedAt) : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className={cn("truncate text-sm", !email.isRead && "font-medium")}>
                    {email.subject || "(无主题)"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 pl-4">
                  {email.localDone === 1 && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                  {email.localArchived === 1 && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Archive className="h-3 w-3" /> 已归档
                    </Badge>
                  )}
                  {isSnoozed && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Clock3 className="h-3 w-3" /> 稍后看
                    </Badge>
                  )}
                </div>
                <p className="truncate pl-4 text-xs text-muted-foreground">
                  {email.snippet}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
