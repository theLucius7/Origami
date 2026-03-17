"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MailList } from "./mail-list";
import { MailDetail } from "./mail-detail";
import { SnoozeDialog } from "./snooze-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface InboxViewProps {
  initialEmails: EmailListItem[];
  accountProviders: Record<string, string>;
  accountId?: string;
  starred?: boolean;
}

export function InboxView({
  initialEmails,
  accountProviders,
  accountId,
  starred,
}: InboxViewProps) {
  const router = useRouter();
  const [emails, setEmails] = useState(initialEmails);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [batchSnoozeOpen, setBatchSnoozeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = emails.length > 0 && selectedIds.length === emails.length;

  const doSearch = useCallback(
    (query: string) => {
      startTransition(async () => {
        const results = await getEmails({
          accountId,
          search: query || undefined,
          starred,
        });
        setEmails(results);
        setSelectedIds([]);
        if (selectedId && !results.some((email) => email.id === selectedId)) {
          setSelectedId(null);
          setSelectedEmail(null);
          setSelectedAttachments([]);
        }
      });
    },
    [accountId, selectedId, starred]
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

    setEmails((current) => {
      const updated = current
        .map((email) =>
          email.id === emailId ? { ...email, ...patch } : email
        )
        .filter((email) => {
          if (email.localArchived === 1) return false;
          if (email.localSnoozeUntil && email.localSnoozeUntil > now) return false;
          if (starred && email.isStarred !== 1) return false;
          return true;
        });

      if (!updated.some((email) => email.id === emailId) && selectedId === emailId) {
        setSelectedId(null);
        setSelectedEmail(null);
        setSelectedAttachments([]);
      }

      return updated;
    });

    setSelectedEmail((current) =>
      current && current.id === emailId ? { ...current, ...patch } : current
    );
  }

  function applyBatchPatch(ids: string[], patch: Partial<Email>) {
    ids.forEach((id) => applyLocalPatch(id, patch));
    setSelectedIds([]);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setSelectedEmail(null);
    setSelectedAttachments([]);
    startTransition(async () => {
      const detail = await getEmailDetail(id);
      setSelectedEmail(detail?.email ?? null);
      setSelectedAttachments(detail?.attachments ?? []);
      setDetailLoading(false);
    });
  }

  function handleClose() {
    setSelectedId(null);
    setSelectedEmail(null);
    setSelectedAttachments([]);
    setDetailLoading(false);
  }

  async function runBatchAction(action: () => Promise<void>) {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex h-full flex-1">
        <div className="flex w-80 flex-col border-r lg:w-96">
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
                    onClick={() =>
                      runBatchAction(async () => {
                        await markDone(selectedIds, true);
                        applyBatchPatch(selectedIds, { localDone: 1 });
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runBatchAction(async () => {
                        await markArchived(selectedIds, true);
                        applyBatchPatch(selectedIds, { localArchived: 1 });
                      })
                    }
                  >
                    <Archive className="h-4 w-4" /> 归档
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setBatchSnoozeOpen(true)}>
                    <Clock3 className="h-4 w-4" /> 稍后看
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runBatchAction(async () => {
                        await setStarred(selectedIds, true);
                        applyBatchPatch(selectedIds, { isStarred: 1 });
                      })
                    }
                  >
                    <Star className="h-4 w-4" /> 批量标星
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                    清空选择
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleSelectAllVisible}>
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

        <div className="hidden flex-1 md:flex">
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
          await snooze(selectedIds, value);
          applyBatchPatch(selectedIds, {
            localSnoozeUntil: Math.floor(new Date(value).getTime() / 1000),
          });
          router.refresh();
        }}
      />
    </>
  );
}
