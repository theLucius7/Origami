import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatFileSize, formatRelativeTime } from "@/lib/format";
import { sanitizeEmailHtml } from "@/lib/email-html";
import { parseStoredStringList } from "@/lib/string-list";
import type { Account, SentMessage, SentMessageAttachment } from "@/lib/db/schema";
import { Download, Paperclip } from "lucide-react";
import type { AppLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getProviderMeta } from "@/config/providers";
import { AttachmentDownloadButton } from "@/components/attachments/attachment-download-button";

export function SentDetail({
  message,
  account,
  attachments,
  locale,
}: {
  message: SentMessage;
  account: Account | null;
  attachments: SentMessageAttachment[];
  locale: AppLocale;
}) {
  const t = getMessages(locale);
  const toRecipients = parseStoredStringList(message.toRecipients);
  const ccRecipients = parseStoredStringList(message.ccRecipients);
  const bccRecipients = parseStoredStringList(message.bccRecipients);
  const safeBodyHtml = message.bodyHtml ? sanitizeEmailHtml(message.bodyHtml) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col p-6">
      <div className="rounded-[2rem] border border-border/80 bg-background/72 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{message.subject || t.common.untitled}</h1>
          <Badge variant="secondary">{t.sent.badge}</Badge>
          {account && <Badge variant="outline">{getProviderMeta(account.provider, locale).label}</Badge>}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="font-medium">{t.sent.from}: </span>
            <span>{message.fromAddress}</span>
          </div>
          <div>
            <span className="font-medium">{t.sent.to}: </span>
            <span>{toRecipients.join(", ") || "-"}</span>
          </div>
          {ccRecipients.length > 0 && (
            <div>
              <span className="font-medium">{t.sent.cc}: </span>
              <span>{ccRecipients.join(", ")}</span>
            </div>
          )}
          {bccRecipients.length > 0 && (
            <div>
              <span className="font-medium">{t.sent.bcc}: </span>
              <span>{bccRecipients.join(", ")}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {t.sent.sentTime}: {message.sentAt ? formatRelativeTime(message.sentAt, locale) : ""}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="min-h-64 rounded-[2rem] border border-border/80 bg-background/72 p-5 text-sm shadow-sm">
        {safeBodyHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
          />
        ) : message.bodyText ? (
          <pre className="whitespace-pre-wrap">{message.bodyText}</pre>
        ) : (
          <div className="text-muted-foreground">{t.sent.noBody}</div>
        )}
      </div>

      {attachments.length > 0 && (
        <>
          <Separator className="my-4" />
          <div>
            <div className="mb-3 flex items-center gap-1 text-sm font-medium">
              <Paperclip className="h-4 w-4" />
              {t.sent.attachments(attachments.length)}
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <AttachmentDownloadButton
                  key={attachment.id}
                  attachmentId={attachment.id}
                  filename={attachment.filename ?? "attachment"}
                  className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  <span className="max-w-[220px] truncate">{attachment.filename}</span>
                  <Badge variant="outline">{formatFileSize(attachment.size ?? 0)}</Badge>
                </AttachmentDownloadButton>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
