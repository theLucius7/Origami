import { listAccounts } from "@/lib/queries/accounts";
import { AccountCard } from "@/components/accounts/account-card";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { Separator } from "@/components/ui/separator";

export default async function AccountsPage() {
  const accounts = await listAccounts();

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">邮箱账号</h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理你的邮箱连接，添加或移除账号。
            </p>
          </div>
          <AddAccountDialog />
        </div>

        <Separator className="my-6" />

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">还没有添加任何邮箱</p>
            <p className="mt-1 text-sm text-muted-foreground">
              点击右上角的「添加邮箱」按钮开始
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
