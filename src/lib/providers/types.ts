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

export interface EmailProvider {
  sync(cursor: string | null, options?: SyncOptions): Promise<SyncResult>;
  fetchMessage(remoteId: string): Promise<SyncedEmail | null>;
}
