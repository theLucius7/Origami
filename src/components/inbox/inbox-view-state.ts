import type { Email, EmailListItem } from "@/lib/db/schema";
import { buildInboxHref } from "@/lib/inbox-route";

interface InboxFilterContext {
  accountId?: string;
  starred?: boolean;
}

interface SearchNavigationState extends InboxFilterContext {
  query: string;
  selectedId?: string | null;
  results: Array<Pick<EmailListItem, "id">>;
}

interface ApplyInboxEmailPatchOptions extends InboxFilterContext {
  nowTs: number;
  selectedId?: string | null;
}

function normalizeInboxSearch(query: string) {
  return query.trim();
}

export function resolveVisibleSelectedMailId(
  selectedId: string | null | undefined,
  emails: Array<Pick<EmailListItem, "id">>
) {
  if (!selectedId) return undefined;
  return emails.some((email) => email.id === selectedId) ? selectedId : undefined;
}

export function buildInboxSearchNavigationState({
  accountId,
  starred,
  query,
  selectedId,
  results,
}: SearchNavigationState) {
  const normalizedQuery = normalizeInboxSearch(query);
  const nextMailId = resolveVisibleSelectedMailId(selectedId, results);

  return {
    normalizedQuery,
    nextMailId,
    href: buildInboxHref({
      accountId,
      starred,
      search: normalizedQuery,
      mailId: nextMailId,
    }),
  };
}

function isInboxEmailVisible(email: Pick<Email, "localArchived" | "localSnoozeUntil" | "isStarred">, starred: boolean | undefined, nowTs: number) {
  if (email.localArchived === 1) return false;
  if (email.localSnoozeUntil && email.localSnoozeUntil > nowTs) return false;
  if (starred && email.isStarred !== 1) return false;
  return true;
}

export function applyInboxEmailPatch(
  emails: EmailListItem[],
  emailId: string,
  patch: Partial<Email>,
  { starred, nowTs, selectedId }: ApplyInboxEmailPatchOptions
) {
  const updatedEmails = emails
    .map((email) => (email.id === emailId ? { ...email, ...patch } : email))
    .filter((email) => isInboxEmailVisible(email, starred, nowTs));

  return {
    emails: updatedEmails,
    removedSelectedEmail:
      emailId === selectedId && !updatedEmails.some((email) => email.id === emailId),
  };
}
