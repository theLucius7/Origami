"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { runLoggedAction } from "@/lib/actions";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import {
  countUnreadEmails,
  getEmailRecordById,
  listEmailAttachments,
  listEmails,
} from "@/lib/queries/emails";
import { getHydratedEmailDetail, hydrateEmailIfNeeded } from "@/lib/services/email-service";

export async function getEmails(opts?: {
  accountId?: string;
  folder?: string;
  search?: string;
  starred?: boolean;
  limit?: number;
  offset?: number;
}) {
  return listEmails(opts);
}

export async function getEmailById(id: string) {
  const email = await getEmailRecordById(id);
  if (!email) return null;
  return hydrateEmailIfNeeded(email);
}

export async function getEmailAttachments(emailId: string) {
  return listEmailAttachments(emailId);
}

export async function getEmailDetail(emailId: string) {
  return getHydratedEmailDetail(emailId);
}

export async function markRead(emailId: string) {
  return runLoggedAction("markRead", async () => {
    await db
      .update(emails)
      .set({ isRead: 1 })
      .where(eq(emails.id, emailId));
  });
}

export async function toggleStar(emailId: string) {
  return runLoggedAction("toggleStar", async () => {
    await db.run(
      sql`UPDATE emails SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ${emailId}`
    );
  });
}

export async function setStarred(emailIds: string[], starred = true) {
  return runLoggedAction("setStarred", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ isStarred: starred ? 1 : 0 })
      .where(inArray(emails.id, emailIds));
  });
}

export async function markDone(emailIds: string[], done = true) {
  return runLoggedAction("markDone", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localDone: done ? 1 : 0 })
      .where(inArray(emails.id, emailIds));
  });
}

export async function markArchived(emailIds: string[], archived = true) {
  return runLoggedAction("markArchived", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localArchived: archived ? 1 : 0 })
      .where(inArray(emails.id, emailIds));
  });
}

export async function snooze(emailIds: string[], snoozeUntil: Date | string) {
  return runLoggedAction("snooze", async () => {
    if (emailIds.length === 0) return;
    const unix = Math.floor(new Date(snoozeUntil).getTime() / 1000);
    await db
      .update(emails)
      .set({ localSnoozeUntil: unix })
      .where(inArray(emails.id, emailIds));
  });
}

export async function clearSnooze(emailIds: string[]) {
  return runLoggedAction("clearSnooze", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localSnoozeUntil: null })
      .where(inArray(emails.id, emailIds));
  });
}

export async function getUnreadCount(accountId?: string) {
  return countUnreadEmails(accountId);
}
