export interface SyncedEmail {
  remoteId: string;
  messageId: string;
  subject: string;
  sender: string;
  recipients: string[];
  snippet: string;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: number; // unix timestamp
  folder: string;
  attachments: SyncedAttachment[];
}

export interface SyncedAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface SyncResult {
  emails: SyncedEmail[];
  newCursor: string | null;
}

export interface SyncOptions {
  limit?: number;
  metadataOnly?: boolean;
}

export interface ProviderCapabilities {
  canSend: boolean;
}

export interface SendMailParams {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textBody: string;
  htmlBody?: string | null;
  attachments?: SyncedAttachment[];
}

export type SendMailErrorCode =
  | "UNSUPPORTED"
  | "VALIDATION"
  | "AUTH_EXPIRED"
  | "INSUFFICIENT_SCOPE"
  | "RATE_LIMITED"
  | "NETWORK"
  | "PROVIDER_ERROR";

export type SendMailResult =
  | {
      ok: true;
      providerMessageId: string | null;
      sentAt: number;
    }
  | {
      ok: false;
      errorCode: SendMailErrorCode;
      errorMessage: string;
      providerRawError?: string;
    };

export interface EmailProvider {
  syncEmails(cursor: string | null, options?: SyncOptions): Promise<SyncResult>;
  fetchEmail(remoteId: string): Promise<SyncedEmail | null>;
  getCapabilities(): ProviderCapabilities;
  sendMail(params: SendMailParams): Promise<SendMailResult>;
}
