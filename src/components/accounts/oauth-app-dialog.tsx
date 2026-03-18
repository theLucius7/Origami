"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { addOAuthApp, updateOAuthApp } from "@/app/actions/oauth-apps";
import type { OAuthAppUsageView } from "@/components/accounts/types";
import type { OAuthProviderKind } from "@/lib/oauth-apps.shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";

interface OAuthAppDialogProps {
  app?: OAuthAppUsageView;
  defaultProvider?: OAuthProviderKind;
}

export function OAuthAppDialog({
  app,
  defaultProvider = "gmail",
}: OAuthAppDialogProps) {
  const { isPending, run } = useClientAction();
  const isEdit = Boolean(app);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<OAuthProviderKind>(app?.provider ?? defaultProvider);
  const [id, setId] = useState(app?.id ?? "");
  const [label, setLabel] = useState(app?.label ?? "");
  const [clientId, setClientId] = useState(app?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [tenant, setTenant] = useState(app?.tenant ?? "common");

  function resetForm() {
    setProvider(app?.provider ?? defaultProvider);
    setId(app?.id ?? "");
    setLabel(app?.label ?? "");
    setClientId(app?.clientId ?? "");
    setClientSecret("");
    setTenant(app?.tenant ?? "common");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    void run({
      action: () => {
        const payload = {
          id,
          provider,
          label,
          clientId,
          clientSecret: clientSecret || undefined,
          tenant: provider === "outlook" ? tenant : undefined,
        };

        return isEdit ? updateOAuthApp(payload) : addOAuthApp(payload);
      },
      refresh: true,
      successToast: {
        title: isEdit ? "OAuth 应用已保存" : "OAuth 应用已创建",
        description: isEdit ? "新的应用配置已经生效。" : "你现在可以在接入账号时使用这个应用。",
      },
      errorToast: (error) => ({
        title: isEdit ? "保存 OAuth 应用失败" : "创建 OAuth 应用失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetForm();
      }}
    >
      <Button
        variant={isEdit ? "outline" : "default"}
        size="sm"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        {isEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
        {isEdit ? "编辑" : "添加 OAuth 应用"}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑 OAuth 应用" : "添加 OAuth 应用"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oauth-provider">提供商</Label>
            <select
              id="oauth-provider"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={provider}
              onChange={(event) => setProvider(event.target.value as OAuthProviderKind)}
              disabled={isPending || isEdit}
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-app-id">App ID</Label>
            <Input
              id="oauth-app-id"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="例如：corp-gmail"
              disabled={isPending || isEdit}
              required
            />
            <p className="text-xs text-muted-foreground">
              仅允许小写字母、数字、下划线和连字符；保存后作为账号绑定和 OAuth state 中的稳定标识。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-label">显示名称</Label>
            <Input
              id="oauth-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="例如：公司 Gmail 应用"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-client-id">Client ID</Label>
            <Input
              id="oauth-client-id"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder={isEdit ? "留空表示保持原 Client ID 不变（当前实现需重新填写）" : "输入 OAuth Client ID"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-client-secret">Client Secret</Label>
            <Input
              id="oauth-client-secret"
              type="password"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder={isEdit ? "留空表示保持现有 Client Secret" : "输入 OAuth Client Secret"}
              required={!isEdit}
            />
          </div>

          {provider === "outlook" && (
            <div className="space-y-2">
              <Label htmlFor="oauth-tenant">Tenant</Label>
              <Input
                id="oauth-tenant"
                value={tenant}
                onChange={(event) => setTenant(event.target.value)}
                placeholder="默认 common"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "保存中..." : isEdit ? "保存 OAuth 应用" : "创建 OAuth 应用"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
