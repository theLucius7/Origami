import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AccountsPageNotifications } from "@/components/accounts/accounts-page-notifications";
import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { Separator } from "@/components/ui/separator";
import { getAccountWriteBackAvailability } from "@/lib/providers/writeBack";
import { listAccounts } from "@/lib/queries/accounts";

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string; writebackEnabled?: string }>;
}

export default async function AccountsPage({ searchParams }: PageProps) {
  await searchParams;
  const accounts = await listAccounts();
  const accountViews = accounts.map((account) => ({
    ...account,
    ...getAccountWriteBackAvailability(account),
  }));

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl p-6">
        <AccountsPageNotifications />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">邮箱账号</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理你的邮箱连接，添加或移除账号，也可以按账号开启远端已读/星标写回。
            </p>
          </div>
          <AddAccountDialog />
        </div>

        <Separator className="my-6" />

        {accountViews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">还没有添加任何邮箱</p>
            <p className="mt-1 text-sm text-muted-foreground">
              点击右上角的「添加邮箱」按钮开始
            </p>
          </div>
        ) : (
          <AccountsPanel accounts={accountViews} />
        )}
      </div>
    </div>
  );
}
