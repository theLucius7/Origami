"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import type { EmailListItem } from "@/lib/db/schema";
import { formatRelativeTime } from "@/lib/format";

const PROVIDER_DOT: Record<string, string> = {
  gmail: "bg-red-500",
  outlook: "bg-blue-500",
  qq: "bg-green-500",
};

interface MailListProps {
  emails: EmailListItem[];
  selectedId?: string;
  accountProviders: Record<string, string>;
  onSelect: (id: string) => void;
}

export function MailList({ emails, selectedId, accountProviders, onSelect }: MailListProps) {
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
          return (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={cn(
                "flex w-full flex-col gap-1 p-3 text-left transition-colors hover:bg-accent",
                selectedId === email.id && "bg-accent",
                !email.isRead && "bg-primary/[0.03]"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    PROVIDER_DOT[provider] ?? "bg-gray-400"
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
              <p className="truncate pl-4 text-xs text-muted-foreground">
                {email.snippet}
              </p>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
