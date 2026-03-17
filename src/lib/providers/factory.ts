import { encrypt } from "@/lib/crypto";
import type { Account } from "@/lib/db/schema";
import { resolveGmailOAuthApp, resolveOutlookOAuthApp } from "@/lib/oauth-apps";
import type { EmailProvider } from "./types";
import { QQProvider } from "./qq";
import { GmailProvider } from "./gmail";
import { OutlookProvider } from "./outlook";
import { ImapSmtpProvider } from "./imap-smtp/provider";
import { resolveImapSmtpConfigFromAccount } from "./imap-smtp/account-config";

export async function createEmailProvider(
  account: Account,
  creds: Record<string, unknown>
): Promise<EmailProvider> {
  switch (account.provider) {
    case "qq":
      return new QQProvider({
        email: String(creds.email ?? account.email),
        authCode: String(creds.authCode ?? creds.authPass ?? ""),
      });
    case "imap_smtp":
      return new ImapSmtpProvider(resolveImapSmtpConfigFromAccount(account, creds));
    case "gmail": {
      const oauthApp = await resolveGmailOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
      return new GmailProvider({
        accessToken: String(creds.accessToken ?? ""),
        refreshToken: String(creds.refreshToken ?? ""),
        scopes: Array.isArray(creds.scopes) ? creds.scopes.map(String) : [],
        appId: oauthApp.appId,
        oauthApp,
      });
    }
    case "outlook": {
      const oauthApp = await resolveOutlookOAuthApp(account.oauthAppId ?? String(creds.appId ?? "default"));
      return new OutlookProvider({
        accessToken: String(creds.accessToken ?? ""),
        refreshToken: String(creds.refreshToken ?? ""),
        scopes: Array.isArray(creds.scopes) ? creds.scopes.map(String) : [],
        appId: oauthApp.appId,
        oauthApp,
      });
    }
    default:
      throw new Error(`Unknown provider: ${account.provider}`);
  }
}

export function getUpdatedProviderCredentials(
  account: Account,
  provider: EmailProvider
): string | undefined {
  if (account.provider === "gmail") {
    const updated = (provider as GmailProvider).getUpdatedTokens();
    return encrypt(JSON.stringify(updated));
  }

  if (account.provider === "outlook") {
    const updated = (provider as OutlookProvider).getUpdatedTokens();
    return encrypt(JSON.stringify(updated));
  }

  return undefined;
}
