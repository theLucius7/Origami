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
        const message = error instanceof Error ? error.message : "加载邮件详情失败，请稍后重试。";
        toast({
          title: "加载邮件详情失败",
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
  }, [initialEmails, selectedId, toast]);

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
          const message = error instanceof Error ? error.message : "搜索失败，请换个关键词重试。";
          toast({
            title: "搜索失败",
            description: message,
            variant: "error",
          });
        }
      });
    },
    [accountId, router, selectedId, starred, toast]
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
    let removedSelectedEmail = false;

    setEmails((current) => {
      const nextState = applyInboxEmailPatch(current, emailId, patch, {
        starred,
        nowTs: now,
        selectedId,
      });
      removedSelectedEmail = nextState.removedSelectedEmail;
      return nextState.emails;
    });

    if (removedSelectedEmail) {
      router.replace(buildCurrentInboxHref({ mailId: undefined }), { scroll: false });
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

  function runBatchAction(
    action: () => Promise<void>,
    errorTitle: string
  ) {
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
      <div className="flex h-full flex-1">
        <div className={`${shouldShowMobileDetail ? "hidden md:flex" : "flex"} w-80 flex-col border-r lg:w-96`}>
          <div className="border-b p-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索邮件..."
                  className="pl-8"
                />
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{emails.length} 封邮件</span>
              {starred && <span>• 仅已标星</span>}
              {activeSearch && <span>• 搜索中</span>}
              {isPending && <span>• 加载中...</span>}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              示例：<code>from:张三 subject:发票 is:unread account:gmail</code>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              支持：account: / from: / subject: / is:read / is:unread / is:star / is:done / is:archived / is:snoozed
            </div>
          </div>

          <div className="border-b px-3 py-2">
            {selectedIds.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  已选中 {selectedIds.length} 封邮件
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await markDone(selectedIds, true);
                        applyBatchPatch(selectedIds, { localDone: 1 });
                      }, "批量标记 Done 失败")
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await markArchived(selectedIds, true);
                        applyBatchPatch(selectedIds, { localArchived: 1 });
                      }, "批量归档失败")
                    }
                  >
                    <Archive className="h-4 w-4" /> 归档
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBatchSnoozeOpen(true)} disabled={isPending}>
                    <Clock3 className="h-4 w-4" /> 稍后看
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      runBatchAction(async () => {
                        await setStarred(selectedIds, true);
                        applyBatchPatch(selectedIds, { isStarred: 1 });
                      }, "批量标星失败")
                    }
                  >
                    <Star className="h-4 w-4" /> 批量标星
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={isPending}>
                    清空选择
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleSelectAllVisible} disabled={isPending}>
                {emails.length > 0 ? (allVisibleSelected ? "取消全选" : "全选当前列表") : "暂无可选邮件"}
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

        <div className={`${shouldShowMobileDetail ? "flex" : "hidden md:flex"} flex-1`}>
          {selectedEmail || detailLoading ? (
            <div className="flex-1">
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
                  正在加载邮件详情…
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">选择一封邮件开始阅读</p>
                <p className="mt-1 text-sm">在左侧列表中点击邮件查看详情</p>
                <p className="mt-3 text-xs">
                  Triage 操作仅在 Origami 本地可见，不会修改远端邮箱状态。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SnoozeDialog
        open={batchSnoozeOpen}
        onOpenChange={setBatchSnoozeOpen}
        title="批量设置稍后看"
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
              title: "批量设置稍后看失败",
              description: getClientActionErrorMessage(error),
              variant: "error",
            }),
          });
        }}
      />
    </>
  );
}
