import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatFileSize, formatRelativeTime } from "@/lib/format";
import type { Account, SentMessage, SentMessageAttachment } from "@/lib/db/schema";
import { Download, Paperclip } from "lucide-react";

function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SentDetail({
  message,
  account,
  attachments,
}: {
  message: SentMessage;
  account: Account | null;
  attachments: SentMessageAttachment[];
}) {
  const toRecipients = parseJsonList(message.toRecipients);
  const ccRecipients = parseJsonList(message.ccRecipients);
  const bccRecipients = parseJsonList(message.bccRecipients);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{message.subject || "(无主题)"}</h1>
        <Badge variant="secondary">已发送</Badge>
        {account && <Badge variant="outline">{account.provider}</Badge>}
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div>
          <span className="font-medium">From：</span>
          <span>{message.fromAddress}</span>
        </div>
        <div>
          <span className="font-medium">To：</span>
          <span>{toRecipients.join(", ") || "-"}</span>
        </div>
        {ccRecipients.length > 0 && (
          <div>
            <span className="font-medium">Cc：</span>
            <span>{ccRecipients.join(", ")}</span>
          </div>
        )}
        {bccRecipients.length > 0 && (
          <div>
            <span className="font-medium">Bcc：</span>
            <span>{bccRecipients.join(", ")}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          发送时间：{message.sentAt ? formatRelativeTime(message.sentAt) : "刚刚"}
        </div>
      </div>

      <Separator className="my-4" />

      <div className="min-h-64 rounded-lg border p-4 text-sm">
        {message.bodyHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
          />
        ) : message.bodyText ? (
          <pre className="whitespace-pre-wrap">{message.bodyText}</pre>
        ) : (
          <div className="text-muted-foreground">没有正文内容。</div>
        )}
      </div>

      {attachments.length > 0 && (
        <>
          <Separator className="my-4" />
          <div>
            <div className="mb-3 flex items-center gap-1 text-sm font-medium">
              <Paperclip className="h-4 w-4" />
              附件 ({attachments.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={`/api/attachments/${encodeURIComponent(attachment.id)}`}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Download className="h-4 w-4" />
                  <span className="max-w-[220px] truncate">{attachment.filename}</span>
                  <Badge variant="outline">{formatFileSize(attachment.size ?? 0)}</Badge>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
