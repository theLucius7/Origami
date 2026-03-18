import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AccountsPageNotifications } from "@/components/accounts/accounts-page-notifications";
import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { OAuthAppsPanel } from "@/components/accounts/oauth-apps-panel";
import {
  buildAccountSettingsViews,
  buildOAuthAppsWithUsage,
} from "@/components/accounts/view-models";
import { Separator } from "@/components/ui/separator";
import { listOAuthAppOptions } from "@/lib/oauth-apps";
import { listAccountRuntimeHealth, listAccounts } from "@/lib/queries/accounts";

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string; writebackEnabled?: string }>;
}

export default async function AccountsPage({ searchParams }: PageProps) {
  await searchParams;
  const accounts = await listAccounts();
  const runtimeHealthByAccount = await listAccountRuntimeHealth();
  const oauthAppOptions = await listOAuthAppOptions();
  const oauthAppsWithUsage = buildOAuthAppsWithUsage(accounts, oauthAppOptions);
  const gmailOAuthApps = oauthAppOptions.filter((app) => app.provider === "gmail");
  const outlookOAuthApps = oauthAppOptions.filter((app) => app.provider === "outlook");
  const accountViews = buildAccountSettingsViews({
    accounts,
    oauthAppOptions,
    runtimeHealthByAccount,
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-5xl p-6">
        <AccountsPageNotifications />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">邮箱账号</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理你的邮箱连接、OAuth 应用，以及 IMAP/SMTP 凭据与服务器配置。
            </p>
          </div>
          <AddAccountDialog
            gmailOAuthApps={gmailOAuthApps}
            outlookOAuthApps={outlookOAuthApps}
          />
        </div>

        <Separator className="my-6" />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            {accountViews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">还没有添加任何邮箱</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击右上角的「添加邮箱」按钮开始
                </p>
              </div>
            ) : (
              <AccountsPanel
                accounts={accountViews}
                gmailOAuthApps={oauthAppsWithUsage.filter((app) => app.provider === "gmail")}
                outlookOAuthApps={oauthAppsWithUsage.filter((app) => app.provider === "outlook")}
              />
            )}
          </div>

          <div>
            <OAuthAppsPanel apps={oauthAppsWithUsage} />
          </div>
        </div>
      </div>
    </div>
  );
}
