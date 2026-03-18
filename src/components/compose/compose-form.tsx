"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendMailAction } from "@/app/actions/send";
import { formatFileSize } from "@/lib/format";
import { mapSendErrorToMessage } from "@/lib/send-errors";
import { buildComposeHref } from "@/lib/inbox-route";
import { buildComposeSuccessHref, resolveComposeAccountId } from "./compose-state";
import { Paperclip, X } from "lucide-react";

interface SendCapableAccount {
  id: string;
  provider: string;
  email: string;
  displayName: string;
  fromAddress: string;
}

interface UploadedComposeAttachment {
  id?: string;
  filename: string;
  size: number;
  contentType: string;
  isUploading?: boolean;
  error?: string;
}

function splitAddresses(input: string): string[] {
  return input
    .split(/,|\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function ComposeForm({
  accounts,
  initialAccountId,
}: {
  accounts: SendCapableAccount[];
  initialAccountId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const defaultAccountId = resolveComposeAccountId(accounts, initialAccountId);
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [textBody, setTextBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedComposeAttachment[]>([]);
  const [isPending, startTransition] = useTransition();

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId]
  );

  useEffect(() => {
    setSelectedAccountId(defaultAccountId);
  }, [defaultAccountId]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const tempKey = `${file.name}-${file.size}-${Date.now()}`;
      setAttachments((current) => [
        ...current,
        {
          id: tempKey,
          filename: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          isUploading: true,
        },
      ]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/compose-attachments", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "附件上传失败");
        }

        setAttachments((current) =>
          current.map((item) =>
            item.id === tempKey
              ? {
                  id: data.id,
                  filename: data.filename,
                  size: data.size,
                  contentType: data.contentType,
                  isUploading: false,
                }
              : item
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "附件上传失败";
        setAttachments((current) =>
          current.map((item) =>
            item.id === tempKey
              ? {
                  ...item,
                  isUploading: false,
                  error: message,
                }
              : item
          )
        );
        toast({ title: "附件上传失败", description: message, variant: "error" });
      }
    }
  }

  function removeAttachment(id?: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  function handleAccountChange(nextAccountId: string) {
    setSelectedAccountId(nextAccountId);
    router.replace(buildComposeHref(nextAccountId), { scroll: false });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedAccount) {
      toast({ title: "没有可用发件账号", variant: "error" });
      return;
    }

    if (attachments.some((attachment) => attachment.isUploading)) {
      toast({ title: "还有附件在上传中", description: "请等待附件上传完成后再发送。", variant: "error" });
      return;
    }

    startTransition(async () => {
      const result = await sendMailAction({
        accountId: selectedAccount.id,
        from: selectedAccount.fromAddress,
        to: splitAddresses(to),
        cc: splitAddresses(cc),
        bcc: splitAddresses(bcc),
        subject,
        textBody,
        htmlBody: null,
        attachmentIds: attachments.filter((item) => item.id && !item.error).map((item) => item.id!),
      });

      if (!result.ok) {
        toast({
          title: "发送失败",
          description: mapSendErrorToMessage(result.errorCode, result.errorMessage),
          variant: "error",
        });
        return;
      }

      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setTextBody("");
      setAttachments([]);

      toast({ title: "发送成功", description: "邮件已交给服务端发送，并写入本地已发送记录。" });
      router.push(buildComposeSuccessHref(result.localMessageId, selectedAccount.id));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">写邮件</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          当前支持 Gmail / Outlook 以及国内邮箱 IMAP/SMTP 发信；QQ、163、126、Yeah 等使用授权码或密码通过 SMTP 发送。
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border p-4">
        <div className="grid gap-2">
          <Label htmlFor="compose-from">发件人</Label>
          <select
            id="compose-from"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={selectedAccountId}
            onChange={(event) => handleAccountChange(event.target.value)}
            disabled={isPending}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName} · {account.email} · {account.provider}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="compose-to">To</Label>
          <Input
            id="compose-to"
            placeholder="alice@example.com, bob@example.com"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => setShowCcBcc((current) => !current)}
          >
            {showCcBcc ? "收起 Cc / Bcc" : "展开 Cc / Bcc"}
          </button>
        </div>

        {showCcBcc && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="compose-cc">Cc</Label>
              <Input
                id="compose-cc"
                placeholder="抄送地址，逗号分隔"
                value={cc}
                onChange={(event) => setCc(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="compose-bcc">Bcc</Label>
              <Input
                id="compose-bcc"
                placeholder="密送地址，逗号分隔"
                value={bcc}
                onChange={(event) => setBcc(event.target.value)}
                disabled={isPending}
              />
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="compose-subject">主题</Label>
          <Input
            id="compose-subject"
            placeholder="输入主题"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="compose-body">正文</Label>
          <Textarea
            id="compose-body"
            placeholder="一期先支持纯文本正文"
            className="min-h-64"
            value={textBody}
            onChange={(event) => setTextBody(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="compose-attachments">附件</Label>
          <Input
            id="compose-attachments"
            type="file"
            multiple
            onChange={(event) => uploadFiles(event.target.files)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            当前版本单个附件需小于 3 MB，以兼容 Outlook 直发接口。
          </p>
          {attachments.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              {attachments.map((attachment) => (
                <div key={`${attachment.id}-${attachment.filename}`} className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{attachment.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                      {attachment.isUploading && " · 上传中..."}
                      {attachment.error && ` · ${attachment.error}`}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(attachment.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          取消
        </Button>
        <Button type="submit" disabled={isPending || !selectedAccount}>
          {isPending ? "发送中..." : "发送邮件"}
        </Button>
      </div>
    </form>
  );
}
