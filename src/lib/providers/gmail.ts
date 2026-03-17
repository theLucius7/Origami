import { google, type gmail_v1 } from "googleapis";
import { buildMimeMessage, encodeMimeMessageBase64Url } from "./mime";
import type {
  EmailProvider,
  SendMailParams,
  SendMailResult,
  SyncOptions,
  SyncResult,
  SyncedAttachment,
  SyncedEmail,
} from "./types";

interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  scopes?: string[];
}

const GMAIL_SEND_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

function normalizeScopes(scopes?: string[] | string): string[] {
  const list = Array.isArray(scopes) ? scopes : scopes?.split(/\s+/) ?? [];
  return [...new Set(list.map((scope) => scope.trim()).filter(Boolean))];
}

function hasGmailSendScope(scopes?: string[]): boolean {
  const normalized = normalizeScopes(scopes);
  return GMAIL_SEND_SCOPES.some((scope) => normalized.includes(scope));
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/gmail`
  );
}

export function getGmailAuthUrl(): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

export async function exchangeGmailCode(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });

  return {
    email: profile.data.emailAddress!,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    scopes: normalizeScopes(tokens.scope),
  };
}

export class GmailProvider implements EmailProvider {
  private gmail: gmail_v1.Gmail;
  private oauth2: InstanceType<typeof google.auth.OAuth2>;
  private creds: GmailCredentials;

  constructor(creds: GmailCredentials) {
    this.creds = {
      ...creds,
      scopes: normalizeScopes(creds.scopes),
    };
    this.oauth2 = getOAuth2Client();
    this.oauth2.setCredentials({
      access_token: creds.accessToken,
      refresh_token: creds.refreshToken,
    });
    this.oauth2.on("tokens", (tokens) => {
      if (tokens.access_token) {
        this.creds.accessToken = tokens.access_token;
      }
      if (tokens.refresh_token) {
        this.creds.refreshToken = tokens.refresh_token;
      }
      if (tokens.scope) {
        this.creds.scopes = normalizeScopes(tokens.scope);
      }
    });
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2 });
  }

  getUpdatedTokens(): { accessToken: string; refreshToken: string; scopes: string[] } {
    const creds = this.oauth2.credentials;
    return {
      accessToken: creds.access_token ?? this.creds.accessToken,
      refreshToken: creds.refresh_token ?? this.creds.refreshToken,
      scopes: this.creds.scopes ?? [],
    };
  }

  getCapabilities() {
    return {
      canSend: hasGmailSendScope(this.creds.scopes),
    };
  }

  async sendMail(params: SendMailParams): Promise<SendMailResult> {
    if (params.to.length === 0) {
      return {
        ok: false,
        errorCode: "VALIDATION",
        errorMessage: "至少需要一个收件人。",
      };
    }

    if (!this.getCapabilities().canSend) {
      return {
        ok: false,
        errorCode: "INSUFFICIENT_SCOPE",
        errorMessage: "当前 Gmail 账号没有发送权限，请重新授权并包含 gmail.send/gmail.modify。",
      };
    }

    try {
      const mime = buildMimeMessage(params);
      const raw = encodeMimeMessageBase64Url(mime);
      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      return {
        ok: true,
        providerMessageId: response.data.id ?? null,
        sentAt: Math.floor(Date.now() / 1000),
      };
    } catch (error: unknown) {
      const gmailError = error as {
        code?: number;
        status?: number;
        message?: string;
        response?: { data?: unknown };
      };
      const status = gmailError.status ?? gmailError.code;
      const providerRawError = JSON.stringify(gmailError.response?.data ?? gmailError.message ?? error);

      if (status === 401) {
        return {
          ok: false,
          errorCode: "AUTH_EXPIRED",
          errorMessage: "Gmail 登录已过期，请重新授权。",
          providerRawError,
        };
      }

      if (status === 403) {
        return {
          ok: false,
          errorCode: "INSUFFICIENT_SCOPE",
          errorMessage: "Gmail 账号缺少发送权限或当前被策略限制。",
          providerRawError,
        };
      }

      if (status === 429) {
        return {
          ok: false,
          errorCode: "RATE_LIMITED",
          errorMessage: "Gmail 当前触发了发送频率限制，请稍后重试。",
          providerRawError,
        };
      }

      return {
        ok: false,
        errorCode: "PROVIDER_ERROR",
        errorMessage: gmailError.message ?? "Gmail 发信失败。",
        providerRawError,
      };
    }
  }

  async syncEmails(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    if (cursor) {
      return this.incrementalSync(cursor, options);
    }
    return this.fullSync(options);
  }

  async fetchEmail(remoteId: string): Promise<SyncedEmail | null> {
    const msg = await this.gmail.users.messages.get({
      userId: "me",
      id: remoteId,
      format: "full",
    });

    return this.mapMessage(msg.data, false);
  }

  private async fullSync(options: SyncOptions): Promise<SyncResult> {
    const listRes = await this.gmail.users.messages.list({
      userId: "me",
      maxResults: options.limit ?? 200,
      labelIds: ["INBOX"],
    });

    const messageIds = listRes.data.messages ?? [];
    const emails = await this.fetchMessages(
      messageIds.map((m) => m.id!).filter(Boolean),
      options.metadataOnly ?? true
    );

    const profile = await this.gmail.users.getProfile({ userId: "me" });
    const historyId = profile.data.historyId ?? null;

    return { emails, newCursor: historyId };
  }

  private async incrementalSync(historyId: string, options: SyncOptions): Promise<SyncResult> {
    try {
      const historyRes = await this.gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
        historyTypes: ["messageAdded"],
        labelId: "INBOX",
      });

      const newHistoryId = historyRes.data.historyId ?? historyId;
      const history = historyRes.data.history ?? [];
      const addedIds = new Set<string>();

      for (const h of history) {
        for (const added of h.messagesAdded ?? []) {
          if (added.message?.id) addedIds.add(added.message.id);
        }
      }

      if (addedIds.size === 0) {
        return { emails: [], newCursor: newHistoryId };
      }

      const emails = await this.fetchMessages(
        [...addedIds].slice(0, options.limit ?? 50),
        options.metadataOnly ?? true
      );
      return { emails, newCursor: newHistoryId };
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 404) {
        return this.fullSync(options);
      }
      throw err;
    }
  }

  private async fetchMessages(ids: string[], metadataOnly: boolean): Promise<SyncedEmail[]> {
    const results: SyncedEmail[] = [];

    for (const id of ids) {
      const msg = await this.gmail.users.messages.get({
        userId: "me",
        id,
        format: metadataOnly ? "metadata" : "full",
        metadataHeaders: ["Message-ID", "Subject", "From", "To", "Date"],
      });

      const email = await this.mapMessage(msg.data, metadataOnly);
      if (email) {
        results.push(email);
      }
    }

    return results;
  }

  private async mapMessage(
    data: gmail_v1.Schema$Message,
    metadataOnly: boolean
  ): Promise<SyncedEmail | null> {
    if (!data.id) return null;

    const headers = data.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

    const attachments: SyncedAttachment[] = [];

    if (!metadataOnly && data.payload?.parts) {
      for (const part of this.flattenParts(data.payload.parts)) {
        if (part.filename && part.body?.attachmentId) {
          const att = await this.gmail.users.messages.attachments.get({
            userId: "me",
            messageId: data.id,
            id: part.body.attachmentId,
          });
          if (att.data.data) {
            attachments.push({
              filename: part.filename,
              contentType: part.mimeType ?? "application/octet-stream",
              size: att.data.size ?? 0,
              content: Buffer.from(att.data.data, "base64url"),
            });
          }
        }
      }
    }

    const receivedDate = data.internalDate
      ? Math.floor(parseInt(data.internalDate) / 1000)
      : Math.floor(Date.now() / 1000);

    return {
      remoteId: data.id,
      messageId: getHeader("Message-ID") || `gmail-${data.id}`,
      subject: getHeader("Subject") || "(无主题)",
      sender: getHeader("From"),
      recipients: getHeader("To")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      snippet: data.snippet ?? "",
      bodyText: metadataOnly ? null : this.extractBody(data.payload, "text/plain"),
      bodyHtml: metadataOnly ? null : this.extractBody(data.payload, "text/html"),
      receivedAt: receivedDate,
      folder: "INBOX",
      attachments,
    };
  }

  private extractBody(
    payload: gmail_v1.Schema$MessagePart | undefined,
    mimeType: string
  ): string {
    if (!payload) return "";
    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, "base64url").toString("utf-8");
    }
    for (const part of payload.parts ?? []) {
      const result = this.extractBody(part, mimeType);
      if (result) return result;
    }
    return "";
  }

  private flattenParts(
    parts: gmail_v1.Schema$MessagePart[]
  ): gmail_v1.Schema$MessagePart[] {
    const result: gmail_v1.Schema$MessagePart[] = [];
    for (const part of parts) {
      result.push(part);
      if (part.parts) result.push(...this.flattenParts(part.parts));
    }
    return result;
  }
}
