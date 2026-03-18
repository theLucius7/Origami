import { google, type gmail_v1 } from "googleapis";
import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import {
  GMAIL_SEND_SCOPES,
  getDefaultGmailOAuthAppSync,
  resolveGmailOAuthApp,
  type ResolvedGmailOAuthApp,
} from "@/lib/oauth-apps";
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
  appId?: string;
  oauthApp?: ResolvedGmailOAuthApp;
}

export const GMAIL_MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

function normalizeScopes(scopes?: string[] | string): string[] {
  const list = Array.isArray(scopes) ? scopes : scopes?.split(/\s+/) ?? [];
  return [...new Set(list.map((scope) => scope.trim()).filter(Boolean))];
}

export function hasGmailSendScope(scopes?: string[]): boolean {
  const normalized = normalizeScopes(scopes);
  return GMAIL_SEND_SCOPES.some((scope) => normalized.includes(scope));
}

export function hasGmailModifyScope(scopes?: string[]): boolean {
  return normalizeScopes(scopes).includes(GMAIL_MODIFY_SCOPE);
}

function getOAuth2Client(config: ResolvedGmailOAuthApp) {
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUrl);
}

function resolveSyncGmailOAuthApp(appId?: string, oauthApp?: ResolvedGmailOAuthApp) {
  if (oauthApp) return oauthApp;
  const normalizedAppId = appId?.trim() || DEFAULT_OAUTH_APP_ID;
  if (normalizedAppId !== DEFAULT_OAUTH_APP_ID) {
    throw new Error(`OAuth app \"${normalizedAppId}\" requires async resolution before constructing GmailProvider.`);
  }
  return getDefaultGmailOAuthAppSync();
}

function buildAttachmentList(parts: gmail_v1.Schema$MessagePart[] = []): SyncedAttachment[] {
  const attachments: SyncedAttachment[] = [];

  for (const part of parts) {
    if (part.parts?.length) {
      attachments.push(...buildAttachmentList(part.parts));
    }

    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        contentType: part.mimeType ?? "application/octet-stream",
        size: part.body.size ?? 0,
        content: Buffer.alloc(0),
      });
    }
  }

  return attachments;
}

export async function getGmailAuthUrl(state?: string, appId?: string): Promise<string> {
  const oauthConfig = await resolveGmailOAuthApp(appId);
  const oauth2 = getOAuth2Client(oauthConfig);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      GMAIL_MODIFY_SCOPE,
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    ...(state ? { state } : {}),
  });
}

export async function exchangeGmailCode(code: string, appId?: string) {
  const oauthConfig = await resolveGmailOAuthApp(appId);
  const oauth2 = getOAuth2Client(oauthConfig);
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });

  return {
    email: profile.data.emailAddress!,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    scopes: normalizeScopes(tokens.scope),
    appId: oauthConfig.appId,
  };
}

export class GmailProvider implements EmailProvider {
  private gmail: gmail_v1.Gmail;
  private oauth2: InstanceType<typeof google.auth.OAuth2>;
  private creds: GmailCredentials;

  constructor(creds: GmailCredentials) {
    const oauthApp = resolveSyncGmailOAuthApp(creds.appId, creds.oauthApp);
    this.creds = {
      ...creds,
      scopes: normalizeScopes(creds.scopes),
      appId: oauthApp.appId,
      oauthApp,
    };
    this.oauth2 = getOAuth2Client(oauthApp);
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
    const canWriteBack = hasGmailModifyScope(this.creds.scopes);

    return {
      canSend: hasGmailSendScope(this.creds.scopes),
      canWriteBackRead: canWriteBack,
      canWriteBackStar: canWriteBack,
      readWriteBackNotice: canWriteBack ? null : `需要重新授权以启用写回功能（需要 Gmail 修改权限：${GMAIL_MODIFY_SCOPE}）`,
      starWriteBackNotice: canWriteBack ? null : `需要重新授权以启用写回功能（需要 Gmail 修改权限：${GMAIL_MODIFY_SCOPE}）`,
    };
  }

