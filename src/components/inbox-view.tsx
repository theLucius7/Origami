"use client";

import { useState, useTransition, useCallback } from "react";
import { MailList } from "./mail-list";
import { MailDetail } from "./mail-detail";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { getEmails, getEmailById, getEmailAttachments } from "@/actions/email";
import type { Email, Attachment } from "@/lib/db/schema";

interface InboxViewProps {
  initialEmails: Email[];
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
  const [emails, setEmails] = useState(initialEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const doSearch = useCallback(
    (query: string) => {
      startTransition(async () => {
        const results = await getEmails({
          accountId,
          search: query || undefined,
          starred,
        });
        setEmails(results);
      });
    },
    [accountId, starred]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(search);
  }

  function clearSearch() {
    setSearch("");
    doSearch("");
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    startTransition(async () => {
      const [email, atts] = await Promise.all([
        getEmailById(id),
        getEmailAttachments(id),
      ]);
      setSelectedEmail(email);
      setSelectedAttachments(atts);
    });
  }

  function handleMarkedRead(emailId: string) {
    setEmails((current) =>
      current.map((email) =>
        email.id === emailId ? { ...email, isRead: 1 } : email
      )
    );
    setSelectedEmail((current) =>
      current && current.id === emailId ? { ...current, isRead: 1 } : current
    );
  }

  function handleToggledStar(emailId: string) {
    setEmails((current) =>
      current
        .map((email) =>
          email.id === emailId
            ? { ...email, isStarred: email.isStarred ? 0 : 1 }
            : email
        )
        .filter((email) => !starred || email.isStarred === 1)
    );

    setSelectedEmail((current) =>
      current && current.id === emailId
        ? { ...current, isStarred: current.isStarred ? 0 : 1 }
        : current
    );

    if (starred && selectedId === emailId) {
      setSelectedId(null);
      setSelectedEmail(null);
      setSelectedAttachments([]);
    }
  }

  function handleClose() {
    setSelectedId(null);
    setSelectedEmail(null);
    setSelectedAttachments([]);
  }

  return (
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
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{emails.length} 封邮件</span>
            {starred && <span>• 仅已标星</span>}
            {isPending && <span>• 加载中...</span>}
          </div>
        </div>
        <MailList
          emails={emails}
          selectedId={selectedId ?? undefined}
          accountProviders={accountProviders}
          onSelect={handleSelect}
        />
      </div>

      <div className="hidden flex-1 md:flex">
        {selectedEmail ? (
          <div className="flex-1">
            <MailDetail
              email={selectedEmail}
              attachments={selectedAttachments}
              onClose={handleClose}
              onMarkedRead={handleMarkedRead}
              onToggledStar={handleToggledStar}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">选择一封邮件开始阅读</p>
              <p className="mt-1 text-sm">在左侧列表中点击邮件查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
