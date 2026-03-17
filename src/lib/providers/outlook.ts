import { Client } from "@microsoft/microsoft-graph-client";
import type {
  EmailProvider,
  SendMailParams,
  SendMailResult,
  SyncOptions,
  SyncResult,
  SyncedAttachment,
  SyncedEmail,
} from "./types";

interface OutlookCredentials {
  accessToken: string;
  refreshToken: string;
  scopes?: string[];
}

const TENANT = "common";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const OUTLOOK_REQUIRED_SEND_SCOPE = "mail.send";

function normalizeScopes(scopes?: string[] | string): string[] {
  const list = Array.isArray(scopes) ? scopes : scopes?.split(/\s+/) ?? [];
  return [...new Set(list.map((scope) => scope.trim().toLowerCase()).filter(Boolean))];
}

function hasOutlookSendScope(scopes?: string[]): boolean {
  return normalizeScopes(scopes).includes(OUTLOOK_REQUIRED_SEND_SCOPE);
}

export function getOutlookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/outlook`,
    response_mode: "query",
    scope: "openid email User.Read Mail.Read Mail.Send offline_access",
    prompt: "consent",
  });
  return `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeOutlookCode(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/outlook`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await res.json();
  if (tokens.error) throw new Error(tokens.error_description ?? tokens.error);

  const client = Client.init({
    authProvider: (done) => done(null, tokens.access_token),
  });
  const me = await client.api("/me").select("mail,displayName").get();

  return {
    email: me.mail as string,
    displayName: (me.displayName ?? me.mail) as string,
    accessToken: tokens.access_token as string,
    refreshToken: tokens.refresh_token as string,
    scopes: normalizeScopes(tokens.scope as string),
  };
}

async function refreshTokens(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);
  return {
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token ?? refreshToken) as string,
    scopes: normalizeScopes(data.scope as string),
  };
}

export class OutlookProvider implements EmailProvider {
  private creds: OutlookCredentials;
  private client: Client;

  constructor(creds: OutlookCredentials) {
    this.creds = {
      ...creds,
      scopes: normalizeScopes(creds.scopes),
    };
    this.client = Client.init({
      authProvider: (done) => done(null, this.creds.accessToken),
    });
  }

  getUpdatedTokens() {
    return { ...this.creds, scopes: normalizeScopes(this.creds.scopes) };
  }

  getCapabilities() {
    return {
      canSend: hasOutlookSendScope(this.creds.scopes),
    };
  }

  async syncEmails(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    return this.withRefresh(() => this._sync(cursor, options));
  }

  async fetchEmail(remoteId: string): Promise<SyncedEmail | null> {
    return this.withRefresh(async () => {
      const msg = await this.client
        .api(`/me/messages/${remoteId}`)
        .select(
          "id,internetMessageId,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments"
        )
        .get();

      return this.mapMessage(msg, false);
    });
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
        errorMessage: "当前 Outlook 账号没有 Mail.Send 权限，请重新授权。",
      };
    }

    return this.withRefresh(async () => {
      try {
        await this.client.api("/me/sendMail").post({
          message: {
            subject: params.subject || "(无主题)",
            body: {
              contentType: params.htmlBody ? "HTML" : "Text",
              content: params.htmlBody || params.textBody || "",
            },
            toRecipients: params.to.map((address) => ({
              emailAddress: { address },
            })),
            ...(params.cc?.length
              ? {
                  ccRecipients: params.cc.map((address) => ({
                    emailAddress: { address },
                  })),
                }
              : {}),
            ...(params.bcc?.length
              ? {
                  bccRecipients: params.bcc.map((address) => ({
                    emailAddress: { address },
                  })),
                }
              : {}),
            ...(params.attachments?.length
              ? {
                  attachments: params.attachments.map((attachment) => ({
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: attachment.filename,
                    contentType: attachment.contentType,
                    contentBytes: attachment.content.toString("base64"),
                  })),
                }
              : {}),
          },
          saveToSentItems: true,
        });

        return {
          ok: true,
          providerMessageId: null,
          sentAt: Math.floor(Date.now() / 1000),
        };
      } catch (error: unknown) {
        const graphError = error as {
          statusCode?: number;
          code?: string;
          message?: string;
          body?: unknown;
        };
        const status = graphError.statusCode;
        const providerRawError = JSON.stringify(graphError.body ?? graphError.message ?? error);

        if (status === 401) {
          return {
            ok: false,
            errorCode: "AUTH_EXPIRED",
            errorMessage: "Outlook 登录已过期，请重新授权。",
            providerRawError,
          };
        }

        if (status === 403) {
          return {
            ok: false,
            errorCode: "INSUFFICIENT_SCOPE",
            errorMessage: "Outlook 账号缺少 Mail.Send 权限或当前被策略限制。",
            providerRawError,
          };
        }

        if (status === 429) {
          return {
            ok: false,
            errorCode: "RATE_LIMITED",
            errorMessage: "Outlook 当前触发了频率限制，请稍后重试。",
            providerRawError,
          };
        }

        return {
          ok: false,
          errorCode: "PROVIDER_ERROR",
          errorMessage: graphError.message ?? "Outlook 发信失败。",
          providerRawError,
        };
      }
    });
  }

  private async withRefresh<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      const newTokens = await refreshTokens(this.creds.refreshToken);
      this.creds = {
        ...newTokens,
        scopes: newTokens.scopes.length > 0 ? newTokens.scopes : this.creds.scopes,
      };
      this.client = Client.init({
        authProvider: (done) => done(null, this.creds.accessToken),
      });
      return fn();
    }
  }

  private async _sync(cursor: string | null, options: SyncOptions): Promise<SyncResult> {
    let response;
    const top = options.limit ?? 50;
    const select = options.metadataOnly ?? true
      ? "id,internetMessageId,subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments"
      : "id,internetMessageId,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments";

    if (cursor) {
      try {
        response = await this.client.api(cursor).get();
      } catch {
        response = await this.client
          .api("/me/mailFolders/inbox/messages/delta")
          .top(top)
          .select(select)
          .orderby("receivedDateTime desc")
          .get();
      }
    } else {
      response = await this.client
        .api("/me/mailFolders/inbox/messages/delta")
        .top(top)
        .select(select)
        .orderby("receivedDateTime desc")
        .get();
    }

    const messages: Array<Record<string, unknown>> = response.value ?? [];
    const deltaLink: string | null = response["@odata.deltaLink"] ?? null;
    const nextLink: string | null = response["@odata.nextLink"] ?? null;

    const emails: SyncedEmail[] = [];

    for (const msg of messages) {
      const email = await this.mapMessage(msg, options.metadataOnly ?? true);
      if (email) {
        emails.push(email);
      }
    }

    return {
      emails,
      newCursor: deltaLink ?? nextLink ?? cursor,
    };
  }

  private async mapMessage(
    msg: Record<string, unknown>,
    metadataOnly: boolean
  ): Promise<SyncedEmail | null> {
    if (!msg.id) return null;

    const from = msg.from as { emailAddress?: { address?: string; name?: string } } | undefined;
    const toRecipients = (msg.toRecipients ?? []) as Array<{
      emailAddress?: { address?: string };
    }>;
    const body = msg.body as { content?: string; contentType?: string } | undefined;

    let attachmentsList: SyncedAttachment[] = [];
    if (!metadataOnly && msg.hasAttachments && msg.id) {
      attachmentsList = await this.fetchAttachments(msg.id as string);
    }

    return {
      remoteId: msg.id as string,
      messageId: (msg.internetMessageId as string) ?? `outlook-${msg.id}`,
      subject: (msg.subject as string) ?? "(无主题)",
      sender: from?.emailAddress
        ? `${from.emailAddress.name ?? ""} <${from.emailAddress.address}>`
        : "",
      recipients: toRecipients
        .map((r) => r.emailAddress?.address ?? "")
        .filter(Boolean),
      snippet: (msg.bodyPreview as string) ?? "",
      bodyText: metadataOnly
        ? null
        : body?.contentType === "text"
          ? (body.content ?? "")
          : "",
      bodyHtml: metadataOnly
        ? null
        : body?.contentType === "html"
          ? (body.content ?? "")
          : "",
      receivedAt: msg.receivedDateTime
        ? Math.floor(new Date(msg.receivedDateTime as string).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      folder: "INBOX",
      attachments: attachmentsList,
    };
  }

  private async fetchAttachments(messageId: string): Promise<SyncedAttachment[]> {
    const res = await this.client.api(`/me/messages/${messageId}/attachments`).get();

    const items: Array<Record<string, unknown>> = res.value ?? [];
    const result: SyncedAttachment[] = [];

    for (const att of items) {
      if (att["@odata.type"] === "#microsoft.graph.fileAttachment" && att.contentBytes) {
        result.push({
          filename: (att.name as string) ?? "untitled",
          contentType: (att.contentType as string) ?? "application/octet-stream",
          size: (att.size as number) ?? 0,
          content: Buffer.from(att.contentBytes as string, "base64"),
        });
      }
    }

    return result;
  }
}
