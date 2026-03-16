"use server";

import { db } from "@/lib/db";
import { emails, attachments, type EmailListItem } from "@/lib/db/schema";
import {
  desc,
  eq,
  and,
  like,
  or,
  sql,
  inArray,
  type SQL,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

const emailListColumns = {
  id: emails.id,
  accountId: emails.accountId,
  messageId: emails.messageId,
  subject: emails.subject,
  sender: emails.sender,
  snippet: emails.snippet,
  isRead: emails.isRead,
  isStarred: emails.isStarred,
  receivedAt: emails.receivedAt,
  folder: emails.folder,
  createdAt: emails.createdAt,
};

function buildBaseConditions(opts: {
  accountId?: string;
  folder?: string;
  starred?: boolean;
}): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [];
  if (opts.accountId) conditions.push(eq(emails.accountId, opts.accountId));
  if (opts.folder) conditions.push(eq(emails.folder, opts.folder));
  if (opts.starred) conditions.push(eq(emails.isStarred, 1));
  return conditions;
}

function buildLikeSearchCondition(search: string): SQL<unknown> {
  return or(
    like(emails.subject, `%${search}%`),
    like(emails.sender, `%${search}%`),
    like(emails.snippet, `%${search}%`)
  )!;
}

function buildFtsSearchQuery(search: string): string | null {
  const tokens = search
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/["'`*:^(){}\[\]]/g, "").trim())
    .filter(Boolean)
    .slice(0, 8);

  if (tokens.length === 0) return null;
  return tokens.map((token) => `${token}*`).join(" ");
}

function isFtsUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("no such table: emails_fts") ||
    message.includes("no such module: fts5") ||
    message.includes("fts5")
  );
}

async function runEmailListQuery(
  where: SQL<unknown> | undefined,
  limit: number,
  offset: number
): Promise<EmailListItem[]> {
  return db
    .select(emailListColumns)
    .from(emails)
    .where(where)
    .orderBy(desc(emails.receivedAt))
    .limit(limit)
    .offset(offset);
}

export async function getEmails(opts?: {
  accountId?: string;
  folder?: string;
  search?: string;
  starred?: boolean;
  limit?: number;
  offset?: number;
}) {
  const {
    accountId,
    folder,
    search,
    starred,
    limit = 50,
    offset = 0,
  } = opts ?? {};

  const baseConditions = buildBaseConditions({ accountId, folder, starred });
  const normalizedSearch = search?.trim();

  if (normalizedSearch) {
    const ftsQuery = buildFtsSearchQuery(normalizedSearch);

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
        return await runEmailListQuery(ftsWhere, limit, offset);
      } catch (error) {
        if (!isFtsUnavailable(error)) {
          throw error;
        }
      }
    }

    return runEmailListQuery(
      and(...baseConditions, buildLikeSearchCondition(normalizedSearch)),
      limit,
      offset
    );
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined;
  return runEmailListQuery(where, limit, offset);
}

export async function getEmailById(id: string) {
  const rows = await db.select().from(emails).where(eq(emails.id, id));
  return rows[0] ?? null;
}

export async function getEmailAttachments(emailId: string) {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, emailId));
}

export async function markRead(emailId: string) {
  await db
    .update(emails)
    .set({ isRead: 1 })
    .where(eq(emails.id, emailId));
  revalidatePath("/");
}

export async function toggleStar(emailId: string) {
  await db.run(
    sql`UPDATE emails SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ${emailId}`
  );
  revalidatePath("/");
}

export async function getUnreadCount(accountId?: string) {
  const conditions: SQL<unknown>[] = [eq(emails.isRead, 0)];
  if (accountId) conditions.push(eq(emails.accountId, accountId));

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}
