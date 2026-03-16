"use server";

import { db } from "@/lib/db";
import {
  accounts,
  emails,
  attachments,
  type Email,
  type EmailListItem,
} from "@/lib/db/schema";
import {
  desc,
  eq,
  and,
  like,
  or,
  sql,
  inArray,
  type SQL,
  isNull,
  lte,
  gt,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseSearchQuery } from "@/lib/search-query-parser";
import { decrypt } from "@/lib/crypto";
import { createEmailProvider, getUpdatedProviderCredentials } from "@/lib/providers/factory";
import { uploadAttachment, buildObjectKey } from "@/lib/r2";
import { nanoid } from "nanoid";

const emailListColumns = {
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

function buildFtsSearchQuery(searchTerms: string[]): string | null {
  const tokens = searchTerms
    .flatMap((term) =>
      term
        .trim()
        .split(/\s+/)
        .map((token) => token.replace(/["'`*:^(){}\[\]]/g, "").trim())
    )
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

async function resolveAccountIds(accountTerms: string[]): Promise<string[] | null> {
  if (accountTerms.length === 0) return null;

  const allAccounts = await db.select().from(accounts);
  const loweredTerms = accountTerms.map((term) => term.toLowerCase());

  const ids = allAccounts
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

  return ids;
}

async function buildBaseConditions(opts: {
  accountId?: string;
  folder?: string;
  starred?: boolean;
  search?: string;
}): Promise<SQL<unknown>[]> {
  const now = Math.floor(Date.now() / 1000);
  const parsed = parseSearchQuery(opts.search ?? "");
  const conditions: SQL<unknown>[] = [];

  if (opts.accountId) conditions.push(eq(emails.accountId, opts.accountId));
  if (opts.folder) conditions.push(eq(emails.folder, opts.folder));
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

async function persistAttachment(
  accountId: string,
  emailId: string,
  att: {
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }
) {
  const attId = nanoid();
  const key = buildObjectKey(accountId, emailId, att.filename);

  await uploadAttachment(key, att.content, att.contentType);
  await db.insert(attachments).values({
    id: attId,
    emailId,
    filename: att.filename,
    contentType: att.contentType,
    size: att.size,
    r2ObjectKey: key,
  });
}

async function hydrateEmailIfNeeded(email: Email): Promise<Email> {
  if ((email.bodyText && email.bodyText.length > 0) || (email.bodyHtml && email.bodyHtml.length > 0)) {
    return email;
  }

  if (!email.remoteId) {
    return email;
  }

  try {
    const accountRows = await db.select().from(accounts).where(eq(accounts.id, email.accountId));
    const account = accountRows[0];
    if (!account) return email;

    const creds = JSON.parse(decrypt(account.credentials));
    const provider = createEmailProvider(account, creds);
    const fetched = await provider.fetchMessage(email.remoteId);
    if (!fetched) return email;

    const updatedCredentials = getUpdatedProviderCredentials(account, provider);
    if (updatedCredentials) {
      await db.update(accounts).set({ credentials: updatedCredentials }).where(eq(accounts.id, account.id));
    }

    await db
      .update(emails)
      .set({
        subject: fetched.subject,
        sender: fetched.sender,
        recipients: JSON.stringify(fetched.recipients),
        snippet: fetched.snippet,
        bodyText: fetched.bodyText,
        bodyHtml: fetched.bodyHtml,
      })
      .where(eq(emails.id, email.id));

    const existingAttachments = await db
      .select({ id: attachments.id })
      .from(attachments)
      .where(eq(attachments.emailId, email.id));

    if (existingAttachments.length === 0) {
      for (const att of fetched.attachments) {
        await persistAttachment(email.accountId, email.id, att);
      }
    }

    const refreshed = await db.select().from(emails).where(eq(emails.id, email.id));
    return refreshed[0] ?? email;
  } catch (error) {
    console.error("Failed to hydrate email body:", error);
    return email;
  }
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

  const baseConditions = await buildBaseConditions({ accountId, folder, starred, search });
  const parsed = parseSearchQuery(search ?? "");

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
        return await runEmailListQuery(ftsWhere, limit, offset);
      } catch (error) {
        if (!isFtsUnavailable(error)) {
          throw error;
        }
      }
    }

    return runEmailListQuery(
      and(
        ...baseConditions,
        ...parsed.textTerms.map((term) => buildLikeSearchCondition(term))
      ),
      limit,
      offset
    );
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined;
  return runEmailListQuery(where, limit, offset);
}

export async function getEmailById(id: string) {
  const rows = await db.select().from(emails).where(eq(emails.id, id));
  const email = rows[0] ?? null;
  if (!email) return null;
  return hydrateEmailIfNeeded(email);
}

export async function getEmailAttachments(emailId: string) {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, emailId));
}

export async function getEmailDetail(emailId: string) {
  const email = await getEmailById(emailId);
  if (!email) return null;
  const emailAttachments = await getEmailAttachments(emailId);
  return { email, attachments: emailAttachments };
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

export async function setStarred(emailIds: string[], starred = true) {
  if (emailIds.length === 0) return;
  await db
    .update(emails)
    .set({ isStarred: starred ? 1 : 0 })
    .where(inArray(emails.id, emailIds));
  revalidatePath("/");
}

export async function markDone(emailIds: string[], done = true) {
  if (emailIds.length === 0) return;
  await db
    .update(emails)
    .set({ localDone: done ? 1 : 0 })
    .where(inArray(emails.id, emailIds));
  revalidatePath("/");
}

export async function markArchived(emailIds: string[], archived = true) {
  if (emailIds.length === 0) return;
  await db
    .update(emails)
    .set({ localArchived: archived ? 1 : 0 })
    .where(inArray(emails.id, emailIds));
  revalidatePath("/");
}

export async function snooze(emailIds: string[], snoozeUntil: Date | string) {
  if (emailIds.length === 0) return;
  const unix = Math.floor(new Date(snoozeUntil).getTime() / 1000);
  await db
    .update(emails)
    .set({ localSnoozeUntil: unix })
    .where(inArray(emails.id, emailIds));
  revalidatePath("/");
}

export async function clearSnooze(emailIds: string[]) {
  if (emailIds.length === 0) return;
  await db
    .update(emails)
    .set({ localSnoozeUntil: null })
    .where(inArray(emails.id, emailIds));
  revalidatePath("/");
}

export async function getUnreadCount(accountId?: string) {
  const now = Math.floor(Date.now() / 1000);
  const conditions: SQL<unknown>[] = [
    eq(emails.isRead, 0),
    eq(emails.localArchived, 0),
    or(isNull(emails.localSnoozeUntil), lte(emails.localSnoozeUntil, now))!,
  ];
  if (accountId) conditions.push(eq(emails.accountId, accountId));

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}
