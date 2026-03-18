import { buildComposeHref } from "@/lib/inbox-route";

export function resolveComposeLinkHref(hasAccounts: boolean, accountId?: string) {
  if (!hasAccounts) return null;
  return buildComposeHref(accountId);
}
