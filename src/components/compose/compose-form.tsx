"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getClientActionErrorMessage } from "@/hooks/use-client-action";
import { sendMailAction } from "@/app/actions/send";
import { formatFileSize } from "@/lib/format";
import { mapSendErrorToMessage } from "@/lib/send-errors";
import { buildComposeHref } from "@/lib/inbox-route";
import { buildComposeSuccessHref, resolveComposeAccountId } from "./compose-state";
import { Paperclip, X } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

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
  const { locale, messages } = useI18n();
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
          throw new Error(data.error || messages.compose.attachmentUploadFailed);
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
        const message = error instanceof Error ? error.message : messages.compose.attachmentUploadFailed;
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
        toast({ title: messages.compose.attachmentUploadFailed, description: message, variant: "error" });
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
      toast({ title: messages.compose.noAccount, variant: "error" });
      return;
    }

    if (attachments.some((attachment) => attachment.isUploading)) {
      toast({
        title: messages.compose.pendingAttachmentsTitle,
        description: messages.compose.pendingAttachmentsDescription,
        variant: "error",
      });
      return;
    }

    startTransition(async () => {
      try {
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
            title: messages.compose.sendFailed,
            description: mapSendErrorToMessage({
              locale,
              errorCode: result.errorCode,
              errorKey: result.errorKey,
              errorMessage: result.errorMessage,
              errorDetails: result.errorDetails,
            }),
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

        toast({ title: messages.compose.sendSuccess, description: messages.compose.sendSuccessDescription });
        router.push(buildComposeSuccessHref(result.localMessageId, selectedAccount.id));
        router.refresh();
      } catch (error) {
        toast({
          title: messages.compose.sendFailed,
          description: getClientActionErrorMessage(error, undefined, locale),
          variant: "error",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6">
      <div className="rounded-[2rem] border border-border/80 bg-background/70 p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">{messages.compose.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{messages.compose.description}</p>
      </div>

      <div className="grid gap-5 rounded-[2rem] border border-border/80 bg-background/72 p-6 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="compose-from">{messages.compose.from}</Label>
          <select
            id="compose-from"
            className="rounded-2xl border bg-background px-3 py-2.5 text-sm"
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
          <Label htmlFor="compose-to">{messages.compose.to}</Label>
          <Input
            id="compose-to"
            placeholder={messages.compose.toPlaceholder}
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
            {showCcBcc ? messages.compose.hideCcBcc : messages.compose.showCcBcc}
          </button>
        </div>

        {showCcBcc && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="compose-cc">{messages.compose.cc}</Label>
              <Input
                id="compose-cc"
                placeholder={messages.compose.ccPlaceholder}
                value={cc}
                onChange={(event) => setCc(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="compose-bcc">{messages.compose.bcc}</Label>
              <Input
                id="compose-bcc"
                placeholder={messages.compose.bccPlaceholder}
                value={bcc}
                onChange={(event) => setBcc(event.target.value)}
                disabled={isPending}
              />
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="compose-subject">{messages.compose.subject}</Label>
          <Input
            id="compose-subject"
            placeholder={messages.compose.subjectPlaceholder}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="compose-body">{messages.compose.body}</Label>
          <Textarea
            id="compose-body"
            placeholder={messages.compose.bodyPlaceholder}
            className="min-h-72 rounded-2xl"
            value={textBody}
            onChange={(event) => setTextBody(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="compose-attachments">{messages.compose.attachments}</Label>
          <Input
            id="compose-attachments"
            type="file"
            multiple
            onChange={(event) => uploadFiles(event.target.files)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">{messages.compose.attachmentLimit}</p>
          {attachments.length > 0 && (
            <div className="space-y-2 rounded-2xl border p-4">
              {attachments.map((attachment) => (
                <div key={`${attachment.id}-${attachment.filename}`} className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{attachment.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                      {attachment.isUploading && ` · ${messages.compose.uploading}`}
                      {attachment.error && ` · ${attachment.error}`}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label={messages.compose.removeAttachmentAria(attachment.filename)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">{messages.compose.removeAttachmentAria(attachment.filename)}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          {messages.compose.cancel}
        </Button>
        <Button type="submit" disabled={isPending || !selectedAccount}>
          {isPending ? messages.compose.sending : messages.compose.send}
        </Button>
      </div>
    </form>
  );
}
