import { buildSentDetailHref, buildSentHref } from "@/lib/inbox-route";

interface SendCapableAccountLike {
  id: string;
}

export function resolveComposeAccountId<T extends SendCapableAccountLike>(
  accounts: T[],
  initialAccountId?: string
) {
  if (initialAccountId && accounts.some((account) => account.id === initialAccountId)) {
    return initialAccountId;
  }

  return accounts[0]?.id ?? "";
}

export function buildComposeSuccessHref(localMessageId: string | undefined, accountId: string) {
  return localMessageId
    ? buildSentDetailHref(localMessageId, accountId)
    : buildSentHref(accountId);
}
