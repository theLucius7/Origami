import { Sidebar } from "@/components/sidebar";
import { getAccounts, getSendCapableAccounts } from "@/actions/account";
import { getUnreadCount } from "@/actions/email";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accounts, unreadCount, sendCapableAccounts] = await Promise.all([
    getAccounts(),
    getUnreadCount(),
    getSendCapableAccounts(),
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
