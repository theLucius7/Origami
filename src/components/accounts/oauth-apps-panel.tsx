"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removeOAuthApp } from "@/app/actions/oauth-apps";
import { OAuthAppDialog } from "@/components/accounts/oauth-app-dialog";
import type { OAuthAppUsageView } from "@/components/accounts/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OAuthAppsPanelProps {
  apps: OAuthAppUsageView[];
}

function renderProviderTitle(provider: "gmail" | "outlook") {
  return provider === "gmail" ? "Gmail OAuth 应用" : "Outlook OAuth 应用";
}

export function OAuthAppsPanel({ apps }: OAuthAppsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const gmailApps = apps.filter((app) => app.provider === "gmail");
  const outlookApps = apps.filter((app) => app.provider === "outlook");

  function handleRemove(app: OAuthAppUsageView) {
    if (app.source !== "db") return;
    if (!confirm(`确定要删除 OAuth 应用 ${app.label}（${app.id}）吗？`)) return;

    startTransition(async () => {
      await removeOAuthApp(app.id);
      router.refresh();
    });
  }

  function renderGroup(group: OAuthAppUsageView[], provider: "gmail" | "outlook") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{renderProviderTitle(provider)}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              可用于新账号授权，也可在已有账号卡片里切换应用后重新授权。
            </p>
          </div>
          <OAuthAppDialog defaultProvider={provider} />
        </div>

        {group.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            暂无可用应用。
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
                          {app.source === "env" ? "环境变量" : "数据库"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">App ID: {app.id}</p>
                      {app.provider === "outlook" && app.tenant && (
                        <p className="mt-1 text-xs text-muted-foreground">Tenant: {app.tenant}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">当前被 {app.usageCount} 个账号使用</p>
                    </div>
                    {app.source === "db" && (
                      <div className="flex items-center gap-2">
                        <OAuthAppDialog app={app} defaultProvider={provider} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(app)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <h2 className="text-lg font-semibold">OAuth 应用管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          这里管理 Gmail / Outlook 的授权应用。环境变量中的 default 应用会自动显示为只读项；数据库应用可自由新增、编辑和删除。
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {renderGroup(gmailApps, "gmail")}
        {renderGroup(outlookApps, "outlook")}
      </div>
    </div>
  );
}
