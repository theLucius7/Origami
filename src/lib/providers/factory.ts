import { encrypt } from "@/lib/crypto";
import type { Account } from "@/lib/db/schema";
import type { EmailProvider } from "./types";
import { QQProvider } from "./qq";
import { GmailProvider } from "./gmail";
import { OutlookProvider } from "./outlook";

export function createEmailProvider(
  account: Account,
  creds: Record<string, string>
): EmailProvider {
  switch (account.provider) {
    case "qq":
      return new QQProvider({ email: creds.email, authCode: creds.authCode });
    case "gmail":
      return new GmailProvider({
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
      });
    case "outlook":
      return new OutlookProvider({
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
      });
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
