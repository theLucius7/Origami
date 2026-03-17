"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { runLoggedAction } from "@/lib/actions";
import { db } from "@/lib/db";
import { accounts, emails } from "@/lib/db/schema";
import {
  countUnreadEmails,
  getEmailRecordById,
  listEmailAttachments,
  listEmails,
} from "@/lib/queries/emails";
import { writeBackRead, writeBackStar, type WriteBackResult } from "@/lib/providers/writeBack";
import { revalidateMailboxPages } from "@/lib/revalidate";
import { getHydratedEmailDetail, hydrateEmailIfNeeded } from "@/lib/services/email-service";

type WriteBackKind = "read" | "star";
type PersistedWriteBackStatus = "idle" | "pending" | "success" | "skipped" | "failed";

async function getWriteBackTargets(emailIds: string[]) {
  if (emailIds.length === 0) return [];

  const rows = await db
    .select({ email: emails, account: accounts })
    .from(emails)
    .innerJoin(accounts, eq(accounts.id, emails.accountId))
    .where(inArray(emails.id, emailIds));

  return rows;
}

async function persistWriteBackState(
  emailIds: string[],
  kind: WriteBackKind,
  state: {
    status: PersistedWriteBackStatus;
    error?: string | null;
    at?: number | null;
  }
) {
  if (emailIds.length === 0) return;

  const isRead = kind === "read";
  await db
    .update(emails)
    .set(
      isRead
        ? {
            readWriteBackStatus: state.status,
            readWriteBackError: state.error ?? null,
            readWriteBackAt: state.at ?? null,
          }
        : {
            starWriteBackStatus: state.status,
            starWriteBackError: state.error ?? null,
            starWriteBackAt: state.at ?? null,
          }
    )
    .where(inArray(emails.id, emailIds));
}

function mapWriteBackResult(result: WriteBackResult): {
  status: PersistedWriteBackStatus;
  error: string | null;
  at: number;
} {
  return {
    status: result.success ? "success" : result.skipped ? "skipped" : "failed",
    error: result.error ?? null,
    at: Math.floor(Date.now() / 1000),
  };
}

async function scheduleReadWriteBack(emailId: string) {
  const rows = await getWriteBackTargets([emailId]);
  const row = rows[0];
  if (!row) return;

  if (!row.email.remoteId) {
    await persistWriteBackState([emailId], "read", {
      status: "skipped",
      error: "missing remote message id",
      at: Math.floor(Date.now() / 1000),
    });
    return;
  }

  await persistWriteBackState([emailId], "read", {
    status: "pending",
    error: null,
    at: null,
  });

  void writeBackRead(row.account, row.email.remoteId)
    .then(async (result) => {
      await persistWriteBackState([emailId], "read", mapWriteBackResult(result));
    })
    .catch(async (error) => {
      const message = error instanceof Error ? error.message : String(error);
      await persistWriteBackState([emailId], "read", {
        status: "failed",
        error: message,
        at: Math.floor(Date.now() / 1000),
      });
      console.warn(`[writeback:read] failed to schedule for ${emailId}:`, error);
    });
}

async function scheduleStarWriteBack(emailIds: string[], starred: boolean) {
  const rows = await getWriteBackTargets(emailIds);
  if (rows.length === 0) return;

  const withRemoteIds = rows.filter((row) => Boolean(row.email.remoteId));
  const withoutRemoteIds = rows.filter((row) => !row.email.remoteId);

  if (withoutRemoteIds.length > 0) {
    await persistWriteBackState(
      withoutRemoteIds.map((row) => row.email.id),
      "star",
      {
        status: "skipped",
        error: "missing remote message id",
        at: Math.floor(Date.now() / 1000),
      }
    );
  }

  if (withRemoteIds.length === 0) return;

  await persistWriteBackState(
    withRemoteIds.map((row) => row.email.id),
    "star",
    {
      status: "pending",
      error: null,
      at: null,
    }
  );

  void Promise.allSettled(
    withRemoteIds.map(async (row) => {
      try {
        const result = await writeBackStar(row.account, row.email.remoteId!, starred);
        await persistWriteBackState([row.email.id], "star", mapWriteBackResult(result));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await persistWriteBackState([row.email.id], "star", {
          status: "failed",
          error: message,
          at: Math.floor(Date.now() / 1000),
        });
        console.warn(`[writeback:star] failed to schedule for ${row.email.id}:`, error);
      }
    })
  );
}

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

    try {
      await scheduleReadWriteBack(emailId);
    } catch (error) {
      console.warn(`[writeback:read] failed to prepare for ${emailId}:`, error);
    }

    revalidateMailboxPages();
  });
}

export async function toggleStar(emailId: string) {
  return runLoggedAction("toggleStar", async () => {
    await db.run(
      sql`UPDATE emails SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ${emailId}`
    );

    const row = await db
      .select({ isStarred: emails.isStarred })
      .from(emails)
      .where(eq(emails.id, emailId));

    try {
      await scheduleStarWriteBack([emailId], row[0]?.isStarred === 1);
    } catch (error) {
      console.warn(`[writeback:star] failed to prepare for ${emailId}:`, error);
    }

    revalidateMailboxPages();
  });
}

export async function setStarred(emailIds: string[], starred = true) {
  return runLoggedAction("setStarred", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ isStarred: starred ? 1 : 0 })
      .where(inArray(emails.id, emailIds));

    try {
      await scheduleStarWriteBack(emailIds, starred);
    } catch (error) {
      console.warn(`[writeback:star] failed to prepare for ${emailIds.join(",")}:`, error);
    }

    revalidateMailboxPages();
  });
}

export async function markDone(emailIds: string[], done = true) {
  return runLoggedAction("markDone", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localDone: done ? 1 : 0 })
      .where(inArray(emails.id, emailIds));

    revalidateMailboxPages();
  });
}

export async function markArchived(emailIds: string[], archived = true) {
  return runLoggedAction("markArchived", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localArchived: archived ? 1 : 0 })
      .where(inArray(emails.id, emailIds));

    revalidateMailboxPages();
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

    revalidateMailboxPages();
  });
}

export async function clearSnooze(emailIds: string[]) {
  return runLoggedAction("clearSnooze", async () => {
    if (emailIds.length === 0) return;
    await db
      .update(emails)
      .set({ localSnoozeUntil: null })
      .where(inArray(emails.id, emailIds));

    revalidateMailboxPages();
  });
}

export async function getUnreadCount(accountId?: string) {
  return countUnreadEmails(accountId);
}
