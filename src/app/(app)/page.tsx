import { getEmails } from "@/actions/email";
import { getAccounts } from "@/actions/account";
import { InboxView } from "@/components/inbox-view";

interface PageProps {
  searchParams: Promise<{
    account?: string;
    starred?: string;
  }>;
}

export default async function InboxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accountId = params.account;
  const starred = params.starred === "1";

  const [emailList, accountList] = await Promise.all([
    getEmails({ accountId, starred }),
    getAccounts(),
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
    />
  );
}
