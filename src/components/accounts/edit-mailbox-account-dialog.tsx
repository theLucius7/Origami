"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateMailboxAccount } from "@/app/actions/account";
import type { AccountSettingsView } from "@/components/accounts/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAILBOX_PRESET_KEYS,
  MAILBOX_PRESETS,
} from "@/lib/providers/imap-smtp/presets";

function getInitialPresetKey(account: AccountSettingsView) {
  if (account.provider === "qq") return "qq";
  return account.presetKey && account.presetKey in MAILBOX_PRESETS
    ? account.presetKey
    : "custom";
}

export function EditMailboxAccountDialog({ account }: { account: AccountSettingsView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(account.displayName ?? account.email);
  const [authUser, setAuthUser] = useState(account.authUser ?? account.email);
  const [authPass, setAuthPass] = useState("");
  const [presetKey, setPresetKey] = useState(getInitialPresetKey(account));
  const [imapHost, setImapHost] = useState(account.imapHost ?? "");
  const [imapPort, setImapPort] = useState(String(account.imapPort ?? 993));
  const [imapSecure, setImapSecure] = useState(Boolean(account.imapSecure));
  const [smtpHost, setSmtpHost] = useState(account.smtpHost ?? "");
  const [smtpPort, setSmtpPort] = useState(String(account.smtpPort ?? 465));
  const [smtpSecure, setSmtpSecure] = useState(Boolean(account.smtpSecure));
  const [isPending, startTransition] = useTransition();

  const canChangePreset = account.provider === "imap_smtp";
  const selectedPreset = useMemo(() => MAILBOX_PRESETS[presetKey], [presetKey]);
  const isCustom = presetKey === "custom";

  function resetForm() {
    setDisplayName(account.displayName ?? account.email);
    setAuthUser(account.authUser ?? account.email);
    setAuthPass("");
    const nextPresetKey = getInitialPresetKey(account);
    setPresetKey(nextPresetKey);
    setImapHost(account.imapHost ?? MAILBOX_PRESETS[nextPresetKey].imapHost ?? "");
    setImapPort(String(account.imapPort ?? MAILBOX_PRESETS[nextPresetKey].imapPort ?? 993));
    setImapSecure(Boolean(account.imapSecure));
    setSmtpHost(account.smtpHost ?? MAILBOX_PRESETS[nextPresetKey].smtpHost ?? "");
    setSmtpPort(String(account.smtpPort ?? MAILBOX_PRESETS[nextPresetKey].smtpPort ?? 465));
    setSmtpSecure(Boolean(account.smtpSecure));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetForm();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateMailboxAccount({
        id: account.id,
        displayName,
        authUser: authUser || account.email,
        authPass: authPass || undefined,
        presetKey,
        imapHost: canChangePreset && isCustom ? imapHost : undefined,
        imapPort: canChangePreset && isCustom ? Number(imapPort) : undefined,
        imapSecure: canChangePreset && isCustom ? imapSecure : undefined,
        smtpHost: canChangePreset && isCustom ? smtpHost : undefined,
        smtpPort: canChangePreset && isCustom ? Number(smtpPort) : undefined,
        smtpSecure: canChangePreset && isCustom ? smtpSecure : undefined,
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        编辑
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑邮箱账号</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`display-name-${account.id}`}>显示名称</Label>
            <Input
              id={`display-name-${account.id}`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="用于侧边栏显示"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`preset-key-${account.id}`}>邮箱类型</Label>
            <select
              id={`preset-key-${account.id}`}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={presetKey}
              disabled={!canChangePreset || isPending}
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
            {!canChangePreset && (
              <p className="text-xs text-muted-foreground">
                旧版 QQ 账号保留兼容模式；这里先只允许更新显示名和授权码。
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`auth-user-${account.id}`}>登录用户名</Label>
            <Input
              id={`auth-user-${account.id}`}
              value={authUser}
              onChange={(event) => setAuthUser(event.target.value)}
              placeholder="默认使用邮箱地址"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`auth-pass-${account.id}`}>
              {selectedPreset.authType === "authcode" ? "授权码" : "密码 / 授权码"}
            </Label>
            <Input
              id={`auth-pass-${account.id}`}
              type="password"
              value={authPass}
              onChange={(event) => setAuthPass(event.target.value)}
              placeholder="留空则保持当前凭据不变"
            />
            {selectedPreset.helpUrl && (
              <p className="text-xs text-muted-foreground">
                需要重新获取？
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

          {canChangePreset && isCustom && (
            <div className="grid gap-4 rounded-md border p-3">
              <div className="space-y-2">
                <Label htmlFor={`imap-host-${account.id}`}>IMAP 服务器</Label>
                <Input
                  id={`imap-host-${account.id}`}
                  value={imapHost}
                  onChange={(event) => setImapHost(event.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`imap-port-${account.id}`}>IMAP 端口</Label>
                  <Input
                    id={`imap-port-${account.id}`}
                    type="number"
                    value={imapPort}
                    onChange={(event) => setImapPort(event.target.value)}
                    required
                  />
                </div>
                <label className="mt-8 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={imapSecure}
                    onChange={(event) => setImapSecure(event.target.checked)}
                  />
                  使用 SSL/TLS
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`smtp-host-${account.id}`}>SMTP 服务器</Label>
                <Input
                  id={`smtp-host-${account.id}`}
                  value={smtpHost}
                  onChange={(event) => setSmtpHost(event.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`smtp-port-${account.id}`}>SMTP 端口</Label>
                  <Input
                    id={`smtp-port-${account.id}`}
                    type="number"
                    value={smtpPort}
                    onChange={(event) => setSmtpPort(event.target.value)}
                    required
                  />
                </div>
                <label className="mt-8 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(event) => setSmtpSecure(event.target.checked)}
                  />
                  使用 SSL/TLS
                </label>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "保存中..." : "保存账号设置"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
