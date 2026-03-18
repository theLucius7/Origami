"use client";

import { useMemo, useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MailList } from "./mail-list";
import { MailDetail } from "./mail-detail";
import { SnoozeDialog } from "./snooze-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getClientActionErrorMessage, useClientAction } from "@/hooks/use-client-action";
import {
  Archive,
  CheckCircle2,
  Search,
  Star,
  Clock3,
  X,
} from "lucide-react";
import {
  getEmailDetail,
  getEmails,
  markArchived,
  markDone,
  setStarred,
  snooze,
} from "@/app/actions/email";
import type { Email, EmailListItem, Attachment } from "@/lib/db/schema";
import { buildInboxHref } from "@/lib/inbox-route";
import {
  applyInboxEmailPatch,
  buildInboxSearchNavigationState,
  resolveVisibleSelectedMailId,
} from "./inbox-view-state";
import { useI18n } from "@/components/providers/i18n-provider";

interface InboxViewProps {
  initialEmails: EmailListItem[];
  accountProviders: Record<string, string>;
  accountId?: string;
  starred?: boolean;
  initialSearch: string;
  selectedMailId?: string;
}

export function InboxView({
  initialEmails,
  accountProviders,
  accountId,
  starred,
  initialSearch,
  selectedMailId,
}: InboxViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isPending: isMutating, run } = useClientAction();
  const { messages } = useI18n();
  const [emails, setEmails] = useState(initialEmails);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [batchSnoozeOpen, setBatchSnoozeOpen] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();

  const selectedId = selectedMailId ?? null;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = emails.length > 0 && selectedIds.length === emails.length;
  const isPending = isSearching || isMutating;

  const buildCurrentInboxHref = useCallback(
    (overrides?: { search?: string; mailId?: string }) =>
      buildInboxHref({
        accountId,
        starred,
        search: overrides?.search ?? activeSearch,
        mailId: overrides?.mailId,
      }),
    [accountId, activeSearch, starred]
  );

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  useEffect(() => {
    setSearch(initialSearch);
    setActiveSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedEmail(null);
      setSelectedAttachments([]);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    setSelectedEmail((current) => (current?.id === selectedId ? current : null));
    setSelectedAttachments([]);

    void getEmailDetail(selectedId)
      .then((detail) => {
        if (cancelled) return;
        setSelectedEmail(detail?.email ?? null);
        setSelectedAttachments(detail?.attachments ?? []);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : messages.inbox.loadDetailErrorDescription;
        toast({
          title: messages.inbox.loadDetailErrorTitle,
          description: message,
          variant: "error",
        });
        setSelectedEmail(null);
        setSelectedAttachments([]);
      })
      .finally(() => {
        if (cancelled) return;
        setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [messages.inbox.loadDetailErrorDescription, messages.inbox.loadDetailErrorTitle, selectedId, toast]);

  useEffect(() => {
    if (!selectedId) return;

    const nextSelectedId = resolveVisibleSelectedMailId(selectedId, emails);
    if (!nextSelectedId) {
      router.replace(buildCurrentInboxHref({ mailId: undefined }), { scroll: false });
    }
  }, [buildCurrentInboxHref, emails, router, selectedId]);

  const doSearch = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim();

      startSearchTransition(async () => {
        try {
          const results = await getEmails({
            accountId,
            search: normalizedQuery || undefined,
            starred,
          });
          const nextState = buildInboxSearchNavigationState({
            accountId,
            starred,
            query: normalizedQuery,
            selectedId,
            results,
          });

          setEmails(results);
          setSelectedIds([]);
          setActiveSearch(nextState.normalizedQuery);

          router.replace(nextState.href, { scroll: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : messages.inbox.searchErrorDescription;
          toast({
            title: messages.inbox.searchErrorTitle,
            description: message,
            variant: "error",
          });
        }
      });
    },
    [accountId, messages.inbox.searchErrorDescription, messages.inbox.searchErrorTitle, router, selectedId, starred, toast]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(search);
  }

  function clearSearch() {
    setSearch("");
    doSearch("");
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function handleSelectAllVisible() {
    setSelectedIds((current) =>
      current.length === emails.length ? [] : emails.map((email) => email.id)
    );
  }

  function applyLocalPatch(emailId: string, patch: Partial<Email>) {
    const now = Math.floor(Date.now() / 1000);
    const nextState = applyInboxEmailPatch(emails, emailId, patch, {
      starred,
      nowTs: now,
      selectedId,
    });

    setEmails(nextState.emails);

    if (nextState.removedSelectedEmail) {
      setSelectedEmail(null);
      setSelectedAttachments([]);
      router.replace(buildCurrentInboxHref({ mailId: undefined }), { scroll: false });
      return;
    }

    setSelectedEmail((current) =>
      current && current.id === emailId ? { ...current, ...patch } : current
    );
  }

  function applyBatchPatch(ids: string[], patch: Partial<Email>) {
    ids.forEach((id) => applyLocalPatch(id, patch));
    setSelectedIds([]);
  }

  function handleSelect(id: string) {
    router.push(buildCurrentInboxHref({ mailId: id }), { scroll: false });
  }

  function handleClose() {
    router.replace(buildCurrentInboxHref({ mailId: undefined }), { scroll: false });
  }

  function runBatchAction(action: () => Promise<void>, errorTitle: string) {
    if (selectedIds.length === 0) return;

    void run({
      action,
      refresh: true,
      errorToast: (error) => ({
        title: errorTitle,
        description: getClientActionErrorMessage(error),
        variant: "error",
      }),
    });
  }

  const shouldShowMobileDetail = Boolean(selectedId);

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <div className={`${shouldShowMobileDetail ? "hidden md:flex" : "flex"} min-h-0 w-[23rem] flex-col border-r border-border/70 xl:w-[28rem]`}>
          <div className="border-b border-border/70 p-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={messages.inbox.searchPlaceholder}
                  className="h-11 rounded-2xl border-border/80 bg-background/80 pl-10 pr-10"
                />
                {search && (
                  <button type="button" onClick={clearSearch} className="absolute right-3 top-3">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{messages.inbox.count(emails.length)}</span>
              {starred && <span>• {messages.inbox.starredOnly}</span>}
              {activeSearch && <span>• {messages.inbox.searching}</span>}
              {isPending && <span>• {messages.inbox.loading}</span>}
            </div>
            <div className="mt-3 rounded-2xl bg-muted/55 px-3 py-2 text-xs text-muted-foreground">
              <div>
                {messages.inbox.searchExample.includes("：") ? messages.inbox.searchExample : `Example: ${messages.inbox.searchExample}`}
              </div>
              <div className="mt-1">{messages.inbox.searchSupport}</div>
            </div>
          </div>

          <div className="border-b border-border/70 px-4 py-3">
            {selectedIds.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">{messages.inbox.selectedCount(selectedIds.length)}</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await markDone(selectedIds, true);
                        applyBatchPatch(selectedIds, { localDone: 1 });
                      }, messages.inbox.batchDoneError)
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> {messages.inbox.done}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await markArchived(selectedIds, true);
                        applyBatchPatch(selectedIds, { localArchived: 1 });
                      }, messages.inbox.batchArchiveError)
                    }
                  >
                    <Archive className="h-4 w-4" /> {messages.inbox.archive}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBatchSnoozeOpen(true)} disabled={isPending}>
                    <Clock3 className="h-4 w-4" /> {messages.inbox.snooze}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await setStarred(selectedIds, true);
                        applyBatchPatch(selectedIds, { isStarred: 1 });
                      }, messages.inbox.batchStarError)
                    }
                  >
                    <Star className="h-4 w-4" /> {messages.inbox.batchStar}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={isPending}>
                    {messages.inbox.clearSelection}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleSelectAllVisible} disabled={isPending}>
                {emails.length > 0
                  ? allVisibleSelected
                    ? messages.inbox.unselectAll
                    : messages.inbox.selectAllVisible
                  : messages.inbox.nothingSelectable}
              </Button>
            )}
          </div>

          <MailList
            emails={emails}
            selectedId={selectedId ?? undefined}
            selectedIds={[...selectedIdSet]}
            accountProviders={accountProviders}
            onSelect={handleSelect}
            onToggleSelect={handleToggleSelect}
          />
        </div>

        <div className={`${shouldShowMobileDetail ? "flex" : "hidden md:flex"} min-h-0 flex-1 overflow-hidden`}>
          {selectedEmail || detailLoading ? (
            <div className="min-h-0 flex-1">
              {selectedEmail ? (
                <MailDetail
                  email={selectedEmail}
                  attachments={selectedAttachments}
                  isHydrating={detailLoading}
                  onClose={handleClose}
                  onLocalUpdate={applyLocalPatch}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {messages.inbox.loadingDetail}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-8 text-muted-foreground">
              <div className="max-w-md rounded-[2rem] border border-dashed border-border/80 bg-background/55 px-8 py-10 text-center shadow-sm">
                <p className="text-lg font-medium text-foreground">{messages.inbox.emptyTitle}</p>
                <p className="mt-1 text-sm">{messages.inbox.emptyDescription}</p>
                <p className="mt-3 text-xs">{messages.inbox.emptyNote}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SnoozeDialog
        open={batchSnoozeOpen}
        onOpenChange={setBatchSnoozeOpen}
        title={messages.inbox.batchSnoozeTitle}
        onConfirm={async (value) => {
          await run({
            action: () => snooze(selectedIds, value),
            refresh: true,
            onSuccess: () => {
              applyBatchPatch(selectedIds, {
                localSnoozeUntil: Math.floor(new Date(value).getTime() / 1000),
              });
            },
            errorToast: (error) => ({
              title: messages.inbox.batchSnoozeError,
              description: getClientActionErrorMessage(error),
              variant: "error",
            }),
          });
        }}
      />
    </>
  );
}
