import type { AppLocale } from "@/i18n/locale";
import type { EmailProvider, SendMailParams, SendMailResult, SyncOptions, SyncResult, SyncedEmail } from "./types";
import { resolveImapSmtpConfigFromAccount } from "./imap-smtp/account-config";
import { ImapSmtpProvider } from "./imap-smtp/provider";

interface QQCredentials {
  email: string;
  authCode: string;
}

export class QQProvider implements EmailProvider {
  private delegate: ImapSmtpProvider;

  constructor(creds: QQCredentials) {
    this.delegate = new ImapSmtpProvider(
      resolveImapSmtpConfigFromAccount(
        {
          id: "qq-provider-runtime",
          provider: "qq",
          email: creds.email,
          displayName: creds.email,
          credentials: "",
          oauthAppId: null,
          presetKey: "qq",
          authUser: creds.email,
          imapHost: null,
          imapPort: null,
          imapSecure: 1,
          smtpHost: null,
          smtpPort: null,
          smtpSecure: 1,
          syncCursor: null,
          syncReadBack: 0,
          syncStarBack: 0,
          initialFetchLimit: 200,
          lastSyncedAt: null,
          createdAt: 0,
        },
        {
          email: creds.email,
          authCode: creds.authCode,
          presetKey: "qq",
        }
      )
    );
  }

  getCapabilities(locale?: AppLocale) {
    return this.delegate.getCapabilities(locale);
  }

  sendMail(params: SendMailParams): Promise<SendMailResult> {
    return this.delegate.sendMail(params);
  }

  syncEmails(cursor: string | null, options?: SyncOptions): Promise<SyncResult> {
    return this.delegate.syncEmails(cursor, options);
  }

  fetchEmail(remoteId: string): Promise<SyncedEmail | null> {
    return this.delegate.fetchEmail(remoteId);
  }

  markMessageRead(remoteId: string): Promise<void> {
    return this.delegate.markMessageRead(remoteId);
  }

  setMessageStarred(remoteId: string, starred: boolean): Promise<void> {
    return this.delegate.setMessageStarred(remoteId, starred);
  }
}
