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
import type { OAuthAppOption } from "@/lib/oauth-apps.shared";
import {
  MAILBOX_PRESET_KEYS,
  MAILBOX_PRESETS,
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
      successToast: { title: "邮箱已添加", description: "新账号已保存，可以开始同步了。" },
      errorToast: (error) => ({
        title: "添加邮箱失败",
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
        title: "跳转 Google 授权失败",
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
        title: "跳转 Microsoft 授权失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        添加邮箱
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加邮箱账号</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gmail">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="imap-smtp">国内邮箱 / IMAP</TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              点击下方按钮将跳转到 Google 授权页面，授权后自动返回。首次同步默认抓取最近 200 封，可在账号管理页修改。
            </p>
            <div className="space-y-2">
              <Label htmlFor="gmail-app">OAuth 应用</Label>
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
                <p className="text-xs text-destructive">
                  当前没有可用的 Gmail OAuth 应用，请先在下方配置环境变量或数据库应用。
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleGmailAuth}
              disabled={isPending || gmailOAuthApps.length === 0}
            >
              {isPending ? "跳转中..." : "使用 Google 账号授权"}
            </Button>
          </TabsContent>

          <TabsContent value="outlook" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              点击下方按钮将跳转到 Microsoft 授权页面，授权后自动返回。首次同步默认抓取最近 200 封，可在账号管理页修改。
            </p>
            <div className="space-y-2">
              <Label htmlFor="outlook-app">OAuth 应用</Label>
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
                <p className="text-xs text-destructive">
                  当前没有可用的 Outlook OAuth 应用，请先在下方配置环境变量或数据库应用。
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleOutlookAuth}
              disabled={isPending || outlookOAuthApps.length === 0}
            >
              {isPending ? "跳转中..." : "使用 Microsoft 账号授权"}
            </Button>
          </TabsContent>

          <TabsContent value="imap-smtp" className="pt-4">
            <form onSubmit={handleAddImapSmtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-key">邮箱类型</Label>
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
                      {MAILBOX_PRESETS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-email">邮箱地址</Label>
                <Input
                  id="imap-email"
                  type="email"
                  placeholder="example@163.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-user">登录用户名（可选）</Label>
                <Input
                  id="auth-user"
                  placeholder="默认使用邮箱地址"
                  value={authUser}
                  onChange={(e) => setAuthUser(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-pass">
                  {selectedPreset.authType === "authcode" ? "授权码" : "密码 / 授权码"}
                </Label>
                <Input
                  id="auth-pass"
                  type="password"
                  placeholder={selectedPreset.authType === "authcode" ? "在邮箱设置中生成授权码" : "输入登录密码或应用专用密码"}
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  required
                />
                {selectedPreset.helpUrl && (
                  <p className="text-xs text-muted-foreground">
                    不知道怎么获取？
                    <a
                      href={selectedPreset.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 underline underline-offset-4"
                    >
                      查看帮助文档
                    </a>
                  </p>
                )}
              </div>

              {isCustom && (
                <div className="grid gap-4 rounded-md border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="imap-host">IMAP 服务器</Label>
                    <Input id="imap-host" value={imapHost} onChange={(e) => setImapHost(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">IMAP 端口</Label>
                      <Input id="imap-port" type="number" value={imapPort} onChange={(e) => setImapPort(e.target.value)} required />
                    </div>
                    <label className="mt-8 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={imapSecure} onChange={(e) => setImapSecure(e.target.checked)} />
                      使用 SSL/TLS
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP 服务器</Label>
                    <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP 端口</Label>
                      <Input id="smtp-port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} required />
                    </div>
                    <label className="mt-8 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
                      使用 SSL/TLS
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imap-name">显示名称 (可选)</Label>
                <Input
                  id="imap-name"
                  placeholder="用于侧边栏显示"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-fetch-limit">首次同步抓取范围</Label>
                <select
                  id="initial-fetch-limit"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={initialFetchLimit}
                  onChange={(event) => setInitialFetchLimit(event.target.value)}
                >
                  <option value="50">50 封</option>
                  <option value="200">200 封</option>
                  <option value="1000">1000 封</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "添加中..." : `添加${selectedPreset.label}`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
