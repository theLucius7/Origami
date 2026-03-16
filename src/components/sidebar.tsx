import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Inbox,
  Star,
  Settings,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import type { Account } from "@/lib/db/schema";
import { SyncAllButton } from "./sync-button";
import { ComposeLink } from "./compose-link";

const PROVIDER_COLORS: Record<string, string> = {
  gmail: "bg-red-500",
  outlook: "bg-blue-500",
  qq: "bg-green-500",
};

const PROVIDER_LABELS: Record<string, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  qq: "QQ 邮箱",
};

interface SidebarProps {
  accounts: Account[];
  activeAccountId?: string;
  unreadCount: number;
  hasSendAccounts: boolean;
}

export function Sidebar({ accounts, activeAccountId, unreadCount, hasSendAccounts }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center gap-2 p-4">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Origami</h1>
      </div>

      <Separator />

      <div className="px-3 pt-3">
        <ComposeLink hasAccounts={hasSendAccounts} />
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <Button
            variant={!activeAccountId ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/">
              <Inbox className="mr-2 h-4 w-4" />
              全部收件箱
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/?starred=1">
              <Star className="mr-2 h-4 w-4" />
              已标星
            </Link>
          </Button>

          {hasSendAccounts && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/sent">
                <Send className="mr-2 h-4 w-4" />
                已发送
              </Link>
            </Button>
          )}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            邮箱账号
          </p>
          {accounts.map((account) => (
            <Button
              key={account.id}
              variant={activeAccountId === account.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={`/?account=${account.id}`}>
                <span
                  className={cn(
                    "mr-2 h-2 w-2 rounded-full",
                    PROVIDER_COLORS[account.provider] ?? "bg-gray-500"
                  )}
                />
                <span className="truncate text-sm">
                  {account.displayName ?? account.email}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {PROVIDER_LABELS[account.provider] ?? account.provider}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3 space-y-1">
        <SyncAllButton />
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/accounts">
            <Settings className="mr-2 h-4 w-4" />
            管理账号
          </Link>
        </Button>
      </div>
    </div>
  );
}

export { PROVIDER_COLORS, PROVIDER_LABELS, RefreshCw };
