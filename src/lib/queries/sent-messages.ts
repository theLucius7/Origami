import { db } from "@/lib/db";
import { accounts, sentMessages, sentMessageAttachments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listSentMessages(accountId?: string) {
  const where = accountId ? eq(sentMessages.accountId, accountId) : undefined;
  return db.select().from(sentMessages).where(where).orderBy(desc(sentMessages.sentAt));
}

export async function getSentMessageRecordById(id: string) {
  const rows = await db.select().from(sentMessages).where(eq(sentMessages.id, id));
  return rows[0] ?? null;
}

export async function listSentMessageAttachments(sentMessageId: string) {
  return db
    .select()
    .from(sentMessageAttachments)
    .where(eq(sentMessageAttachments.sentMessageId, sentMessageId));
}

export async function getSentMessageDetailRecord(id: string) {
  const message = await getSentMessageRecordById(id);
  if (!message) return null;

  const [accountRows, attachments] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.id, message.accountId)),
    listSentMessageAttachments(id),
  ]);

  return {
    message,
    account: accountRows[0] ?? null,
    attachments,
  };
}
