"use server";

import { db } from "@/lib/db";
import { emails, attachments } from "@/lib/db/schema";
import { desc, eq, and, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

  const conditions = [];
  if (accountId) conditions.push(eq(emails.accountId, accountId));
  if (folder) conditions.push(eq(emails.folder, folder));
  if (starred) conditions.push(eq(emails.isStarred, 1));
  if (search) {
    conditions.push(
      or(
        like(emails.subject, `%${search}%`),
        like(emails.sender, `%${search}%`),
        like(emails.snippet, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(emails)
    .where(where)
    .orderBy(desc(emails.receivedAt))
    .limit(limit)
    .offset(offset);

  return rows;
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
  const conditions = [eq(emails.isRead, 0)];
  if (accountId) conditions.push(eq(emails.accountId, accountId));

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}
