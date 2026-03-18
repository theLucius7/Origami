import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AccountsPageNotifications } from "@/components/accounts/accounts-page-notifications";
import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { OAuthAppsPanel } from "@/components/accounts/oauth-apps-panel";
import {
  buildAccountSettingsViews,
  buildOAuthAppsWithUsage,
} from "@/components/accounts/view-models";
import { Separator } from "@/components/ui/separator";
import { listOAuthAppOptions, localizeOAuthAppOptions } from "@/lib/oauth-apps";
import { listAccountRuntimeHealth, listAccounts } from "@/lib/queries/accounts";
import { getRequestLocale } from "@/i18n/locale.server";
import { getMessages } from "@/i18n/messages";

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string; writebackEnabled?: string }>;
}

export default async function AccountsPage({ searchParams }: PageProps) {
  await searchParams;
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const accounts = await listAccounts();
  const runtimeHealthByAccount = await listAccountRuntimeHealth();
  const rawOAuthAppOptions = await listOAuthAppOptions();
  const oauthAppOptions = localizeOAuthAppOptions(rawOAuthAppOptions, locale);
  const oauthAppsWithUsage = buildOAuthAppsWithUsage(accounts, oauthAppOptions);
  const gmailOAuthApps = oauthAppOptions.filter((app) => app.provider === "gmail");
  const outlookOAuthApps = oauthAppOptions.filter((app) => app.provider === "outlook");
  const accountViews = buildAccountSettingsViews({
    accounts,
    oauthAppOptions,
    runtimeHealthByAccount,
    locale,
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl p-6">
        <AccountsPageNotifications />
        <div className="rounded-[2rem] border border-border/80 bg-background/72 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{messages.accountsPage.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {messages.accountsPage.description}
              </p>
            </div>
            <AddAccountDialog
              gmailOAuthApps={gmailOAuthApps}
              outlookOAuthApps={outlookOAuthApps}
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            {accountViews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/80 bg-background/72 py-14 text-center shadow-sm">
                <p className="text-lg text-muted-foreground">{messages.accountsPage.emptyTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {messages.accountsPage.emptyDescription}
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