  async sendMail(params: SendMailParams): Promise<SendMailResult> {
    if (params.to.length === 0) {
      return {
        ok: false,
        errorCode: "VALIDATION",
        errorKey: "TO_REQUIRED",
        errorMessage: "At least one recipient is required",
      };
    }

    if (!this.getCapabilities().canSend) {
      return {
        ok: false,
        errorCode: "INSUFFICIENT_SCOPE",
        errorKey: "GMAIL_SEND_SCOPE_REQUIRED",
        errorMessage: "Gmail send permission is missing",
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
          errorKey: "GMAIL_AUTH_EXPIRED",
          errorMessage: "Gmail authorization expired",
          providerRawError,
        };
      }

      if (status === 403) {
        return {
          ok: false,
          errorCode: "INSUFFICIENT_SCOPE",
          errorKey: "GMAIL_POLICY_RESTRICTED",
          errorMessage: "Gmail sending is restricted",
          providerRawError,
        };
      }

      if (status === 429) {
        return {
          ok: false,
          errorCode: "RATE_LIMITED",
          errorKey: "GMAIL_RATE_LIMITED",
          errorMessage: "Gmail is rate limited",
          providerRawError,
        };
      }

      return {
        ok: false,
        errorCode: "PROVIDER_ERROR",
        errorKey: "GMAIL_SEND_FAILED",
        errorMessage: gmailError.message ?? "Gmail send failed",
        providerRawError,
      };
    }
  }

  async markMessageRead(remoteId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: "me",
      id: remoteId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
  }

  async setMessageStarred(remoteId: string, starred: boolean): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: "me",
      id: remoteId,
      requestBody: starred ? { addLabelIds: ["STARRED"] } : { removeLabelIds: ["STARRED"] },
    });
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

    if (!msg.data.id) return null;
    return this.mapMessage(msg.data, false);
  }

  private async incrementalSync(cursor: string, options: SyncOptions): Promise<SyncResult> {
    const historyRes = await this.gmail.users.history.list({
      userId: "me",
      startHistoryId: cursor,
      historyTypes: ["messageAdded"],
      maxResults: options.limit ?? 50,
    });

    const history = historyRes.data.history ?? [];
    const ids = history
      .flatMap((h) => (h.messagesAdded ?? []).map((m) => m.message?.id))
      .filter(Boolean) as string[];

    const emails: SyncedEmail[] = [];
    for (const id of ids) {
      const msg = await this.gmail.users.messages.get({
        userId: "me",
        id,
        format: options.metadataOnly ? "metadata" : "full",
      });
      emails.push(this.mapMessage(msg.data, Boolean(options.metadataOnly)));
    }

    return {
      emails,
      removedRemoteIds: [],
      newCursor: historyRes.data.historyId ?? cursor,
    };
  }

  private async fullSync(options: SyncOptions): Promise<SyncResult> {
    const listRes = await this.gmail.users.messages.list({
      userId: "me",
      maxResults: options.limit ?? 50,
      q: "in:inbox",
    });
    const messages = listRes.data.messages ?? [];
    const emails: SyncedEmail[] = [];

    for (const m of messages) {
      const msg = await this.gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: options.metadataOnly ? "metadata" : "full",
      });
      emails.push(this.mapMessage(msg.data, Boolean(options.metadataOnly)));
    }

    const profile = await this.gmail.users.getProfile({ userId: "me" });
    return { emails, removedRemoteIds: [], newCursor: profile.data.historyId ?? null };
  }

  private mapMessage(msg: gmail_v1.Schema$Message, metadataOnly: boolean): SyncedEmail {
    const headers = Object.fromEntries(
      (msg.payload?.headers ?? []).map((h) => [h.name?.toLowerCase() ?? "", h.value ?? ""])
    );
    const labelIds = new Set((msg.labelIds ?? []).map(String));
    const attachments = buildAttachmentList(msg.payload?.parts ?? []);

    const bodyData = metadataOnly
      ? undefined
      : this.extractBody(msg.payload, "text/plain") || this.extractBody(msg.payload, "text/html");
    const htmlData = metadataOnly ? undefined : this.extractBody(msg.payload, "text/html");

    return {
      remoteId: msg.id!,
      messageId: headers["message-id"] ?? msg.id!,
      subject: headers.subject ?? "(无主题)",
      sender: headers.from ?? "",
      recipients: headers.to ? headers.to.split(/,\s*/) : [],
      snippet: msg.snippet ?? "",
      bodyText: bodyData ? Buffer.from(bodyData, "base64").toString("utf8") : null,
      bodyHtml: htmlData ? Buffer.from(htmlData, "base64").toString("utf8") : null,
      isRead: !labelIds.has("UNREAD"),
      isStarred: labelIds.has("STARRED"),
      receivedAt: Number(headers.date ? Date.parse(headers.date) / 1000 : Date.now() / 1000),
      folder: "INBOX",
      attachments,
    };
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart | undefined, mimeType: string): string | null {
    if (!payload) return null;
    if (payload.mimeType === mimeType && payload.body?.data) return payload.body.data;
    for (const part of payload.parts ?? []) {
      const found = this.extractBody(part, mimeType);
      if (found) return found;
    }
    return null;
  }
}
