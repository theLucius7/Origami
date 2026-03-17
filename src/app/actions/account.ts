"use server";

import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { runLoggedAction } from "@/lib/actions";
import { listSendCapableAccounts } from "@/lib/account-providers";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { accounts, attachments, emails, type Account } from "@/lib/db/schema";
import { getMailboxPreset } from "@/lib/providers/imap-smtp/presets";
import { getAccountWriteBackAvailability } from "@/lib/providers/writeBack";
import { getAccountRecordById, listAccounts } from "@/lib/queries/accounts";
import { deleteAttachment } from "@/lib/r2";
import { revalidateAccountPages } from "@/lib/revalidate";

export async function getAccounts() {
  return listAccounts();
}

export async function getAccountById(id: string) {
  return getAccountRecordById(id);
}

export async function getSendCapableAccounts() {
  return listSendCapableAccounts();
}

type MailboxAccountProvider = "qq" | "imap_smtp";

interface BaseMailboxAccountInput {
  displayName?: string;
  authUser?: string;
  authPass?: string;
  presetKey: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
}

interface AddImapSmtpAccountInput extends BaseMailboxAccountInput {
  email: string;
  authPass: string;
  initialFetchLimit?: number;
}

interface UpdateMailboxAccountInput extends BaseMailboxAccountInput {
  id: string;
}

