import { buildComposeHref, buildInboxHref, buildSentHref } from "@/lib/inbox-route";

interface SidebarNavigationInput {
  pathname: string;
  accountId?: string;
  starred?: boolean;
  hasSendAccounts: boolean;
}

export function resolveSidebarNavigationState({
  pathname,
  accountId,
  starred,
  hasSendAccounts,
}: SidebarNavigationInput) {
  const isStarredView = pathname === "/" && starred === true;
  const isInboxView = pathname === "/" && !accountId && !isStarredView;
  const isSentView = pathname === "/sent" || pathname.startsWith("/sent/");
  const isAccountsView = pathname === "/accounts";

  return {
    activeAccountId: accountId,
    isStarredView,
    isInboxView,
    isSentView,
    isAccountsView,
    composeHref: buildComposeHref(accountId),
    starredHref: buildInboxHref({ starred: true }),
    sentHref: hasSendAccounts ? buildSentHref(accountId) : null,
  };
}
