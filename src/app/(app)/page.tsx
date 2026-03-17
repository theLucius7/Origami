import { listAccounts } from "@/lib/queries/accounts";
import { listEmails } from "@/lib/queries/emails";
import { InboxView } from "@/components/inbox/inbox-view";

interface PageProps {
  searchParams: Promise<{
    account?: string;
    starred?: string;
    search?: string;
    mail?: string;
  }>;
}

export default async function InboxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accountId = params.account;
  const starred = params.starred === "1";
  const search = params.search?.trim() || undefined;
  const selectedMailId = params.mail;

  const [emailList, accountList] = await Promise.all([
    listEmails({ accountId, starred, search }),
    listAccounts(),
  ]);

  const accountProviders: Record<string, string> = {};
  for (const acc of accountList) {
    accountProviders[acc.id] = acc.provider;
  }

  return (
    <InboxView
      initialEmails={emailList}
      accountProviders={accountProviders}
      accountId={accountId}
      starred={starred}
      initialSearch={search ?? ""}
      selectedMailId={selectedMailId}
    />
  );
}
