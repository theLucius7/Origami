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
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_26%)] p-4 md:p-6">
      <InboxView
        initialEmails={emailList}
        accountProviders={accountProviders}
        accountId={accountId}
        starred={starred}
        initialSearch={search ?? ""}
        selectedMailId={selectedMailId}
      />
    </div>
  );
}