interface ResolvedMailboxConfig {
  displayName: string;
  presetKey: string;
  authUser: string;
  authPass: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

function parseAccountCredentials(account: Account) {
  return JSON.parse(decrypt(account.credentials)) as Record<string, unknown>;
}

function validateInitialFetchLimit(initialFetchLimit: number) {
  if (![50, 200, 1000].includes(initialFetchLimit)) {
    throw new Error("Unsupported initial fetch limit");
  }
}

function normalizePort(value: number | undefined, fallback: number, label: string): number {
  const port = value ?? fallback;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${label} 端口无效`);
  }
  return port;
}

function resolveMailboxConfig(params: {
  accountEmail: string;
  provider: MailboxAccountProvider;
  input: BaseMailboxAccountInput;
  fallbackAuthPass?: string;
}): ResolvedMailboxConfig {
  const presetKey = params.provider === "qq" ? "qq" : params.input.presetKey;
  const preset = getMailboxPreset(presetKey);
  if (!preset) {
    throw new Error("Unsupported mailbox preset");
  }

  const displayName = params.input.displayName?.trim() || params.accountEmail;
  const authUser = (params.input.authUser?.trim() || params.accountEmail).trim();
  const authPass = params.input.authPass?.trim() || params.fallbackAuthPass?.trim() || "";

  if (!authUser) throw new Error("登录用户名不能为空");
  if (!authPass) throw new Error("授权码或密码不能为空");

  const isCustom = presetKey === "custom";
  const imapHost = (params.input.imapHost ?? preset.imapHost).trim();
  const smtpHost = (params.input.smtpHost ?? preset.smtpHost).trim();
  const imapPort = normalizePort(params.input.imapPort, preset.imapPort, "IMAP");
  const smtpPort = normalizePort(params.input.smtpPort, preset.smtpPort, "SMTP");
  const imapSecure = params.input.imapSecure ?? preset.secure;
  const smtpSecure = params.input.smtpSecure ?? preset.secure;

  if (isCustom) {
    if (!imapHost || !smtpHost) {
      throw new Error("自定义 IMAP/SMTP 账号必须填写服务器地址");
    }
  }

  return {
    displayName,
    presetKey,
    authUser,
    authPass,
    imapHost,
    imapPort,
    imapSecure,
    smtpHost,
    smtpPort,
    smtpSecure,
  };
}

function buildMailboxCredentials(
  provider: MailboxAccountProvider,
  email: string,
  config: ResolvedMailboxConfig
) {
  if (provider === "qq") {
    return encrypt(
      JSON.stringify({
        email,
        authCode: config.authPass,
        presetKey: "qq",
        authUser: config.authUser,
      })
    );
  }

  return encrypt(
    JSON.stringify({
      authUser: config.authUser,
      authPass: config.authPass,
      presetKey: config.presetKey,
    })
  );
}

function shouldResetMailboxSync(account: Account, next: ResolvedMailboxConfig) {
  return (
    (account.presetKey ?? (account.provider === "qq" ? "qq" : null)) !== next.presetKey ||
    (account.authUser ?? account.email) !== next.authUser ||
    (account.imapHost ?? "") !== next.imapHost ||
    (account.imapPort ?? 0) !== next.imapPort ||
    Boolean(account.imapSecure) !== next.imapSecure ||
    (account.smtpHost ?? "") !== next.smtpHost ||
    (account.smtpPort ?? 0) !== next.smtpPort ||
    Boolean(account.smtpSecure) !== next.smtpSecure
  );
}

export async function addImapSmtpAccount(input: AddImapSmtpAccountInput) {
  return runLoggedAction("addImapSmtpAccount", async () => {
    const initialFetchLimit = input.initialFetchLimit ?? 200;
    validateInitialFetchLimit(initialFetchLimit);

    const email = input.email.trim();
    if (!email) throw new Error("邮箱地址不能为空");

    const config = resolveMailboxConfig({
      accountEmail: email,
      provider: "imap_smtp",
      input,
    });

    const id = nanoid();
    const creds = buildMailboxCredentials("imap_smtp", email, config);

    await db.insert(accounts).values({
      id,
      provider: "imap_smtp",
      email,
      displayName: config.displayName,
      credentials: creds,
      presetKey: config.presetKey,
      authUser: config.authUser,
      imapHost: config.imapHost || null,
      imapPort: config.imapPort,
      imapSecure: config.imapSecure ? 1 : 0,
      smtpHost: config.smtpHost || null,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure ? 1 : 0,
      initialFetchLimit,
    });

    revalidateAccountPages();
    return id;
  });
}

export async function updateMailboxAccount(input: UpdateMailboxAccountInput) {
  return runLoggedAction("updateMailboxAccount", async () => {
    const account = await getAccountRecordById(input.id);
    if (!account) {
      throw new Error("账号不存在");
    }

    if (account.provider !== "qq" && account.provider !== "imap_smtp") {
      throw new Error("当前账号类型不支持编辑 IMAP/SMTP 凭据");
    }

    const currentCreds = parseAccountCredentials(account);
    const config = resolveMailboxConfig({
      accountEmail: account.email,
      provider: account.provider,
      input,
      fallbackAuthPass: String(currentCreds.authPass ?? currentCreds.authCode ?? ""),
    });

    const nextCredentials = buildMailboxCredentials(account.provider, account.email, config);
    const patch: Partial<typeof accounts.$inferInsert> = {
      displayName: config.displayName,
      credentials: nextCredentials,
      authUser: config.authUser,
      presetKey: config.presetKey,
    };

    if (account.provider === "imap_smtp") {
      patch.imapHost = config.imapHost || null;
      patch.imapPort = config.imapPort;
      patch.imapSecure = config.imapSecure ? 1 : 0;
      patch.smtpHost = config.smtpHost || null;
      patch.smtpPort = config.smtpPort;
      patch.smtpSecure = config.smtpSecure ? 1 : 0;

      if (shouldResetMailboxSync(account, config)) {
        patch.syncCursor = null;
        patch.lastSyncedAt = null;
      }
    }

    await db.update(accounts).set(patch).where(eq(accounts.id, account.id));
    revalidateAccountPages();
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

    const normalizedEmail = email.trim();
    const config = resolveMailboxConfig({
      accountEmail: normalizedEmail,
      provider: "qq",
      input: {
        displayName,
        authUser: normalizedEmail,
        authPass: authCode,
        presetKey: "qq",
      },
    });

    const id = nanoid();
    const creds = buildMailboxCredentials("qq", normalizedEmail, config);

    await db.insert(accounts).values({
      id,
      provider: "qq",
      email: normalizedEmail,
      displayName: config.displayName,
      credentials: creds,
      presetKey: "qq",
      authUser: config.authUser,
      initialFetchLimit,
    });

    revalidateAccountPages();
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
  initialFetchLimit = 200,
  oauthAppId?: string
) {
  return runLoggedAction("addOAuthAccount", async () => {
    validateInitialFetchLimit(initialFetchLimit);
    const id = nanoid();
    const creds = encrypt(JSON.stringify({ accessToken, refreshToken, scopes }));
    const resolvedOauthAppId = oauthAppId?.trim() || null;

    await db
      .insert(accounts)
      .values({
        id,
        provider,
        email,
        displayName: displayName ?? email,
        credentials: creds,
        oauthAppId: resolvedOauthAppId,
        initialFetchLimit,
      })
      .onConflictDoUpdate({
        target: accounts.email,
        set: { credentials: creds, displayName, oauthAppId: resolvedOauthAppId },
      });

    revalidateAccountPages();
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

    revalidateAccountPages();
  });
}

function buildEligibleWriteBackPatch(
  account: Account,
  settings: { syncReadBack?: boolean; syncStarBack?: boolean }
) {
  const availability = getAccountWriteBackAvailability(account);
  const patch: { syncReadBack?: number; syncStarBack?: number } = {};

  if (settings.syncReadBack !== undefined) {
    if (!settings.syncReadBack || availability.canWriteBackRead) {
      patch.syncReadBack = settings.syncReadBack ? 1 : 0;
    }
  }

  if (settings.syncStarBack !== undefined) {
    if (!settings.syncStarBack || availability.canWriteBackStar) {
      patch.syncStarBack = settings.syncStarBack ? 1 : 0;
    }
  }

  return patch;
}

export async function updateAccountWriteBackSettings(
  id: string,
  settings: { syncReadBack?: boolean; syncStarBack?: boolean }
) {
  return runLoggedAction("updateAccountWriteBackSettings", async () => {
    const account = await getAccountRecordById(id);
    if (!account) {
      throw new Error("账号不存在");
    }

    const patch = buildEligibleWriteBackPatch(account, settings);
    if (Object.keys(patch).length === 0) return { updated: false, skipped: true };

    await db.update(accounts).set(patch).where(eq(accounts.id, id));
    revalidateAccountPages();
    return { updated: true, skipped: false };
  });
}

export async function updateAllAccountsWriteBackSettings(settings: {
  syncReadBack?: boolean;
  syncStarBack?: boolean;
}) {
  return runLoggedAction("updateAllAccountsWriteBackSettings", async () => {
    const accountList = await listAccounts();
    let updated = 0;
    let skipped = 0;

    for (const account of accountList) {
      const patch = buildEligibleWriteBackPatch(account, settings);
      if (Object.keys(patch).length === 0) {
        skipped += 1;
        continue;
      }

      await db.update(accounts).set(patch).where(eq(accounts.id, account.id));
      updated += 1;
    }

    if (updated > 0) {
      revalidateAccountPages();
    }

    return { updated, skipped };
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
    revalidateAccountPages();
  });
}
