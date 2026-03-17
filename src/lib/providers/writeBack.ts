import { parseAccountCredentials, persistProviderCredentialsIfNeeded } from "@/lib/account-providers";
import type { Account } from "@/lib/db/schema";
import { resolveGmailOAuthApp, resolveOutlookOAuthApp } from "@/lib/oauth-apps";
import { GmailProvider, GMAIL_MODIFY_SCOPE, hasGmailModifyScope } from "./gmail";
import { OutlookProvider, OUTLOOK_REQUIRED_WRITEBACK_SCOPE, hasOutlookWriteBackScope } from "./outlook";
import { QQProvider } from "./qq";
import { ImapSmtpProvider } from "./imap-smtp/provider";
import { resolveImapSmtpConfigFromAccount } from "./imap-smtp/account-config";

export interface WriteBackResult {
  success: boolean;
  skipped: boolean;
  error?: string;
}

export interface AccountWriteBackAvailability {
  canWriteBackRead: boolean;
  canWriteBackStar: boolean;
  readBackNotice: string | null;
  starBackNotice: string | null;
}

function logWriteBackWarning(account: Account, action: string, reason: string) {
  console.warn(`[writeback:${action}] ${account.provider}:${account.email} - ${reason}`);
}

function tryParseCredentials(account: Account) {
  try {
    return parseAccountCredentials(account);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "credentials", message);
    return null;
  }
}

function getGmailScopes(account: Account): string[] {
  const creds = tryParseCredentials(account);
  return Array.isArray(creds?.scopes) ? creds.scopes.map(String) : [];
}

function getOutlookScopes(account: Account): string[] {
  const creds = tryParseCredentials(account);
  return Array.isArray(creds?.scopes) ? creds.scopes.map(String) : [];
}

function createImapSmtpProviderForAccount(account: Account) {
  const creds = tryParseCredentials(account);
  if (!creds) return null;

  return new ImapSmtpProvider(resolveImapSmtpConfigFromAccount(account, creds));
}

export function getAccountWriteBackAvailability(account: Account): AccountWriteBackAvailability {
  switch (account.provider) {
    case "gmail": {
      const hasScope = hasGmailModifyScope(getGmailScopes(account));
      const notice = hasScope
        ? null
        : `需要重新授权以启用写回功能（需要 Gmail 修改权限：${GMAIL_MODIFY_SCOPE}）`;

      return {
        canWriteBackRead: hasScope,
        canWriteBackStar: hasScope,
        readBackNotice: notice,
        starBackNotice: notice,
      };
    }

    case "outlook": {
      const hasScope = hasOutlookWriteBackScope(getOutlookScopes(account));
      const notice = hasScope
        ? null
        : `需要重新授权以启用写回功能（需要 Outlook Delegated 权限：${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}）`;

      return {
        canWriteBackRead: hasScope,
        canWriteBackStar: hasScope,
        readBackNotice: notice,
        starBackNotice: notice,
      };
    }

    case "qq":
    case "imap_smtp":
      return {
        canWriteBackRead: true,
        canWriteBackStar: true,
        readBackNotice: null,
        starBackNotice: null,
      };

    default:
      return {
        canWriteBackRead: false,
        canWriteBackStar: false,
        readBackNotice: "当前 provider 不支持已读写回。",
        starBackNotice: "当前 provider 不支持星标写回。",
      };
  }
}

