"use client";

import { useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Paperclip, Download, X } from "lucide-react";
import { markRead, toggleStar } from "@/actions/email";
import type { Email, Attachment } from "@/lib/db/schema";
import { formatRelativeTime, formatFileSize } from "@/lib/format";

interface MailDetailProps {
  email: Email;
  attachments: Attachment[];
  onClose?: () => void;
  onMarkedRead?: (emailId: string) => void;
  onToggledStar?: (emailId: string) => void;
}

export function MailDetail({
  email,
  attachments,
  onClose,
  onMarkedRead,
  onToggledStar,
}: MailDetailProps) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!email.isRead) {
      startTransition(async () => {
        await markRead(email.id);
        onMarkedRead?.(email.id);
      });
    }
  }, [email.id, email.isRead, onMarkedRead]);

  function handleStar() {
    startTransition(async () => {
      await toggleStar(email.id);
      onToggledStar?.(email.id);
    });
  }

  let recipients: string[] = [];
  if (email.recipients) {
    try {
      const parsed = JSON.parse(email.recipients);
      recipients = Array.isArray(parsed) ? parsed : [];
    } catch {
      recipients = [];
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="flex-1 truncate text-lg font-semibold">
          {email.subject || "(无主题)"}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleStar}>
          <Star
            className={`h-4 w-4 ${
              email.isStarred ? "fill-yellow-400 text-yellow-400" : ""
            }`}
          />
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{email.sender}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {email.receivedAt ? formatRelativeTime(email.receivedAt) : ""}
          </span>
        </div>
        {recipients.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            收件人: {recipients.join(", ")}
          </p>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        {email.bodyHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{email.bodyText}</pre>
        )}
      </ScrollArea>

      {attachments.length > 0 && (
        <>
          <Separator />
          <div className="p-3">
            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {attachments.length} 个附件
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/attachments/${encodeURIComponent(att.id)}`}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Download className="h-3 w-3 shrink-0" />
                  <span className="max-w-[200px] truncate">
                    {att.filename}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(att.size ?? 0)}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
