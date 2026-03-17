import { listSendCapableAccounts } from "@/lib/account-providers";
import { ComposeForm } from "@/components/compose/compose-form";

interface PageProps {
  searchParams: Promise<{ account?: string }>;
}

export default async function ComposePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accounts = await listSendCapableAccounts();

  if (accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">还没有可发信账号</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            请先重新连接 Gmail 或 Outlook，并确保授权包含发送权限后再来写邮件。
          </p>
        </div>
      </div>
    );
  }

  return <ComposeForm accounts={accounts} initialAccountId={params.account} />;
}
