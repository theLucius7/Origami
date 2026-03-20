"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { sanitizeEmailHtml } from "@/lib/email-html";
import { parseStoredStringList } from "@/lib/string-list";
import { getSafeRuntimeErrorMessage } from "@/lib/runtime-errors";
import { AttachmentDownloadButton } from "@/components/attachments/attachment-download-button";
import { SnoozeDialog } from "./snooze-dialog";
import { shouldPollMailDetailStatus } from "./mail-detail-state";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import { useI18n } from "@/components/providers/i18n-provider";

interface MailDetailProps {
  email: Email;
  attachments: Attachment[];
  isHydrating?: boolean;
  onClose?: () => void;
  onLocalUpdate?: (emailId: string, patch: Partial<Email>) => void;
}

function renderWriteBackStatus(
  label: string,
  status: string | null | undefined,
  error: string | null | undefined,
  locale: ReturnType<typeof useI18n>["locale"],
  messages: ReturnType<typeof useI18n>["messages"]
) {
  const description = getSafeRuntimeErrorMessage({ locale, error, fallback: null });

  switch (status) {
    case "pending":
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>{messages.mailDetail.writeBackPending(label)}</span>
        </div>
      );
    case "success":
      return (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle className="h-3 w-3" />
          <span>{messages.mailDetail.writeBackSuccess(label)}</span>
        </div>
      );
    case "skipped":
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MinusCircle className="h-3 w-3" />
          <span>{messages.mailDetail.writeBackSkipped(label, description)}</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>{messages.mailDetail.writeBackFailed(label, description)}</span>
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
  const { locale, messages } = useI18n();
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
          title: messages.mailDetail.markReadError,
          description: getClientActionErrorMessage(error),
          variant: "error",
        }),
      });
    }
  }, [email.id, email.isRead, messages.mailDetail.markReadError, onLocalUpdate, run]);

  function handleStar() {
    void run({
      action: () => toggleStar(email.id),
      refresh: true,
      onSuccess: () => {
        onLocalUpdate?.(email.id, { isStarred: email.isStarred ? 0 : 1 });
      },
      errorToast: (error) => ({
        title: messages.mailDetail.updateStarError,
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
        title: messages.mailDetail.updateDoneError,
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
        title: nextValue ? messages.mailDetail.archiveError : messages.mailDetail.restoreError,
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
        title: messages.mailDetail.clearSnoozeError,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  const recipients = parseStoredStringList(email.recipients);
  const safeBodyHtml = useMemo(() => {
    return email.bodyHtml ? sanitizeEmailHtml(email.bodyHtml) : null;
  }, [email.bodyHtml]);

  const isSnoozed = !!email.localSnoozeUntil && email.localSnoozeUntil > nowTs;
  const hydrationStatus = isHydrating ? "hydrating" : email.hydrationStatus;
  const shouldPollStatus = shouldPollMailDetailStatus(email, isHydrating);
  const hasStatusInfo = Boolean(
    email.readWriteBackStatus ||
      email.starWriteBackStatus ||
      (hydrationStatus === "failed" && email.hydrationError)
  );

  useEffect(() => {
    if (!shouldPollStatus) return;

    const timer = window.setTimeout(() => {
      router.refresh();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [router, shouldPollStatus]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <div className="border-b border-border/60 bg-background/90 px-5 py-5 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                {email.localDone === 1 && <Badge variant="secondary" className="rounded-full">{messages.mailDetail.done}</Badge>}
                {email.localArchived === 1 && <Badge variant="secondary" className="rounded-full">{messages.mailDetail.archivedBadge}</Badge>}
                {isSnoozed && <Badge variant="secondary" className="rounded-full">{messages.mailDetail.snoozedBadge}</Badge>}
                {hydrationStatus === "metadata" && <Badge variant="outline" className="rounded-full">{messages.mailDetail.metadataOnly}</Badge>}
                {hydrationStatus === "hydrating" && <Badge variant="outline" className="rounded-full">{messages.mailDetail.hydrating}</Badge>}
                {hydrationStatus === "hydrated" && <Badge variant="outline" className="rounded-full">{messages.mailDetail.hydrated}</Badge>}
                {hydrationStatus === "failed" && <Badge variant="destructive" className="rounded-full">{messages.mailDetail.hydrationFailed}</Badge>}
              </div>

              <h2 className="truncate text-2xl font-semibold tracking-tight">
                {email.subject || messages.common.untitled}
              </h2>

              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">{email.sender}</div>
                  {recipients.length > 0 && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {messages.mailDetail.recipients}: {recipients.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {email.receivedAt ? formatRelativeTime(email.receivedAt, locale) : ""}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleStar}
                disabled={isPending}
                aria-label={messages.mailDetail.starWriteBackLabel}
              >
                <Star className={`h-4 w-4 ${email.isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={onClose}
                  disabled={isPending}
                  aria-label={messages.common.back}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{messages.common.back}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant={email.localDone ? "secondary" : "outline"} size="sm" className="rounded-full" onClick={handleDoneToggle} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {email.localDone ? messages.mailDetail.cancelDone : messages.mailDetail.done}
            </Button>
            <Button variant={email.localArchived ? "secondary" : "outline"} size="sm" className="rounded-full" onClick={handleArchiveToggle} disabled={isPending}>
              <Archive className="h-4 w-4" />
              {email.localArchived ? messages.mailDetail.restoreToMainView : messages.mailDetail.archive}
            </Button>
            {isSnoozed ? (
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleClearSnooze} disabled={isPending}>
                <Clock3 className="h-4 w-4" />
                {messages.mailDetail.clearSnooze}
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSnoozeOpen(true)} disabled={isPending}>
                <Clock3 className="h-4 w-4" />
                {messages.mailDetail.snooze}
              </Button>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{messages.mailDetail.localNote}</p>

          {hasStatusInfo && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="space-y-1">
                {renderWriteBackStatus(messages.mailDetail.readWriteBackLabel, email.readWriteBackStatus, email.readWriteBackError, locale, messages)}
                {renderWriteBackStatus(messages.mailDetail.starWriteBackLabel, email.starWriteBackStatus, email.starWriteBackError, locale, messages)}
                {hydrationStatus === "failed" && email.hydrationError && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{messages.mailDetail.hydrationFailedDetail(
                      getSafeRuntimeErrorMessage({
                        locale,
                        error: email.hydrationError,
                        fallback: messages.common.actionFailed,
                      }) ?? messages.common.actionFailed
                    )}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1 bg-muted/20">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-5 md:p-6">
            <div className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm md:p-6">
              {hydrationStatus === "hydrating" ? (
                <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                  {messages.mailDetail.bodyLoading}
                </div>
              ) : safeBodyHtml ? (
                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeBodyHtml }} />
              ) : email.bodyText ? (
                <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">{email.bodyText}</pre>
              ) : hydrationStatus === "hydrated" ? (
                <div className="text-sm text-muted-foreground">{messages.mailDetail.hydratedNoBody}</div>
              ) : hydrationStatus === "failed" ? (
                <div className="text-sm text-muted-foreground">{messages.mailDetail.hydrationFailedNoBody}</div>
              ) : (
                <div className="text-sm text-muted-foreground">{messages.mailDetail.metadataNoBody}</div>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="rounded-[24px] border border-border/60 bg-background p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  {messages.mailDetail.attachments(attachments.length)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <AttachmentDownloadButton
                      key={att.id}
                      attachmentId={att.id}
                      filename={att.filename ?? "attachment"}
                      className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="h-3 w-3 shrink-0" />
                      <span className="max-w-[200px] truncate">{att.filename}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(att.size ?? 0)}
                      </Badge>
                    </AttachmentDownloadButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <SnoozeDialog
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        onConfirm={async (value) => {
          let succeeded = false;

          await run({
            action: () => snooze([email.id], value),
            refresh: true,
            onSuccess: () => {
              succeeded = true;
              onLocalUpdate?.(email.id, {
                localSnoozeUntil: Math.floor(new Date(value).getTime() / 1000),
              });
            },
            errorToast: (error) => ({
              title: messages.mailDetail.setSnoozeError,
              description: getClientActionErrorMessage(error),
              variant: "error",
            }),
          });

          return succeeded;
        }}
      />
    </>
  );
}
