import { Sidebar } from "@/components/layout/sidebar";
import { listSendCapableAccounts } from "@/lib/account-providers";
import { listAccounts } from "@/lib/queries/accounts";
import { countUnreadEmails } from "@/lib/queries/emails";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accounts, unreadCount, sendCapableAccounts] = await Promise.all([
    listAccounts(),
    countUnreadEmails(),
    listSendCapableAccounts(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        accounts={accounts}
        unreadCount={unreadCount}
        hasSendAccounts={sendCapableAccounts.length > 0}
      />
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
