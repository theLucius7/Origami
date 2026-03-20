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
import { LocaleSwitcher } from "@/components/locale/locale-switcher";
import { useI18n } from "@/components/providers/i18n-provider";

interface SidebarProps {
  accounts: Account[];
  unreadCount: number;
  hasSendAccounts: boolean;
}

export function Sidebar({ accounts, unreadCount, hasSendAccounts }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();
  const navigation = resolveSidebarNavigationState({
    pathname,
    accountId: searchParams.get("account") ?? undefined,
    starred: searchParams.get("starred") === "1",
    hasSendAccounts,
  });

  return (
    <aside className="flex h-full w-[18.5rem] shrink-0 p-4">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-background/85 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="border-b border-border/60 px-4 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight">{messages.common.brandName}</h1>
              <p className="text-xs text-muted-foreground">{messages.sidebar.workspace}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{messages.sidebar.tagline}</p>
          <div className="mt-4">
            <ComposeLink hasAccounts={hasSendAccounts} />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-3">
            <div className="space-y-1">
              <Button
                variant={navigation.isInboxView ? "secondary" : "ghost"}
                className="w-full justify-start rounded-2xl px-3"
                asChild
              >
                <Link href="/">
                  <Inbox className="mr-2 h-4 w-4" />
                  {messages.sidebar.allInbox}
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto rounded-full px-2.5">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <Button
                variant={navigation.isStarredView ? "secondary" : "ghost"}
                className="w-full justify-start rounded-2xl px-3"
                asChild
              >
                <Link href={buildInboxHref({ starred: true })}>
                  <Star className="mr-2 h-4 w-4" />
                  {messages.sidebar.starred}
                </Link>
              </Button>

              {hasSendAccounts && navigation.sentHref && (
                <Button
                  variant={navigation.isSentView ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-2xl px-3"
                  asChild
                >
                  <Link href={navigation.sentHref}>
                    <Send className="mr-2 h-4 w-4" />
                    {messages.sidebar.sent}
                  </Link>
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                {messages.sidebar.mailAccounts}
              </p>
              <div className="space-y-1">
                {accounts.map((account) => {
                  const providerMeta = getProviderMeta(account.provider, locale);
                  return (
                    <Button
                      key={account.id}
                      variant={navigation.activeAccountId === account.id ? "secondary" : "ghost"}
                      className="w-full justify-start rounded-2xl px-3"
                      asChild
                    >
                      <Link href={buildInboxHref({ accountId: account.id })}>
                        <span className={cn("mr-3 h-2.5 w-2.5 rounded-full", providerMeta.dotClass)} />
                        <span className="min-w-0 flex-1 truncate text-sm">{account.displayName ?? account.email}</span>
                        <span className="ml-2 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {providerMeta.label}
                        </span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            <LocaleSwitcher />
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 p-3">
          <div className="space-y-2">
            <SyncAllButton />
            <Button
              variant={navigation.isAccountsView ? "secondary" : "ghost"}
              className="w-full justify-start rounded-2xl px-3"
              asChild
            >
              <Link href="/accounts">
                <Settings className="mr-2 h-4 w-4" />
                {messages.sidebar.manageAccounts}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { RefreshCw };
