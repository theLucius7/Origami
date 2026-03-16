"use server";

import { db } from "@/lib/db";
import { accounts, emails, attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { uploadAttachment, buildObjectKey } from "@/lib/r2";
import { updateAccountSyncState } from "./account";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { SyncedEmail, SyncedAttachment } from "@/lib/providers/types";
import type { Account } from "@/lib/db/schema";
import {
  createEmailProvider,
  getUpdatedProviderCredentials,
} from "@/lib/providers/factory";

async function persistEmails(accountId: string, synced: SyncedEmail[]): Promise<number> {
  let count = 0;

  for (const mail of synced) {
    const emailId = nanoid();
    try {
      await db.insert(emails).values({
        id: emailId,
        accountId,
        remoteId: mail.remoteId,
        messageId: mail.messageId,
        subject: mail.subject,
        sender: mail.sender,
        recipients: JSON.stringify(mail.recipients),
        snippet: mail.snippet,
        bodyText: mail.bodyText,
        bodyHtml: mail.bodyHtml,
        isRead: 0,
        isStarred: 0,
        localDone: 0,
        localArchived: 0,
        localLabels: "[]",
        receivedAt: mail.receivedAt,
        folder: mail.folder,
      });
      count++;

      for (const att of mail.attachments) {
        await persistAttachment(accountId, emailId, att);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message?.includes("UNIQUE constraint")) {
        continue;
      }
      throw err;
    }
  }

  return count;
}

async function persistAttachment(
  accountId: string,
  emailId: string,
  att: SyncedAttachment
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

async function syncSingleAccount(account: Account) {
  const creds = JSON.parse(decrypt(account.credentials));
  const provider = createEmailProvider(account, creds);
  const result = await provider.sync(account.syncCursor, {
    limit: account.initialFetchLimit,
    metadataOnly: true,
  });
  const synced = await persistEmails(account.id, result.emails);
  const updatedCreds = getUpdatedProviderCredentials(account, provider);

  await updateAccountSyncState(account.id, result.newCursor, updatedCreds);
  return { synced };
}

export async function syncAccount(accountId: string): Promise<{ synced: number; error?: string }> {
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId));
  const account = rows[0];
  if (!account) return { synced: 0, error: "Account not found" };

  try {
    const { synced } = await syncSingleAccount(account);
    revalidatePath("/");
    revalidatePath("/accounts");
    return { synced };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Sync error for ${account.email}:`, error.message);
    return { synced: 0, error: error.message };
  }
}

export async function syncAll(): Promise<{ results: Array<{ email: string; synced: number; error?: string }> }> {
  const allAccounts = await db.select().from(accounts);
  const results: Array<{ email: string; synced: number; error?: string }> = [];

  for (const account of allAccounts) {
    try {
      const { synced } = await syncSingleAccount(account);
      results.push({ email: account.email, synced });
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Sync error for ${account.email}:`, error.message);
      results.push({ email: account.email, synced: 0, error: error.message });
    }
  }

  revalidatePath("/");
  revalidatePath("/accounts");
  return { results };
}