async function writeBackReadGmail(account: Account, remoteMessageId: string): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const scopes = Array.isArray(creds.scopes) ? creds.scopes.map(String) : [];
  if (!hasGmailModifyScope(scopes)) {
    logWriteBackWarning(account, "read", `missing scope ${GMAIL_MODIFY_SCOPE}`);
    return { success: false, skipped: true, error: `missing scope ${GMAIL_MODIFY_SCOPE}` };
  }

  const oauthApp = await resolveGmailOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
  const provider = new GmailProvider({
    accessToken: String(creds.accessToken ?? ""),
    refreshToken: String(creds.refreshToken ?? ""),
    scopes,
    appId: oauthApp.appId,
    oauthApp,
  });

  try {
    await provider.markMessageRead(remoteMessageId);
    await persistProviderCredentialsIfNeeded(account, provider);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "read", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackStarGmail(
  account: Account,
  remoteMessageId: string,
  starred: boolean
): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const scopes = Array.isArray(creds.scopes) ? creds.scopes.map(String) : [];
  if (!hasGmailModifyScope(scopes)) {
    logWriteBackWarning(account, "star", `missing scope ${GMAIL_MODIFY_SCOPE}`);
    return { success: false, skipped: true, error: `missing scope ${GMAIL_MODIFY_SCOPE}` };
  }

  const oauthApp = await resolveGmailOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
  const provider = new GmailProvider({
    accessToken: String(creds.accessToken ?? ""),
    refreshToken: String(creds.refreshToken ?? ""),
    scopes,
    appId: oauthApp.appId,
    oauthApp,
  });

  try {
    await provider.setMessageStarred(remoteMessageId, starred);
    await persistProviderCredentialsIfNeeded(account, provider);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "star", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackReadOutlook(account: Account, remoteMessageId: string): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const scopes = Array.isArray(creds.scopes) ? creds.scopes.map(String) : [];
  if (!hasOutlookWriteBackScope(scopes)) {
    logWriteBackWarning(account, "read", `missing scope ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}`);
    return {
      success: false,
      skipped: true,
      error: `missing scope ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}`,
    };
  }

  const oauthApp = await resolveOutlookOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
  const provider = new OutlookProvider({
    accessToken: String(creds.accessToken ?? ""),
    refreshToken: String(creds.refreshToken ?? ""),
    scopes,
    appId: oauthApp.appId,
    oauthApp,
  });

  try {
    await provider.markMessageRead(remoteMessageId);
    await persistProviderCredentialsIfNeeded(account, provider);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "read", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackStarOutlook(
  account: Account,
  remoteMessageId: string,
  starred: boolean
): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const scopes = Array.isArray(creds.scopes) ? creds.scopes.map(String) : [];
  if (!hasOutlookWriteBackScope(scopes)) {
    logWriteBackWarning(account, "star", `missing scope ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}`);
    return {
      success: false,
      skipped: true,
      error: `missing scope ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}`,
    };
  }

  const oauthApp = await resolveOutlookOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
  const provider = new OutlookProvider({
    accessToken: String(creds.accessToken ?? ""),
    refreshToken: String(creds.refreshToken ?? ""),
    scopes,
    appId: oauthApp.appId,
    oauthApp,
  });

  try {
    await provider.setMessageStarred(remoteMessageId, starred);
    await persistProviderCredentialsIfNeeded(account, provider);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "star", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackReadQq(account: Account, remoteMessageId: string): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const provider = new QQProvider({
    email: String(creds.email ?? account.email),
    authCode: String(creds.authCode ?? creds.authPass ?? ""),
  });

  try {
    await provider.markMessageRead(remoteMessageId);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "read", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackStarQq(
  account: Account,
  remoteMessageId: string,
  starred: boolean
): Promise<WriteBackResult> {
  const creds = tryParseCredentials(account);
  if (!creds) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  const provider = new QQProvider({
    email: String(creds.email ?? account.email),
    authCode: String(creds.authCode ?? creds.authPass ?? ""),
  });

  try {
    await provider.setMessageStarred(remoteMessageId, starred);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "star", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackReadImapSmtp(account: Account, remoteMessageId: string): Promise<WriteBackResult> {
  const provider = createImapSmtpProviderForAccount(account);
  if (!provider) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  try {
    await provider.markMessageRead(remoteMessageId);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "read", message);
    return { success: false, skipped: false, error: message };
  }
}

async function writeBackStarImapSmtp(
  account: Account,
  remoteMessageId: string,
  starred: boolean
): Promise<WriteBackResult> {
  const provider = createImapSmtpProviderForAccount(account);
  if (!provider) {
    return { success: false, skipped: true, error: "invalid credentials" };
  }

  try {
    await provider.setMessageStarred(remoteMessageId, starred);
    return { success: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWriteBackWarning(account, "star", message);
    return { success: false, skipped: false, error: message };
  }
}

export async function writeBackRead(
  account: Account,
  remoteMessageId: string
): Promise<WriteBackResult> {
  if (!account.syncReadBack) {
    return { success: false, skipped: true };
  }

  if (!remoteMessageId) {
    return { success: false, skipped: true, error: "missing remoteMessageId" };
  }

  switch (account.provider) {
    case "gmail":
      return writeBackReadGmail(account, remoteMessageId);
    case "outlook":
      return writeBackReadOutlook(account, remoteMessageId);
    case "qq":
      return writeBackReadQq(account, remoteMessageId);
    case "imap_smtp":
      return writeBackReadImapSmtp(account, remoteMessageId);
    default:
      return { success: false, skipped: true, error: `unsupported provider: ${account.provider}` };
  }
}

export async function writeBackStar(
  account: Account,
  remoteMessageId: string,
  starred: boolean
): Promise<WriteBackResult> {
  if (!account.syncStarBack) {
    return { success: false, skipped: true };
  }

  if (!remoteMessageId) {
    return { success: false, skipped: true, error: "missing remoteMessageId" };
  }

  switch (account.provider) {
    case "gmail":
      return writeBackStarGmail(account, remoteMessageId, starred);
    case "outlook":
      return writeBackStarOutlook(account, remoteMessageId, starred);
    case "qq":
      return writeBackStarQq(account, remoteMessageId, starred);
    case "imap_smtp":
      return writeBackStarImapSmtp(account, remoteMessageId, starred);
    default:
      return { success: false, skipped: true, error: `unsupported provider: ${account.provider}` };
  }
}
