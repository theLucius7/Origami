"use server";

import { db } from "@/lib/db";
import { accounts, emails, attachments } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/crypto";
import { deleteAttachment } from "@/lib/r2";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createEmailProvider } from "@/lib/providers/factory";

export async function getAccounts() {
  return db.select().from(accounts).orderBy(accounts.createdAt);
}

export async function getAccountById(id: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id));
  return rows[0] ?? null;
}

export async function getSendCapableAccounts() {
  const rows = await getAccounts();

  return rows.flatMap((account) => {
    try {
      const creds = JSON.parse(decrypt(account.credentials));
      const provider = createEmailProvider(account, creds);
      if (!provider.getCapabilities().canSend) return [];

      return [{
        id: account.id,
        provider: account.provider,
        email: account.email,
        displayName: account.displayName ?? account.email,
        fromAddress: account.displayName
          ? `${account.displayName} <${account.email}>`
          : account.email,
      }];
    } catch (error) {
      console.warn("Failed to resolve send capability for account:", account.email, error);
      return [];
    }
  });
}

export async function addQQAccount(
  email: string,
  authCode: string,
  displayName?: string,
  initialFetchLimit = 200
) {
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

  revalidatePath("/");
  revalidatePath("/accounts");
  return id;
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

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/compose");
  revalidatePath("/sent");
  return id;
}

export async function updateAccountInitialFetchLimit(
  id: string,
  initialFetchLimit: number
) {
  if (![50, 200, 1000].includes(initialFetchLimit)) {
    throw new Error("Unsupported initial fetch limit");
  }

  await db
    .update(accounts)
    .set({ initialFetchLimit })
    .where(eq(accounts.id, id));

  revalidatePath("/accounts");
}

export async function removeAccount(id: string) {
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
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/compose");
  revalidatePath("/sent");
}

export async function getDecryptedCredentials(id: string) {
  const account = await getAccountById(id);
  if (!account) throw new Error("Account not found");
  return JSON.parse(decrypt(account.credentials));
}

export async function updateAccountSyncState(
  id: string,
  syncCursor: string | null,
  credentials?: string
) {
  const updates: Record<string, unknown> = {
    syncCursor,
    lastSyncedAt: Math.floor(Date.now() / 1000),
  };
  if (credentials) {
    updates.credentials = credentials;
  }
  await db.update(accounts).set(updates).where(eq(accounts.id, id));
}
