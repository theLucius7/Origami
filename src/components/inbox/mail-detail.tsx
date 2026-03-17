"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Paperclip,
  Download,
  X,
  CheckCircle2,
  Archive,
  Clock3,
} from "lucide-react";
import {
  clearSnooze,
  markArchived,
  markDone,
  markRead,
  snooze,
  toggleStar,
} from "@/app/actions/email";
import type { Email, Attachment } from "@/lib/db/schema";
import { formatRelativeTime, formatFileSize } from "@/lib/format";
import { SnoozeDialog } from "./snooze-dialog";

interface MailDetailProps {
  email: Email;
  attachments: Attachment[];
  isHydrating?: boolean;
  onClose?: () => void;
  onLocalUpdate?: (emailId: string, patch: Partial<Email>) => void;
}

export function MailDetail({
  email,
  attachments,
  isHydrating = false,
  onClose,
  onLocalUpdate,
}: MailDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [nowTs] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!email.isRead) {
      startTransition(async () => {
        await markRead(email.id);
        onLocalUpdate?.(email.id, { isRead: 1 });
        router.refresh();
      });
    }
  }, [email.id, email.isRead, onLocalUpdate, router]);

  function handleStar() {
    startTransition(async () => {
      await toggleStar(email.id);
      onLocalUpdate?.(email.id, { isStarred: email.isStarred ? 0 : 1 });
      router.refresh();
    });
  }

  function handleDoneToggle() {
    startTransition(async () => {
      await markDone([email.id], email.localDone !== 1);
      onLocalUpdate?.(email.id, { localDone: email.localDone === 1 ? 0 : 1 });
      router.refresh();
    });
  }

  function handleArchiveToggle() {
    startTransition(async () => {
      const nextValue = email.localArchived !== 1;
      await markArchived([email.id], nextValue);
      onLocalUpdate?.(email.id, { localArchived: nextValue ? 1 : 0 });
      router.refresh();
    });
  }

  function handleClearSnooze() {
    startTransition(async () => {
      await clearSnooze([email.id]);
      onLocalUpdate?.(email.id, { localSnoozeUntil: null });
      router.refresh();
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

  const isSnoozed = !!email.localSnoozeUntil && email.localSnoozeUntil > nowTs;

  return (
    <>
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

        <div className="border-b px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <Button variant={email.localDone ? "secondary" : "outline"} size="sm" onClick={handleDoneToggle}>
              <CheckCircle2 className="h-4 w-4" />
              {email.localDone ? "取消 Done" : "Done"}
            </Button>
            <Button variant={email.localArchived ? "secondary" : "outline"} size="sm" onClick={handleArchiveToggle}>
              <Archive className="h-4 w-4" />
              {email.localArchived ? "移回主视图" : "归档"}
            </Button>
            {isSnoozed ? (
              <Button variant="outline" size="sm" onClick={handleClearSnooze}>
                <Clock3 className="h-4 w-4" />
                清除稍后看
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSnoozeOpen(true)}>
                <Clock3 className="h-4 w-4" />
                稍后看
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Done / 归档 / 稍后看 仅在 Origami 本地生效，不会写回 Gmail / Outlook / IMAP/SMTP 邮箱。
          </p>
        </div>

        <div className="px-4 py-3 text-sm">
          <div className="mb-2 flex flex-wrap gap-1">
            {email.localDone === 1 && <Badge variant="secondary">Done</Badge>}
            {email.localArchived === 1 && <Badge variant="secondary">已归档</Badge>}
            {isSnoozed && <Badge variant="secondary">稍后看中</Badge>}
          </div>
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
          {isHydrating ? (
            <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground">
              正在按需拉取正文与附件…
            </div>
          ) : email.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : email.bodyText ? (
            <pre className="whitespace-pre-wrap text-sm">{email.bodyText}</pre>
          ) : (
            <div className="text-sm text-muted-foreground">
              这封邮件当前仅缓存了标题与摘要，点击时会按需补拉正文。
            </div>
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

      <SnoozeDialog
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        onConfirm={async (value) => {
          await snooze([email.id], value);
          onLocalUpdate?.(email.id, {
            localSnoozeUntil: Math.floor(new Date(value).getTime() / 1000),
          });
          router.refresh();
        }}
      />
    </>
  );
}
