import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { getQqProviderConfig } from "@/config/providers.server";
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

  private createImapClient() {
    const config = getQqProviderConfig();
    return new ImapFlow({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      auth: {
        user: this.creds.email,
        pass: this.creds.authCode,
      },
      logger: false,
    });
  }

  private createSmtpTransport() {
    const config = getQqProviderConfig();
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: this.creds.email,
        pass: this.creds.authCode,
      },
    });
  }

  private async withInboxClient<T>(fn: (client: ImapFlow) => Promise<T>): Promise<T> {
    const client = this.createImapClient();

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        return await fn(client);
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  getCapabilities() {
    return { canSend: true };
  }

  async sendMail(params: SendMailParams): Promise<SendMailResult> {
    if (params.to.length === 0) {
      return {
        ok: false,
        errorCode: "VALIDATION",
        errorMessage: "至少需要一个收件人。",
      };
    }

    const transport = this.createSmtpTransport();

    try {
      const info = await transport.sendMail({
        from: params.from || this.creds.email,
        to: params.to,
        ...(params.cc?.length ? { cc: params.cc } : {}),
        ...(params.bcc?.length ? { bcc: params.bcc } : {}),
        subject: params.subject || "(无主题)",
        text: params.textBody || "",
        ...(params.htmlBody ? { html: params.htmlBody } : {}),
        ...(params.attachments?.length
          ? {
              attachments: params.attachments.map((attachment) => ({
                filename: attachment.filename,
                contentType: attachment.contentType,
                content: attachment.content,
              })),
            }
          : {}),
      });

      return {
        ok: true,
        providerMessageId: info.messageId ?? null,
        sentAt: Math.floor(Date.now() / 1000),
      };
    } catch (error: unknown) {
      const smtpError = error as {
        code?: string;
        responseCode?: number;
        response?: string;
        command?: string;
        message?: string;
      };
      const responseCode = smtpError.responseCode;
      const providerRawError = JSON.stringify({
        code: smtpError.code,
        responseCode: smtpError.responseCode,
        response: smtpError.response,
        command: smtpError.command,
        message: smtpError.message,
      });

      if (responseCode === 535 || responseCode === 534) {
        return {
          ok: false,
          errorCode: "AUTH_EXPIRED",
          errorMessage: "QQ 邮箱授权码无效或已过期，请重新生成授权码。",
          providerRawError,
        };
      }

      if (responseCode === 421 || responseCode === 450 || responseCode === 451 || responseCode === 452) {
        return {
          ok: false,
          errorCode: "RATE_LIMITED",
          errorMessage: "QQ 邮箱当前触发了频率或临时限制，请稍后重试。",
          providerRawError,
        };
      }

      if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET", "ENOTFOUND", "EPIPE"].includes(smtpError.code ?? "")) {
        return {
          ok: false,
          errorCode: "NETWORK",
          errorMessage: "连接 QQ SMTP 服务失败，请稍后重试。",
          providerRawError,
        };
      }

      return {
        ok: false,
        errorCode: "PROVIDER_ERROR",
        errorMessage: smtpError.message ?? "QQ 邮箱发信失败。",
        providerRawError,
      };
    } finally {
      await transport.close();
    }
  }

  async markMessageRead(remoteId: string): Promise<void> {
    const uid = parseInt(remoteId, 10);
    if (!Number.isFinite(uid)) {
      throw new Error(`Invalid QQ remote id: ${remoteId}`);
    }

    await this.withInboxClient(async (client) => {
      await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true, silent: true });
    });
  }

  async setMessageStarred(remoteId: string, starred: boolean): Promise<void> {
    const uid = parseInt(remoteId, 10);
    if (!Number.isFinite(uid)) {
      throw new Error(`Invalid QQ remote id: ${remoteId}`);
    }

    await this.withInboxClient(async (client) => {
      if (starred) {
        await client.messageFlagsAdd(uid, ["\\Flagged"], { uid: true, silent: true });
        return;
      }

      await client.messageFlagsRemove(uid, ["\\Flagged"], { uid: true, silent: true });
    });
  }

  async syncEmails(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    const emails: SyncedEmail[] = [];
    const lastUid = cursor ? parseInt(cursor, 10) : 0;

    return this.withInboxClient(async (client) => {
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
    });
  }

  async fetchEmail(remoteId: string): Promise<SyncedEmail | null> {
    const uid = parseInt(remoteId, 10);
    if (!Number.isFinite(uid)) return null;

    return this.withInboxClient(async (client) => {
      const msg = await client.fetchOne(
        uid,
        { uid: true, internalDate: true, source: true },
        { uid: true }
      );

      if (!msg || !msg.source) return null;
      return this.mapFullMessage(msg.uid, msg.source, msg.internalDate);
    });
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
