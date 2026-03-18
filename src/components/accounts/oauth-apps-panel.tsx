"use client";

import { Trash2 } from "lucide-react";
import { removeOAuthApp } from "@/app/actions/oauth-apps";
import { OAuthAppDialog } from "@/components/accounts/oauth-app-dialog";
import type { OAuthAppUsageView } from "@/components/accounts/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";
import { getAccountsMessages } from "@/i18n/accounts";

interface OAuthAppsPanelProps {
  apps: OAuthAppUsageView[];
}

export function OAuthAppsPanel({ apps }: OAuthAppsPanelProps) {
  const { isPending, run } = useClientAction();
  const { locale } = useI18n();
  const t = getAccountsMessages(locale);

  const gmailApps = apps.filter((app) => app.provider === "gmail");
  const outlookApps = apps.filter((app) => app.provider === "outlook");

  function handleRemove(app: OAuthAppUsageView) {
    if (app.source !== "db") return;
    if (!confirm(t.oauthPanel.removeConfirm(app.label, app.id))) return;

    void run({
      action: () => removeOAuthApp(app.id),
      refresh: true,
      successToast: { title: t.oauthPanel.removeSuccessTitle, description: t.oauthPanel.removeSuccessDescription(app.label) },
      errorToast: (error) => ({
        title: t.oauthPanel.removeFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function renderGroup(group: OAuthAppUsageView[], provider: "gmail" | "outlook") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{provider === "gmail" ? t.oauthPanel.gmailTitle : t.oauthPanel.outlookTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.oauthPanel.groupDescription}</p>
          </div>
          <OAuthAppDialog
            defaultProvider={provider}
            buttonAriaLabel={provider === "gmail" ? t.oauthPanel.addGmailAria : t.oauthPanel.addOutlookAria}
          />
        </div>

        {group.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t.oauthPanel.empty}
          </div>
        ) : (
          <div className="grid gap-3">
            {group.map((app) => (
              <Card key={`${app.provider}-${app.id}`}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{app.label}</span>
                        <Badge variant={app.source === "env" ? "secondary" : "outline"}>
                          {app.source === "env" ? t.oauthPanel.env : t.oauthPanel.db}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{t.oauthPanel.appId}: {app.id}</p>
                      {app.provider === "outlook" && app.tenant && (
                        <p className="mt-1 text-xs text-muted-foreground">{t.oauthPanel.tenant}: {app.tenant}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{t.oauthPanel.usageCount(app.usageCount)}</p>
                    </div>
                    {app.source === "db" && (
                      <div className="flex items-center gap-2">
                        <OAuthAppDialog
                          app={app}
                          defaultProvider={provider}
                          buttonAriaLabel={t.oauthPanel.editButtonAria(app.label)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(app)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                          aria-label={t.oauthPanel.removeButtonAria(app.label)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t.oauthPanel.removeButtonAria(app.label)}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t.oauthPanel.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.oauthPanel.description}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {renderGroup(gmailApps, "gmail")}
        {renderGroup(outlookApps, "outlook")}
      </div>
    </div>
  );
}
