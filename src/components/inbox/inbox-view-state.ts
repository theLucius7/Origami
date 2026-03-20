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

export function reconcileSelectedIds(
  selectedIds: string[],
  emails: Array<Pick<EmailListItem, "id">>
) {
  if (selectedIds.length === 0) return selectedIds;

  const visibleIds = new Set(emails.map((email) => email.id));
  return selectedIds.filter((id) => visibleIds.has(id));
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

function applyInboxEmailPatchSet(
  emails: EmailListItem[],
  emailIds: string[],
  patch: Partial<Email>,
  { starred, nowTs, selectedId }: ApplyInboxEmailPatchOptions
) {
  const targetIds = new Set(emailIds);
  const updatedEmails = emails
    .map((email) => (targetIds.has(email.id) ? { ...email, ...patch } : email))
    .filter((email) => isInboxEmailVisible(email, starred, nowTs));

  return {
    emails: updatedEmails,
    removedSelectedEmail: !!selectedId && targetIds.has(selectedId) && !updatedEmails.some((email) => email.id === selectedId),
  };
}

export function applyInboxEmailPatch(
  emails: EmailListItem[],
  emailId: string,
  patch: Partial<Email>,
  options: ApplyInboxEmailPatchOptions
) {
  return applyInboxEmailPatchSet(emails, [emailId], patch, options);
}

export function applyInboxEmailBatchPatch(
  emails: EmailListItem[],
  emailIds: string[],
  patch: Partial<Email>,
  options: ApplyInboxEmailPatchOptions
) {
  return applyInboxEmailPatchSet(emails, emailIds, patch, options);
}
