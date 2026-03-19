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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";
import { getAccountsMessages } from "@/i18n/accounts";

interface OAuthAppDialogProps {
  app?: OAuthAppUsageView;
  defaultProvider?: OAuthProviderKind;
  buttonAriaLabel?: string;
}

export function OAuthAppDialog({
  app,
  defaultProvider = "gmail",
  buttonAriaLabel,
}: OAuthAppDialogProps) {
  const { isPending, run } = useClientAction();
  const { locale } = useI18n();
  const t = getAccountsMessages(locale);
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
        title: isEdit ? t.oauthDialog.saveSuccessTitle : t.oauthDialog.createSuccessTitle,
        description: isEdit ? t.oauthDialog.saveSuccessDescription : t.oauthDialog.createSuccessDescription,
      },
      errorToast: (error) => ({
        title: isEdit ? t.oauthDialog.saveFailed : t.oauthDialog.createFailed,
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
        aria-label={buttonAriaLabel}
      >
        {isEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
        {isEdit ? t.oauthDialog.edit : t.oauthDialog.add}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.oauthDialog.titleEdit : t.oauthDialog.titleAdd}</DialogTitle>
          <DialogDescription>{isEdit ? t.oauthDialog.descriptionEdit : t.oauthDialog.descriptionAdd}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oauth-provider">{t.oauthDialog.provider}</Label>
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
            <Label htmlFor="oauth-app-id">{t.oauthDialog.appId}</Label>
            <Input
              id="oauth-app-id"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder={t.oauthDialog.appIdPlaceholder}
              disabled={isPending || isEdit}
              required
            />
            <p className="text-xs text-muted-foreground">{t.oauthDialog.appIdHelp}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-label">{t.oauthDialog.displayName}</Label>
            <Input
              id="oauth-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t.oauthDialog.displayNamePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-client-id">{t.oauthDialog.clientId}</Label>
            <Input
              id="oauth-client-id"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder={isEdit ? t.oauthDialog.clientIdPlaceholderEdit : t.oauthDialog.clientIdPlaceholderAdd}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth-client-secret">{t.oauthDialog.clientSecret}</Label>
            <Input
              id="oauth-client-secret"
              type="password"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder={isEdit ? t.oauthDialog.clientSecretPlaceholderEdit : t.oauthDialog.clientSecretPlaceholderAdd}
              required={!isEdit}
            />
          </div>

          {provider === "outlook" && (
            <div className="space-y-2">
              <Label htmlFor="oauth-tenant">{t.oauthDialog.tenant}</Label>
              <Input
                id="oauth-tenant"
                value={tenant}
                onChange={(event) => setTenant(event.target.value)}
                placeholder={t.oauthDialog.tenantPlaceholder}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t.saving : isEdit ? t.oauthDialog.saveButton : t.oauthDialog.createButton}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
