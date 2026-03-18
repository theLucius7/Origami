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
    <aside className="flex h-full w-[18rem] shrink-0 border-r border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,244,238,0.92))] backdrop-blur dark:bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(16,16,18,0.9))]">
      <div className="flex h-full min-h-0 w-full flex-col gap-4 p-4">
        <div className="rounded-3xl border border-border/80 bg-background/85 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{messages.common.brandName}</h1>
              <p className="text-xs text-muted-foreground">{messages.sidebar.workspace}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{messages.sidebar.tagline}</p>
          <div className="mt-4">
            <ComposeLink hasAccounts={hasSendAccounts} />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-1">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/80 bg-background/80 p-3 shadow-sm backdrop-blur">
              <div className="space-y-1">
                <Button
                  variant={navigation.isInboxView ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-2xl"
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

                <Button variant={navigation.isStarredView ? "secondary" : "ghost"} className="w-full justify-start rounded-2xl" asChild>
                  <Link href={buildInboxHref({ starred: true })}>
                    <Star className="mr-2 h-4 w-4" />
                    {messages.sidebar.starred}
                  </Link>
                </Button>

                {hasSendAccounts && navigation.sentHref && (
                  <Button variant={navigation.isSentView ? "secondary" : "ghost"} className="w-full justify-start rounded-2xl" asChild>
                    <Link href={navigation.sentHref}>
                      <Send className="mr-2 h-4 w-4" />
                      {messages.sidebar.sent}
                    </Link>
                  </Button>
                )}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1">
                <p className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {messages.sidebar.mailAccounts}
                </p>
                {accounts.map((account) => {
                  const providerMeta = getProviderMeta(account.provider, locale);
                  return (
                    <Button
                      key={account.id}
                      variant={navigation.activeAccountId === account.id ? "secondary" : "ghost"}
                      className="w-full justify-start rounded-2xl"
                      asChild
                    >
                      <Link href={buildInboxHref({ accountId: account.id })}>
                        <span className={cn("mr-2 h-2 w-2 rounded-full", providerMeta.dotClass)} />
                        <span className="truncate text-sm">{account.displayName ?? account.email}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{providerMeta.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            <LocaleSwitcher />
          </div>
        </ScrollArea>

        <div className="space-y-2 rounded-3xl border border-border/80 bg-background/80 p-3 shadow-sm backdrop-blur">
          <SyncAllButton />
          <Button variant={navigation.isAccountsView ? "secondary" : "ghost"} className="w-full justify-start rounded-2xl" asChild>
            <Link href="/accounts">
              <Settings className="mr-2 h-4 w-4" />
              {messages.sidebar.manageAccounts}
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

export { RefreshCw };
