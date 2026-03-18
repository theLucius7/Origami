"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
import { getProviderMeta } from "@/config/providers";
import { ComposeLink } from "@/components/compose/compose-link";
import { SyncAllButton } from "@/components/sync/sync-button";
import { buildInboxHref } from "@/lib/inbox-route";
import { resolveSidebarNavigationState } from "./sidebar-state";

interface SidebarProps {
  accounts: Account[];
  unreadCount: number;
  hasSendAccounts: boolean;
}

export function Sidebar({ accounts, unreadCount, hasSendAccounts }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigation = resolveSidebarNavigationState({
    pathname,
    accountId: searchParams.get("account") ?? undefined,
    starred: searchParams.get("starred") === "1",
    hasSendAccounts,
  });

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
            variant={navigation.isInboxView ? "secondary" : "ghost"}
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

          <Button variant={navigation.isStarredView ? "secondary" : "ghost"} className="w-full justify-start" asChild>
            <Link href={buildInboxHref({ starred: true })}>
              <Star className="mr-2 h-4 w-4" />
              已标星
            </Link>
          </Button>

          {hasSendAccounts && navigation.sentHref && (
            <Button variant={navigation.isSentView ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href={navigation.sentHref}>
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
              variant={navigation.activeAccountId === account.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={buildInboxHref({ accountId: account.id })}>
                <span
                  className={cn(
                    "mr-2 h-2 w-2 rounded-full",
                    getProviderMeta(account.provider).dotClass
                  )}
                />
                <span className="truncate text-sm">
                  {account.displayName ?? account.email}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {getProviderMeta(account.provider).label}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-1 p-3">
        <SyncAllButton />
        <Button variant={navigation.isAccountsView ? "secondary" : "ghost"} className="w-full justify-start" asChild>
          <Link href="/accounts">
            <Settings className="mr-2 h-4 w-4" />
            管理账号
          </Link>
        </Button>
      </div>
    </div>
  );
}

export { RefreshCw };
