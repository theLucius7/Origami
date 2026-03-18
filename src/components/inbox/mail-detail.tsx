"use client";

import { useEffect, useState } from "react";
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
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MinusCircle,
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
import { parseStoredStringList } from "@/lib/string-list";
import { SnoozeDialog } from "./snooze-dialog";
import { shouldPollMailDetailStatus } from "./mail-detail-state";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";

interface MailDetailProps {
  email: Email;
  attachments: Attachment[];
  isHydrating?: boolean;
  onClose?: () => void;
  onLocalUpdate?: (emailId: string, patch: Partial<Email>) => void;
}

function renderWriteBackStatus(label: string, status: string | null | undefined, error?: string | null) {
  switch (status) {
    case "pending":
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>{label}写回中…</span>
        </div>
      );
    case "success":
      return (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle className="h-3 w-3" />
          <span>{label}已写回远端</span>
        </div>
      );
    case "skipped":
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MinusCircle className="h-3 w-3" />
          <span>{label}已跳过{error ? `：${error}` : ""}</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>{label}写回失败{error ? `：${error}` : ""}</span>
        </div>
      );
    default:
      return null;
  }
}

export function MailDetail({
  email,
  attachments,
  isHydrating = false,
  onClose,
  onLocalUpdate,
}: MailDetailProps) {
  const router = useRouter();
  const { isPending, run } = useClientAction();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [nowTs] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!email.isRead) {
      void run({
        action: () => markRead(email.id),
        refresh: true,
        onSuccess: () => {
          onLocalUpdate?.(email.id, { isRead: 1 });
        },
        errorToast: (error) => ({
          title: "标记已读失败",
          description: getClientActionErrorMessage(error),
          variant: "error",
        }),
      });
    }
  }, [email.id, email.isRead, onLocalUpdate, run]);

  function handleStar() {
    void run({
      action: () => toggleStar(email.id),
      refresh: true,
      onSuccess: () => {
        onLocalUpdate?.(email.id, { isStarred: email.isStarred ? 0 : 1 });
      },
      errorToast: (error) => ({
        title: "更新星标失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function handleDoneToggle() {
    void run({
      action: () => markDone([email.id], email.localDone !== 1),
      refresh: true,
      onSuccess: () => {
        onLocalUpdate?.(email.id, { localDone: email.localDone === 1 ? 0 : 1 });
      },
      errorToast: (error) => ({
        title: "更新 Done 状态失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function handleArchiveToggle() {
    const nextValue = email.localArchived !== 1;

    void run({
      action: () => markArchived([email.id], nextValue),
      refresh: true,
      onSuccess: () => {
        onLocalUpdate?.(email.id, { localArchived: nextValue ? 1 : 0 });
      },
      errorToast: (error) => ({
        title: nextValue ? "归档失败" : "移回主视图失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  function handleClearSnooze() {
    void run({
      action: () => clearSnooze([email.id]),
      refresh: true,
      onSuccess: () => {
        onLocalUpdate?.(email.id, { localSnoozeUntil: null });
      },
      errorToast: (error) => ({
        title: "清除稍后看失败",
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  const recipients = parseStoredStringList(email.recipients);

  const isSnoozed = !!email.localSnoozeUntil && email.localSnoozeUntil > nowTs;
  const hydrationStatus = isHydrating ? "hydrating" : email.hydrationStatus;
  const shouldPollStatus = shouldPollMailDetailStatus(email, isHydrating);

  useEffect(() => {
    if (!shouldPollStatus) return;

    const timer = window.setTimeout(() => {
      router.refresh();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [router, shouldPollStatus]);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h2 className="flex-1 truncate text-lg font-semibold">
            {email.subject || "(无主题)"}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleStar} disabled={isPending}>
            <Star
              className={`h-4 w-4 ${
                email.isStarred ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isPending}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="border-b px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <Button variant={email.localDone ? "secondary" : "outline"} size="sm" onClick={handleDoneToggle} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {email.localDone ? "取消 Done" : "Done"}
            </Button>
            <Button variant={email.localArchived ? "secondary" : "outline"} size="sm" onClick={handleArchiveToggle} disabled={isPending}>
              <Archive className="h-4 w-4" />
              {email.localArchived ? "移回主视图" : "归档"}
            </Button>
            {isSnoozed ? (
              <Button variant="outline" size="sm" onClick={handleClearSnooze} disabled={isPending}>
                <Clock3 className="h-4 w-4" />
                清除稍后看
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSnoozeOpen(true)} disabled={isPending}>
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
            {hydrationStatus === "metadata" && <Badge variant="outline">仅元数据</Badge>}
            {hydrationStatus === "hydrating" && <Badge variant="outline">正文拉取中</Badge>}
            {hydrationStatus === "hydrated" && <Badge variant="outline">正文已缓存</Badge>}
            {hydrationStatus === "failed" && <Badge variant="destructive">正文拉取失败</Badge>}
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
          <div className="mt-2 space-y-1">
            {renderWriteBackStatus("已读", email.readWriteBackStatus, email.readWriteBackError)}
            {renderWriteBackStatus("星标", email.starWriteBackStatus, email.starWriteBackError)}
            {hydrationStatus === "failed" && email.hydrationError && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>正文拉取失败：{email.hydrationError}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 p-4">
          {hydrationStatus === "hydrating" ? (
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
          ) : hydrationStatus === "hydrated" ? (
            <div className="text-sm text-muted-foreground">
              这封邮件已经成功补拉，但远端没有可显示的正文内容。
            </div>
          ) : hydrationStatus === "failed" ? (
            <div className="text-sm text-muted-foreground">
              正文拉取失败了，你稍后可以重新打开这封邮件再试一次。
            </div>
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
          await run({
            action: () => snooze([email.id], value),
            refresh: true,
            onSuccess: () => {
              onLocalUpdate?.(email.id, {
                localSnoozeUntil: Math.floor(new Date(value).getTime() / 1000),
              });
            },
            errorToast: (error) => ({
              title: "设置稍后看失败",
              description: getClientActionErrorMessage(error),
              variant: "error",
            }),
          });
        }}
      />
    </>
  );
}
