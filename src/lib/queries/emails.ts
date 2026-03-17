import { cache } from "react";
import { db } from "@/lib/db";
import { accounts, attachments, emails, type EmailListItem } from "@/lib/db/schema";
import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  like,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { parseSearchQuery } from "@/lib/search-query-parser";

const REMOTE_REMOVED_FOLDER = "REMOTE_REMOVED";

export const emailSummaryColumns = {
  id: emails.id,
  accountId: emails.accountId,
  remoteId: emails.remoteId,
  messageId: emails.messageId,
  subject: emails.subject,
  sender: emails.sender,
  snippet: emails.snippet,
  isRead: emails.isRead,
  isStarred: emails.isStarred,
  localDone: emails.localDone,
  localArchived: emails.localArchived,
  localSnoozeUntil: emails.localSnoozeUntil,
  receivedAt: emails.receivedAt,
  folder: emails.folder,
  createdAt: emails.createdAt,
};

function buildLikeSearchCondition(search: string): SQL<unknown> {
  return or(
    like(emails.subject, `%${search}%`),
    like(emails.sender, `%${search}%`),
    like(emails.snippet, `%${search}%`)
  )!;
}

const FTS_RESERVED_KEYWORDS = new Set(["and", "or", "not", "near"]);

function normalizeFtsToken(token: string): string | null {
  const cleaned = token.replace(/["'`*:^(){}\[\]]/g, "").trim();
  if (!cleaned) return null;
  if (FTS_RESERVED_KEYWORDS.has(cleaned.toLowerCase())) return null;
  if (!/^[\p{L}\p{N}_]+$/u.test(cleaned)) return null;
  return cleaned;
}

export function buildFtsSearchQuery(searchTerms: string[]): string | null {
  const rawTokens = searchTerms
    .flatMap((term) => term.trim().split(/\s+/))
    .filter(Boolean)
    .slice(0, 8);

  if (rawTokens.length === 0) return null;

  const tokens: string[] = [];
  for (const rawToken of rawTokens) {
    const normalized = normalizeFtsToken(rawToken);
    if (!normalized) {
      return null;
    }
    tokens.push(normalized);
  }

  return tokens.map((token) => `${token}*`).join(" ");
}

export function isFtsFallbackableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("no such table: emails_fts") ||
    message.includes("no such module: fts5") ||
    message.includes("fts5") ||
    message.includes("malformed match expression") ||
    message.includes("unable to use function match") ||
    message.includes("unterminated string") ||
    message.includes("syntax error") ||
    message.includes("no such column:")
  );
}

async function resolveAccountIds(accountTerms: string[]): Promise<string[] | null> {
  if (accountTerms.length === 0) return null;

  const allAccounts = await db.select().from(accounts);
  const loweredTerms = accountTerms.map((term) => term.toLowerCase());

  return allAccounts
    .filter((account) =>
      loweredTerms.some((term) => {
        const haystacks = [
          account.id,
          account.provider,
          account.email,
          account.displayName ?? "",
        ].map((value) => value.toLowerCase());
        return haystacks.some((value) => value.includes(term));
      })
    )
    .map((account) => account.id);
}

export async function buildEmailListConditions(opts: {
  accountId?: string;
  folder?: string;
  starred?: boolean;
  search?: string;
}): Promise<SQL<unknown>[]> {
  const now = Math.floor(Date.now() / 1000);
  const parsed = parseSearchQuery(opts.search ?? "");
  const conditions: SQL<unknown>[] = [];

  if (opts.accountId) conditions.push(eq(emails.accountId, opts.accountId));
  if (opts.folder) {
    conditions.push(eq(emails.folder, opts.folder));
  } else {
    conditions.push(or(isNull(emails.folder), ne(emails.folder, REMOTE_REMOVED_FOLDER))!);
  }
  if (opts.starred) conditions.push(eq(emails.isStarred, 1));

  const matchedAccountIds = await resolveAccountIds(parsed.accountTerms);
  if (matchedAccountIds) {
    if (matchedAccountIds.length === 0) {
      conditions.push(sql`0 = 1`);
    } else {
      conditions.push(inArray(emails.accountId, matchedAccountIds));
    }
  }

  if (parsed.flags.read !== undefined) {
    conditions.push(eq(emails.isRead, parsed.flags.read ? 1 : 0));
  }

  if (parsed.flags.starred !== undefined) {
    conditions.push(eq(emails.isStarred, parsed.flags.starred ? 1 : 0));
  }

  if (parsed.flags.done !== undefined) {
    conditions.push(eq(emails.localDone, parsed.flags.done ? 1 : 0));
  }

  if (parsed.flags.archived === true) {
    conditions.push(eq(emails.localArchived, 1));
  } else {
    conditions.push(eq(emails.localArchived, 0));
  }

  if (parsed.flags.snoozed === true) {
    conditions.push(gt(emails.localSnoozeUntil, now));
  } else {
    conditions.push(or(isNull(emails.localSnoozeUntil), lte(emails.localSnoozeUntil, now))!);
  }

  for (const fromTerm of parsed.fromTerms) {
    conditions.push(like(emails.sender, `%${fromTerm}%`));
  }

  for (const subjectTerm of parsed.subjectTerms) {
    conditions.push(like(emails.subject, `%${subjectTerm}%`));
  }

  return conditions;
}

export async function listEmails(opts?: {
  accountId?: string;
  folder?: string;
  search?: string;
  starred?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EmailListItem[]> {
  const { accountId, folder, search, starred, limit = 50, offset = 0 } = opts ?? {};
  const baseConditions = await buildEmailListConditions({ accountId, folder, starred, search });
  const parsed = parseSearchQuery(search ?? "");

  const runQuery = (where: SQL<unknown> | undefined) =>
    db
      .select(emailSummaryColumns)
      .from(emails)
      .where(where)
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

  if (parsed.textTerms.length > 0) {
    const ftsQuery = buildFtsSearchQuery(parsed.textTerms);

    if (ftsQuery) {
      const ftsWhere = and(
        ...baseConditions,
        inArray(
          emails.id,
          sql`select id from emails where rowid in (
            select rowid from emails_fts where emails_fts match ${ftsQuery}
          )`
        )
      );

      try {
        return await runQuery(ftsWhere);
      } catch (error) {
        if (!isFtsFallbackableError(error)) {
          throw error;
        }
      }
    }

    return runQuery(
      and(...baseConditions, ...parsed.textTerms.map((term) => buildLikeSearchCondition(term)))
    );
  }

  return runQuery(baseConditions.length > 0 ? and(...baseConditions) : undefined);
}

export async function getEmailRecordById(id: string) {
  const rows = await db.select().from(emails).where(eq(emails.id, id));
  return rows[0] ?? null;
}

export async function listEmailAttachments(emailId: string) {
  return db.select().from(attachments).where(eq(attachments.emailId, emailId));
}

export const countUnreadEmails = cache(async function countUnreadEmails(accountId?: string) {
  const now = Math.floor(Date.now() / 1000);
  const conditions: SQL<unknown>[] = [
    eq(emails.isRead, 0),
    eq(emails.localArchived, 0),
    or(isNull(emails.folder), ne(emails.folder, REMOTE_REMOVED_FOLDER))!,
    or(isNull(emails.localSnoozeUntil), lte(emails.localSnoozeUntil, now))!,
  ];

  if (accountId) conditions.push(eq(emails.accountId, accountId));

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
});
