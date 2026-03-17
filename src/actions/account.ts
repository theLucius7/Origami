"use server";

import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { runLoggedAction } from "@/lib/actions";
import { listSendCapableAccounts } from "@/lib/account-providers";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { accounts, attachments, emails } from "@/lib/db/schema";
import { getAccountRecordById, listAccounts } from "@/lib/queries/accounts";
import { deleteAttachment } from "@/lib/r2";
import { eq } from "drizzle-orm";

export async function getAccounts() {
  return listAccounts();
}

export async function getAccountById(id: string) {
  return getAccountRecordById(id);
}

export async function getSendCapableAccounts() {
  return listSendCapableAccounts();
}

export async function addQQAccount(
  email: string,
  authCode: string,
  displayName?: string,
  initialFetchLimit = 200
) {
  return runLoggedAction("addQQAccount", async () => {
    const id = nanoid();
    const creds = encrypt(JSON.stringify({ email, authCode }));

    await db.insert(accounts).values({
      id,
      provider: "qq",
      email,
      displayName: displayName ?? email,
      credentials: creds,
      initialFetchLimit,
    });

    return id;
  });
}

export async function addOAuthAccount(
  provider: "gmail" | "outlook",
  email: string,
  displayName: string,
  accessToken: string,
  refreshToken: string,
  scopes: string[] = [],
  initialFetchLimit = 200
) {
  return runLoggedAction("addOAuthAccount", async () => {
    const id = nanoid();
    const creds = encrypt(JSON.stringify({ accessToken, refreshToken, scopes }));

    await db
      .insert(accounts)
      .values({
        id,
        provider,
        email,
        displayName: displayName ?? email,
        credentials: creds,
        initialFetchLimit,
      })
      .onConflictDoUpdate({
        target: accounts.email,
        set: { credentials: creds, displayName },
      });

    return id;
  });
}

export async function updateAccountInitialFetchLimit(
  id: string,
  initialFetchLimit: number
) {
  return runLoggedAction("updateAccountInitialFetchLimit", async () => {
    if (![50, 200, 1000].includes(initialFetchLimit)) {
      throw new Error("Unsupported initial fetch limit");
    }

    await db
      .update(accounts)
      .set({ initialFetchLimit })
      .where(eq(accounts.id, id));
  });
}

export async function removeAccount(id: string) {
  return runLoggedAction("removeAccount", async () => {
    const emailRows = await db
      .select({ id: emails.id })
      .from(emails)
      .where(eq(emails.accountId, id));

    const emailIds = emailRows.map((row) => row.id);
    if (emailIds.length > 0) {
      const attachmentRows = await db
        .select({ key: attachments.r2ObjectKey })
        .from(attachments)
        .where(inArray(attachments.emailId, emailIds));

      const deletionResults = await Promise.allSettled(
        attachmentRows.map((row) => deleteAttachment(row.key))
      );

      for (const result of deletionResults) {
        if (result.status === "rejected") {
          console.warn("Failed to delete R2 attachment during account removal:", result.reason);
        }
      }
    }

    await db.delete(accounts).where(eq(accounts.id, id));
  });
}
