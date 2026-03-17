"use server";

import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { runLoggedAction } from "@/lib/actions";
import { listSendCapableAccounts } from "@/lib/account-providers";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { accounts, attachments, emails } from "@/lib/db/schema";
import { getMailboxPreset } from "@/lib/providers/imap-smtp/presets";
import { getAccountRecordById, listAccounts } from "@/lib/queries/accounts";
import { deleteAttachment } from "@/lib/r2";

export async function getAccounts() {
  return listAccounts();
}

export async function getAccountById(id: string) {
  return getAccountRecordById(id);
}

export async function getSendCapableAccounts() {
  return listSendCapableAccounts();
}

interface AddImapSmtpAccountInput {
  email: string;
  authPass: string;
  displayName?: string;
  authUser?: string;
  presetKey: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  initialFetchLimit?: number;
}

function validateInitialFetchLimit(initialFetchLimit: number) {
  if (![50, 200, 1000].includes(initialFetchLimit)) {
    throw new Error("Unsupported initial fetch limit");
  }
}

export async function addImapSmtpAccount(input: AddImapSmtpAccountInput) {
  return runLoggedAction("addImapSmtpAccount", async () => {
    const preset = getMailboxPreset(input.presetKey);
    if (!preset) {
      throw new Error("Unsupported mailbox preset");
    }

    const initialFetchLimit = input.initialFetchLimit ?? 200;
    validateInitialFetchLimit(initialFetchLimit);

    const email = input.email.trim();
    const authUser = (input.authUser || email).trim();
    const authPass = input.authPass.trim();

    if (!email) throw new Error("邮箱地址不能为空");
    if (!authPass) throw new Error("授权码或密码不能为空");

    const isCustom = input.presetKey === "custom";
    const imapHost = (input.imapHost ?? preset.imapHost).trim();
    const smtpHost = (input.smtpHost ?? preset.smtpHost).trim();
    const imapPort = input.imapPort ?? preset.imapPort;
    const smtpPort = input.smtpPort ?? preset.smtpPort;
    const imapSecure = input.imapSecure ?? preset.secure;
    const smtpSecure = input.smtpSecure ?? preset.secure;

    if (isCustom) {
      if (!imapHost || !smtpHost) {
        throw new Error("自定义 IMAP/SMTP 账号必须填写服务器地址");
      }
    }

    const id = nanoid();
    const creds = encrypt(JSON.stringify({ authUser, authPass, presetKey: input.presetKey }));

    await db.insert(accounts).values({
      id,
      provider: "imap_smtp",
      email,
      displayName: input.displayName?.trim() || email,
      credentials: creds,
      presetKey: input.presetKey,
      authUser,
      imapHost: imapHost || null,
      imapPort,
      imapSecure: imapSecure ? 1 : 0,
      smtpHost: smtpHost || null,
      smtpPort,
      smtpSecure: smtpSecure ? 1 : 0,
      initialFetchLimit,
    });

    return id;
  });
}

export async function addQQAccount(
  email: string,
  authCode: string,
  displayName?: string,
  initialFetchLimit = 200
) {
  return runLoggedAction("addQQAccount", async () => {
    validateInitialFetchLimit(initialFetchLimit);
    const id = nanoid();
    const creds = encrypt(JSON.stringify({ email, authCode, presetKey: "qq", authUser: email }));

    await db.insert(accounts).values({
      id,
      provider: "qq",
      email,
      displayName: displayName ?? email,
      credentials: creds,
      presetKey: "qq",
      authUser: email,
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
    validateInitialFetchLimit(initialFetchLimit);
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
    validateInitialFetchLimit(initialFetchLimit);

    await db
      .update(accounts)
      .set({ initialFetchLimit })
      .where(eq(accounts.id, id));
  });
}

export async function updateAccountWriteBackSettings(
  id: string,
  settings: { syncReadBack?: boolean; syncStarBack?: boolean }
) {
  return runLoggedAction("updateAccountWriteBackSettings", async () => {
    const patch: { syncReadBack?: number; syncStarBack?: number } = {};

    if (settings.syncReadBack !== undefined) {
      patch.syncReadBack = settings.syncReadBack ? 1 : 0;
    }

    if (settings.syncStarBack !== undefined) {
      patch.syncStarBack = settings.syncStarBack ? 1 : 0;
    }

    if (Object.keys(patch).length === 0) return;

    await db.update(accounts).set(patch).where(eq(accounts.id, id));
  });
}

export async function updateAllAccountsWriteBackSettings(settings: {
  syncReadBack?: boolean;
  syncStarBack?: boolean;
}) {
  return runLoggedAction("updateAllAccountsWriteBackSettings", async () => {
    const patch: { syncReadBack?: number; syncStarBack?: number } = {};

    if (settings.syncReadBack !== undefined) {
      patch.syncReadBack = settings.syncReadBack ? 1 : 0;
    }

    if (settings.syncStarBack !== undefined) {
      patch.syncStarBack = settings.syncStarBack ? 1 : 0;
    }

    if (Object.keys(patch).length === 0) return;

    await db.update(accounts).set(patch);
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
