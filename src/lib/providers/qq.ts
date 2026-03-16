import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type {
  EmailProvider,
  SendMailParams,
  SendMailResult,
  SyncOptions,
  SyncResult,
  SyncedAttachment,
  SyncedEmail,
} from "./types";

interface QQCredentials {
  email: string;
  authCode: string; // QQ 邮箱授权码
}

function formatAddresses(
  value:
    | Array<{ name?: string | null; address?: string | null }>
    | undefined
): string[] {
  return (value ?? [])
    .map((entry) => {
      const address = entry.address ?? "";
      if (!address) return "";
      return entry.name ? `${entry.name} <${address}>` : address;
    })
    .filter(Boolean);
}

function normalizeDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class QQProvider implements EmailProvider {
  private creds: QQCredentials;

  constructor(creds: QQCredentials) {
    this.creds = creds;
  }

  getCapabilities() {
    return { canSend: false };
  }

  async sendMail(_params: SendMailParams): Promise<SendMailResult> {
    return {
      ok: false,
      errorCode: "UNSUPPORTED",
      errorMessage: "QQ 邮箱暂不支持通过 Origami 发信。",
    };
  }

  async sync(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    const client = new ImapFlow({
      host: "imap.qq.com",
      port: 993,
      secure: true,
      auth: {
        user: this.creds.email,
        pass: this.creds.authCode,
      },
      logger: false,
    });

    const emails: SyncedEmail[] = [];
    const lastUid = cursor ? parseInt(cursor, 10) : 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        if (lastUid > 0) {
          const messages = client.fetch(
            `${lastUid + 1}:*`,
            {
              uid: true,
              envelope: true,
              internalDate: true,
              source: options.metadataOnly ? false : true,
            },
            { uid: true }
          );

          let maxUid = lastUid;
          let count = 0;
          const maxEmails = options.limit ?? 50;

          for await (const msg of messages) {
            if (msg.uid <= lastUid) continue;
            if (count >= maxEmails) break;

            const email = options.metadataOnly ?? true
              ? this.mapMetadataMessage(msg)
              : await this.mapFullMessage(msg.uid, msg.source, msg.internalDate);

            emails.push(email);
            if (msg.uid > maxUid) maxUid = msg.uid;
            count++;
          }

          return {
            emails,
            newCursor: maxUid > lastUid ? String(maxUid) : cursor,
          };
        }

        const allUids = (await client.search({ all: true }, { uid: true })) || [];
        const selectedUids = allUids.slice(-(options.limit ?? 200)).reverse();
        let maxUid = lastUid;

        for (const uid of selectedUids) {
          const msg = await client.fetchOne(
            uid,
            {
              uid: true,
              envelope: true,
              internalDate: true,
              source: options.metadataOnly ? false : true,
            },
            { uid: true }
          );

          if (!msg) continue;

          const email = options.metadataOnly ?? true
            ? this.mapMetadataMessage(msg)
            : await this.mapFullMessage(msg.uid, msg.source, msg.internalDate);

          emails.push(email);
          if (uid > maxUid) maxUid = uid;
        }

        return {
          emails,
          newCursor: maxUid > 0 ? String(maxUid) : cursor,
        };
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  async fetchMessage(remoteId: string): Promise<SyncedEmail | null> {
    const uid = parseInt(remoteId, 10);
    if (!Number.isFinite(uid)) return null;

    const client = new ImapFlow({
      host: "imap.qq.com",
      port: 993,
      secure: true,
      auth: {
        user: this.creds.email,
        pass: this.creds.authCode,
      },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        const msg = await client.fetchOne(
          uid,
          { uid: true, internalDate: true, source: true },
          { uid: true }
        );

        if (!msg || !msg.source) return null;
        return this.mapFullMessage(msg.uid, msg.source, msg.internalDate);
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  private mapMetadataMessage(msg: {
    uid: number;
    envelope?: {
      subject?: string;
      from?: Array<{ name?: string | null; address?: string | null }>;
      to?: Array<{ name?: string | null; address?: string | null }>;
      messageId?: string;
      date?: Date | string;
    };
    internalDate?: Date | string;
  }): SyncedEmail {
    const sender = formatAddresses(msg.envelope?.from)[0] ?? "";
    const recipients = formatAddresses(msg.envelope?.to);
    const internalDate = normalizeDate(msg.internalDate);
    const envelopeDate = normalizeDate(msg.envelope?.date);
    const receivedAt = internalDate
      ? Math.floor(internalDate.getTime() / 1000)
      : envelopeDate
        ? Math.floor(envelopeDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000);

    return {
      remoteId: String(msg.uid),
      messageId: msg.envelope?.messageId ?? `qq-${msg.uid}`,
      subject: msg.envelope?.subject ?? "(无主题)",
      sender,
      recipients,
      snippet: msg.envelope?.subject ?? "",
      bodyText: null,
      bodyHtml: null,
      receivedAt,
      folder: "INBOX",
      attachments: [],
    };
  }

  private async mapFullMessage(
    uid: number,
    source: Buffer | undefined,
    internalDate?: Date | string
  ): Promise<SyncedEmail> {
    const parsed = source ? await simpleParser(source) : null;
    const attachments: SyncedAttachment[] = (parsed?.attachments ?? []).map((att) => ({
      filename: att.filename ?? "untitled",
      contentType: att.contentType ?? "application/octet-stream",
      size: att.size,
      content: att.content,
    }));

    const normalizedInternalDate = normalizeDate(internalDate);

    return {
      remoteId: String(uid),
      messageId: parsed?.messageId ?? `qq-${uid}`,
      subject: parsed?.subject ?? "(无主题)",
      sender: parsed?.from?.text ?? "",
      recipients: parsed?.to
        ? Array.isArray(parsed.to)
          ? parsed.to.map((address) => address.text)
          : [parsed.to.text]
        : [],
      snippet: (parsed?.text ?? "").slice(0, 200),
      bodyText: parsed?.text ?? "",
      bodyHtml: parsed?.html || parsed?.textAsHtml || "",
      receivedAt: parsed?.date
        ? Math.floor(parsed.date.getTime() / 1000)
        : normalizedInternalDate
          ? Math.floor(normalizedInternalDate.getTime() / 1000)
          : Math.floor(Date.now() / 1000),
      folder: "INBOX",
      attachments,
    };
  }
}
