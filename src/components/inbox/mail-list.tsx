"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Star, Clock3, Archive, CheckCircle2 } from "lucide-react";
import type { EmailListItem } from "@/lib/db/schema";
import { formatRelativeTime } from "@/lib/format";
import { getProviderMeta } from "@/config/providers";
import { useI18n } from "@/components/providers/i18n-provider";

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
  const { locale, messages } = useI18n();

  if (emails.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        <p>{messages.mailList.empty}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-2 p-3">
        {emails.map((email) => {
          const provider = accountProviders[email.accountId] ?? "qq";
          const providerMeta = getProviderMeta(provider, locale);
          const isSelectedForBatch = selectedIds.includes(email.id);
          const isSnoozed = !!email.localSnoozeUntil && email.localSnoozeUntil > nowTs;

          return (
            <div
              key={email.id}
              className={cn(
                "group rounded-[20px] border border-transparent bg-background/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border/80 hover:bg-background hover:shadow-md",
                selectedId === email.id && "border-primary/15 bg-accent/55 shadow-none",
                !email.isRead && "border-border/70 bg-primary/[0.045]"
              )}
            >
              <div className="flex gap-3 p-4">
                <button
                  type="button"
                  onClick={() => onToggleSelect(email.id)}
                  aria-pressed={isSelectedForBatch}
                  className={cn(
                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border shadow-sm transition-colors",
                    isSelectedForBatch
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background text-transparent"
                  )}
                  aria-label={isSelectedForBatch ? messages.mailList.unselectMail : messages.mailList.selectMail}
                >
                  <Check className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(email.id)}
                  className="flex min-w-0 flex-1 flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", providerMeta.dotClass)} />
                        <span className={cn("truncate text-sm text-foreground", !email.isRead && "font-semibold")}>
                          {email.sender?.replace(/<.*>/, "").trim() || email.sender}
                        </span>
                        {email.isStarred === 1 && <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <p className={cn("mt-1 truncate text-sm text-foreground/90", !email.isRead && "font-medium")}>
                        {email.subject || messages.common.untitled}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-full text-[10px]", providerMeta.badgeClass)}>
                        {providerMeta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {email.receivedAt ? formatRelativeTime(email.receivedAt, locale) : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {email.localDone === 1 && (
                      <Badge variant="secondary" className="gap-1 rounded-full text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> {messages.inbox.done}
                      </Badge>
                    )}
                    {email.localArchived === 1 && (
                      <Badge variant="secondary" className="gap-1 rounded-full text-[10px]">
                        <Archive className="h-3 w-3" /> {messages.mailList.archived}
                      </Badge>
                    )}
                    {isSnoozed && (
                      <Badge variant="secondary" className="gap-1 rounded-full text-[10px]">
                        <Clock3 className="h-3 w-3" /> {messages.mailList.snoozed}
                      </Badge>
                    )}
                  </div>

                  <p className="truncate text-xs leading-5 text-muted-foreground">
                    {email.snippet || messages.common.noSummary}
                  </p>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
