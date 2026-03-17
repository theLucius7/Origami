import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ActionError } from "@/lib/actions";
import { getAccountWithProvider, persistProviderCredentialsIfNeeded } from "@/lib/account-providers";
import { db } from "@/lib/db";
import { accounts, attachments, emails, type Account } from "@/lib/db/schema";
import type { SyncedAttachment, SyncedEmail } from "@/lib/providers/types";
import { buildObjectKey, uploadAttachment } from "@/lib/r2";
import { getAccountRecordById, listAccounts } from "@/lib/queries/accounts";

async function persistAttachment(accountId: string, emailId: string, att: SyncedAttachment) {
  if (!att.content || att.content.length === 0) {
    return;
  }

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

async function findExistingEmail(accountId: string, messageId: string) {
  const rows = await db
    .select({ id: emails.id })
    .from(emails)
    .where(and(eq(emails.accountId, accountId), eq(emails.messageId, messageId)))
    .limit(1);

  return rows[0]?.id ?? null;
}

function buildEmailRow(accountId: string, mail: SyncedEmail) {
  return {
    accountId,
    remoteId: mail.remoteId,
    messageId: mail.messageId,
    subject: mail.subject,
    sender: mail.sender,
    recipients: JSON.stringify(mail.recipients),
    snippet: mail.snippet,
    isRead: mail.isRead ? 1 : 0,
    isStarred: mail.isStarred ? 1 : 0,
    receivedAt: mail.receivedAt,
    folder: mail.folder,
  };
}

function buildHydrationState(mail: SyncedEmail) {
  const hasHydratedPayload = mail.bodyText !== null || mail.bodyHtml !== null;

  if (!hasHydratedPayload) {
    return {
      hydrationStatus: "metadata",
      hydratedAt: null,
      hydrationError: null,
    };
  }

  return {
    hydrationStatus: "hydrated",
    hydratedAt: Math.floor(Date.now() / 1000),
    hydrationError: null,
  };
}

async function upsertEmail(accountId: string, mail: SyncedEmail) {
  const emailId = nanoid();
  const emailRow = buildEmailRow(accountId, mail);

  try {
    await db.insert(emails).values({
      id: emailId,
      ...emailRow,
      bodyText: mail.bodyText,
      bodyHtml: mail.bodyHtml,
      ...buildHydrationState(mail),
      localDone: 0,
      localArchived: 0,
      localLabels: "[]",
    });

    return { emailId, inserted: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("UNIQUE constraint")) {
      throw error;
    }

    const existingEmailId = await findExistingEmail(accountId, mail.messageId);
    if (!existingEmailId) {
      return { emailId, inserted: false };
    }

    await db
      .update(emails)
      .set({
        ...emailRow,
        ...(mail.bodyText !== null || mail.bodyHtml !== null
          ? {
              bodyText: mail.bodyText,
              bodyHtml: mail.bodyHtml,
              ...buildHydrationState(mail),
            }
          : {}),
      })
      .where(eq(emails.id, existingEmailId));

    return { emailId: existingEmailId, inserted: false };
  }
}

async function persistEmails(accountId: string, synced: SyncedEmail[]): Promise<number> {
  let insertedCount = 0;

  for (const mail of synced) {
    const { emailId, inserted } = await upsertEmail(accountId, mail);
    if (inserted) insertedCount++;

    for (const att of mail.attachments) {
      await persistAttachment(accountId, emailId, att);
    }
  }

  return insertedCount;
}

async function updateAccountSyncState(id: string, syncCursor: string | null) {
  await db
    .update(accounts)
    .set({
      syncCursor,
      lastSyncedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(accounts.id, id));
}

export async function syncSingleAccount(account: Account) {
  const resolved = await getAccountWithProvider(account.id);
  if (!resolved) {
    throw new ActionError("NOT_FOUND", "Account not found");
  }

  const { provider } = resolved;
  const result = await provider.syncEmails(account.syncCursor, {
    limit: account.initialFetchLimit,
    metadataOnly: true,
  });
  const synced = await persistEmails(account.id, result.emails);

  await updateAccountSyncState(account.id, result.newCursor);
  await persistProviderCredentialsIfNeeded(account, provider);

  return { synced };
}

export async function syncAccountById(accountId: string) {
  const account = await getAccountRecordById(accountId);
  if (!account) {
    throw new ActionError("NOT_FOUND", "Account not found");
  }

  return syncSingleAccount(account);
}

export async function syncAllAccounts() {
  const accountList = await listAccounts();
  const results: Array<{ email: string; synced: number; error?: string }> = [];

  for (const account of accountList) {
    try {
      const { synced } = await syncSingleAccount(account);
      results.push({ email: account.email, synced });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Sync error for ${account.email}:`, message);
      results.push({ email: account.email, synced: 0, error: message });
    }
  }

  return { results };
}
