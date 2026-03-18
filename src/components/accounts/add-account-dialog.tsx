"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { addImapSmtpAccount } from "@/app/actions/account";
import { getGmailOAuthUrl, getOutlookOAuthUrl } from "@/app/actions/oauth";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";
import { getAccountsMessages } from "@/i18n/accounts";
import type { OAuthAppOption } from "@/lib/oauth-apps.shared";
import {
  MAILBOX_PRESET_KEYS,
  MAILBOX_PRESETS,
  getMailboxPresetLabel,
} from "@/lib/providers/imap-smtp/presets";

interface AddAccountDialogProps {
  gmailOAuthApps: OAuthAppOption[];
  outlookOAuthApps: OAuthAppOption[];
}

export function AddAccountDialog({
  gmailOAuthApps,
  outlookOAuthApps,
}: AddAccountDialogProps) {
  const { isPending, run } = useClientAction();
  const { locale } = useI18n();
  const t = getAccountsMessages(locale);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [name, setName] = useState("");
  const [initialFetchLimit, setInitialFetchLimit] = useState("200");
  const [presetKey, setPresetKey] = useState<(typeof MAILBOX_PRESET_KEYS)[number]>("qq");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapSecure, setImapSecure] = useState(true);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [gmailAppId, setGmailAppId] = useState(gmailOAuthApps[0]?.id ?? "default");
  const [outlookAppId, setOutlookAppId] = useState(outlookOAuthApps[0]?.id ?? "default");

  const selectedPreset = useMemo(() => MAILBOX_PRESETS[presetKey], [presetKey]);
  const isCustom = presetKey === "custom";

  function resetForm() {
    setEmail("");
    setAuthUser("");
    setAuthPass("");
    setName("");
    setInitialFetchLimit("200");
    setPresetKey("qq");
    setImapHost("");
    setImapPort("993");
    setImapSecure(true);
    setSmtpHost("");
    setSmtpPort("465");
    setSmtpSecure(true);
  }

  function handleAddImapSmtp(e: React.FormEvent) {
    e.preventDefault();

    void run({
      action: () =>
        addImapSmtpAccount({
          email,
          authUser: authUser || email,
          authPass,
          displayName: name || undefined,
          presetKey,
          imapHost: isCustom ? imapHost : undefined,
          imapPort: isCustom ? Number(imapPort) : undefined,
          imapSecure: isCustom ? imapSecure : undefined,
          smtpHost: isCustom ? smtpHost : undefined,
          smtpPort: isCustom ? Number(smtpPort) : undefined,
          smtpSecure: isCustom ? smtpSecure : undefined,
          initialFetchLimit: Number(initialFetchLimit),
        }),
      refresh: true,
      successToast: { title: t.addDialog.addSuccessTitle, description: t.addDialog.addSuccessDescription },
      errorToast: (error) => ({
        title: t.addDialog.addFailed,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
      onSuccess: () => {
        resetForm();
        setOpen(false);
      },
    });
  }

  function handleGmailAuth() {
    void run({
      action: () => getGmailOAuthUrl({ appId: gmailAppId }),
      onSuccess: (url) => {
        window.location.href = url;
      },
      errorToast: (error) => ({
        title: t.addDialog.gmailRedirectError,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function handleOutlookAuth() {
    void run({
      action: () => getOutlookOAuthUrl({ appId: outlookAppId }),
      onSuccess: (url) => {
        window.location.href = url;
      },
      errorToast: (error) => ({
        title: t.addDialog.outlookRedirectError,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t.addMailbox}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.addDialog.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gmail">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="imap-smtp">{t.tabs.mailbox}</TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">{t.addDialog.gmailIntro}</p>
            <div className="space-y-2">
              <Label htmlFor="gmail-app">{t.oauthApp}</Label>
              <select
                id="gmail-app"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={gmailAppId}
                onChange={(event) => setGmailAppId(event.target.value)}
                disabled={isPending || gmailOAuthApps.length === 0}
              >
                {gmailOAuthApps.map((app) => (
                  <option key={`${app.provider}-${app.id}`} value={app.id}>
                    {app.label}
                  </option>
                ))}
              </select>
              {gmailOAuthApps.length === 0 && (
                <p className="text-xs text-destructive">{t.addDialog.noGmailApps}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleGmailAuth}
              disabled={isPending || gmailOAuthApps.length === 0}
            >
              {isPending ? t.addDialog.redirecting : t.addDialog.useGoogle}
            </Button>
          </TabsContent>

          <TabsContent value="outlook" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">{t.addDialog.outlookIntro}</p>
            <div className="space-y-2">
              <Label htmlFor="outlook-app">{t.oauthApp}</Label>
              <select
                id="outlook-app"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={outlookAppId}
                onChange={(event) => setOutlookAppId(event.target.value)}
                disabled={isPending || outlookOAuthApps.length === 0}
              >
                {outlookOAuthApps.map((app) => (
                  <option key={`${app.provider}-${app.id}`} value={app.id}>
                    {app.label}
                  </option>
                ))}
              </select>
              {outlookOAuthApps.length === 0 && (
                <p className="text-xs text-destructive">{t.addDialog.noOutlookApps}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleOutlookAuth}
              disabled={isPending || outlookOAuthApps.length === 0}
            >
              {isPending ? t.addDialog.redirecting : t.addDialog.useMicrosoft}
            </Button>
          </TabsContent>

          <TabsContent value="imap-smtp" className="pt-4">
            <form onSubmit={handleAddImapSmtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-key">{t.addDialog.mailboxType}</Label>
                <select
                  id="preset-key"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={presetKey}
                  onChange={(event) => {
                    const next = event.target.value as (typeof MAILBOX_PRESET_KEYS)[number];
                    setPresetKey(next);
                    const preset = MAILBOX_PRESETS[next];
                    setImapHost(preset.imapHost);
                    setImapPort(String(preset.imapPort));
                    setImapSecure(preset.secure);
                    setSmtpHost(preset.smtpHost);
                    setSmtpPort(String(preset.smtpPort));
                    setSmtpSecure(preset.secure);
                  }}
                >
                  {MAILBOX_PRESET_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {getMailboxPresetLabel(key, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-email">{t.addDialog.email}</Label>
                <Input
                  id="imap-email"
                  type="email"
                  placeholder={t.addDialog.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-user">{t.addDialog.loginUserOptional}</Label>
                <Input
                  id="auth-user"
                  placeholder={t.addDialog.loginUserPlaceholder}
                  value={authUser}
                  onChange={(e) => setAuthUser(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-pass">
                  {selectedPreset.authType === "authcode" ? t.addDialog.authCode : t.addDialog.passwordOrAuthCode}
                </Label>
                <Input
                  id="auth-pass"
                  type="password"
                  placeholder={selectedPreset.authType === "authcode" ? t.addDialog.authCodePlaceholder : t.addDialog.passwordPlaceholder}
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  required
                />
                {selectedPreset.helpUrl && (
                  <p className="text-xs text-muted-foreground">
                    {t.addDialog.howToGet}
                    <a
                      href={selectedPreset.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 underline underline-offset-4"
                    >
                      {t.addDialog.openHelp}
                    </a>
                  </p>
                )}
              </div>

              {isCustom && (
                <div className="grid gap-4 rounded-md border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="imap-host">{t.addDialog.imapHost}</Label>
                    <Input id="imap-host" value={imapHost} onChange={(e) => setImapHost(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">{t.addDialog.imapPort}</Label>
                      <Input id="imap-port" type="number" value={imapPort} onChange={(e) => setImapPort(e.target.value)} required />
                    </div>
                    <label className="mt-8 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={imapSecure} onChange={(e) => setImapSecure(e.target.checked)} />
                      {t.addDialog.imapSsl}
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">{t.addDialog.smtpHost}</Label>
                    <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">{t.addDialog.smtpPort}</Label>
                      <Input id="smtp-port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} required />
                    </div>
                    <label className="mt-8 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
                      {t.addDialog.smtpSsl}
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imap-name">{t.addDialog.displayNameOptional}</Label>
                <Input
                  id="imap-name"
                  placeholder={t.addDialog.displayNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-fetch-limit">{t.addDialog.initialFetchLimit}</Label>
                <select
                  id="initial-fetch-limit"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={initialFetchLimit}
                  onChange={(event) => setInitialFetchLimit(event.target.value)}
                >
                  <option value="50">50</option>
                  <option value="200">200</option>
                  <option value="1000">1000</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t.addDialog.adding : t.addDialog.addPreset(getMailboxPresetLabel(selectedPreset.key, locale))}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
