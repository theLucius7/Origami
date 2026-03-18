import { Client } from "@microsoft/microsoft-graph-client";
import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import {
  getDefaultOutlookOAuthAppSync,
  resolveOutlookOAuthApp,
  type ResolvedOutlookOAuthApp,
} from "@/lib/oauth-apps";
import type { AppLocale } from "@/i18n/locale";
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
  appId?: string;
  oauthApp?: ResolvedOutlookOAuthApp;
}

const OUTLOOK_SYNC_SELECT = "id,internetMessageId,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments,isRead,flag";
const OUTLOOK_ATTACHMENT_EXPAND = "attachments($select=id,name,contentType,size)";
const OUTLOOK_MESSAGES_BASE = "/me/mailFolders/inbox/messages";
const OUTLOOK_MESSAGES_DELTA_BASE = "/me/mailFolders/inbox/messages/delta";

function normalizeScopes(scopes?: string[] | string): string[] {
  const list = Array.isArray(scopes) ? scopes : scopes?.split(/\s+/) ?? [];
  return [...new Set(list.map((scope) => scope.trim().toLowerCase()).filter(Boolean))];
}

const OUTLOOK_REQUIRED_SEND_SCOPE = "mail.send";
export const OUTLOOK_REQUIRED_WRITEBACK_SCOPE = "mail.readwrite";

export function hasOutlookSendScope(scopes?: string[]): boolean {
  return normalizeScopes(scopes).includes(OUTLOOK_REQUIRED_SEND_SCOPE);
}

export function hasOutlookWriteBackScope(scopes?: string[]): boolean {
  return normalizeScopes(scopes).includes(OUTLOOK_REQUIRED_WRITEBACK_SCOPE);
}

function getOutlookWriteBackNotice(locale: AppLocale) {
  switch (locale) {
    case "zh-TW":
      return `需要重新授權以啟用回寫功能（需要 Outlook Delegated 權限：${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}）`;
    case "en":
      return `Reauthorization is required to enable write-back (requires Outlook delegated permission: ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}).`;
    case "ja":
      return `書き戻しを有効にするには再認可が必要です（Outlook Delegated 権限が必要です: ${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}）。`;
    default:
      return `需要重新授权以启用写回功能（需要 Outlook Delegated 权限：${OUTLOOK_REQUIRED_WRITEBACK_SCOPE}）`;
  }
}

function resolveSyncOutlookOAuthApp(appId?: string, oauthApp?: ResolvedOutlookOAuthApp) {
  if (oauthApp) return oauthApp;
  const normalizedAppId = appId?.trim() || DEFAULT_OAUTH_APP_ID;
  if (normalizedAppId !== DEFAULT_OAUTH_APP_ID) {
    throw new Error(`OAuth app \"${normalizedAppId}\" requires async resolution before constructing OutlookProvider.`);
  }
  return getDefaultOutlookOAuthAppSync();
}

function getFlagStatus(msg: Record<string, unknown>) {
  return String((msg.flag as { flagStatus?: string } | undefined)?.flagStatus ?? "notFlagged").toLowerCase();
}

function buildOutlookListUrl(options: SyncOptions): string {
  const params = new URLSearchParams({
    $orderby: "receivedDateTime desc",
    $select: OUTLOOK_SYNC_SELECT,
  });

  if (options.limit) {
    params.set("$top", String(options.limit));
  }

  if (!options.metadataOnly) {
    params.set("$expand", OUTLOOK_ATTACHMENT_EXPAND);
  }

  return `${OUTLOOK_MESSAGES_BASE}?${params.toString()}`;
}

function buildOutlookDeltaUrl(options: SyncOptions, receivedAfter?: number | null): string {
  const params = new URLSearchParams({
    $select: OUTLOOK_SYNC_SELECT,
  });

  if (options.limit) {
    params.set("$top", String(options.limit));
  }

  if (!options.metadataOnly) {
    params.set("$expand", OUTLOOK_ATTACHMENT_EXPAND);
  }

  if (receivedAfter) {
    params.set("$filter", `receivedDateTime ge ${new Date(receivedAfter * 1000).toISOString()}`);
  }

  return `${OUTLOOK_MESSAGES_DELTA_BASE}?${params.toString()}`;
}

function isOutlookDeltaCursor(cursor: string): boolean {
  return cursor.includes("/delta") || cursor.includes("$deltatoken=") || cursor.includes("deltaToken=");
}

function extractActiveMessages(page: Record<string, unknown>): Array<Record<string, unknown>> {
  const items = Array.isArray(page.value) ? page.value : [];
  return items.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !("@removed" in item)
  );
}

function extractRemovedRemoteIds(page: Record<string, unknown>): string[] {
  const items = Array.isArray(page.value) ? page.value : [];
  return items
    .filter(
      (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && "@removed" in item
    )
    .map((item) => String(item.id ?? ""))
    .filter(Boolean);
}

export async function getOutlookAuthUrl(state?: string, appId?: string): Promise<string> {
  const config = await resolveOutlookOAuthApp(appId);
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUrl,
    response_mode: "query",
    scope: "openid email User.Read Mail.Read Mail.ReadWrite Mail.Send offline_access",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeOutlookCode(code: string, appId?: string) {
  const config = await resolveOutlookOAuthApp(appId);
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUrl,
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
    appId: config.appId,
  };
}

async function refreshTokens(refreshToken: string, oauthApp: ResolvedOutlookOAuthApp) {
  const config = oauthApp;
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
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
    const oauthApp = resolveSyncOutlookOAuthApp(creds.appId, creds.oauthApp);
    this.creds = {
      ...creds,
      scopes: normalizeScopes(creds.scopes),
      appId: oauthApp.appId,
      oauthApp,
    };
    this.client = Client.init({
      authProvider: (done) => done(null, this.creds.accessToken),
    });
  }

  getUpdatedTokens() {
    return { ...this.creds, scopes: normalizeScopes(this.creds.scopes) };
  }

  getCapabilities(locale: AppLocale = "zh-CN") {
    const canWriteBack = hasOutlookWriteBackScope(this.creds.scopes);
    const notice = canWriteBack ? null : getOutlookWriteBackNotice(locale);

    return {
      canSend: hasOutlookSendScope(this.creds.scopes),
      canWriteBackRead: canWriteBack,
      canWriteBackStar: canWriteBack,
      readWriteBackNotice: notice,
      starWriteBackNotice: notice,
    };
  }

  async markMessageRead(remoteId: string): Promise<void> {
    return this.withRefresh(async () => {
      await this.client.api(`/me/messages/${remoteId}`).patch({ isRead: true });
    });
  }

  async setMessageStarred(remoteId: string, starred: boolean): Promise<void> {
    return this.withRefresh(async () => {
      await this.client.api(`/me/messages/${remoteId}`).patch({
        flag: { flagStatus: starred ? "flagged" : "notFlagged" },
      });
    });
  }

  async syncEmails(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    return this.withRefresh(() => this.sync(cursor, options));
  }

  async fetchEmail(remoteId: string): Promise<SyncedEmail | null> {
    return this.withRefresh(async () => {
      const msg = await this.client
        .api(`/me/messages/${remoteId}`)
        .select(OUTLOOK_SYNC_SELECT)
        .expand(OUTLOOK_ATTACHMENT_EXPAND)
        .get();

      return this.mapMessage(msg, false);
    });
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
        errorKey: "OUTLOOK_SEND_SCOPE_REQUIRED",
        errorMessage: "Outlook Mail.Send permission is missing",
      };
    }

    return this.withRefresh(async () => {
      try {
        await this.client.api("/me/sendMail").post({
          message: {
            subject: params.subject || "",
            body: {
              contentType: params.htmlBody ? "HTML" : "Text",
              content: params.htmlBody || params.textBody || "",
            },
            toRecipients: params.to.map((address) => ({ emailAddress: { address } })),
            ...(params.cc?.length
              ? {
                  ccRecipients: params.cc.map((address) => ({ emailAddress: { address } })),
                }
              : {}),
            ...(params.bcc?.length
              ? {
                  bccRecipients: params.bcc.map((address) => ({ emailAddress: { address } })),
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
            errorKey: "OUTLOOK_AUTH_EXPIRED",
            errorMessage: "Outlook authorization expired",
            providerRawError,
          };
        }

        if (status === 403) {
          return {
            ok: false,
            errorCode: "INSUFFICIENT_SCOPE",
            errorKey: "OUTLOOK_POLICY_RESTRICTED",
            errorMessage: "Outlook sending is restricted",
            providerRawError,
          };
        }

        if (status === 413) {
          return {
            ok: false,
            errorCode: "PROVIDER_ERROR",
            errorKey: "OUTLOOK_PAYLOAD_TOO_LARGE",
            errorMessage: "Outlook payload is too large",
            providerRawError,
          };
        }

        if (status === 429) {
          return {
            ok: false,
            errorCode: "RATE_LIMITED",
            errorKey: "OUTLOOK_RATE_LIMITED",
            errorMessage: "Outlook is rate limited",
            providerRawError,
          };
        }

        return {
          ok: false,
          errorCode: "PROVIDER_ERROR",
          errorKey: "OUTLOOK_SEND_FAILED",
          errorMessage: graphError.message ?? "Outlook send failed",
          providerRawError,
        };
      }
    });
  }

  private async withRefresh<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      const e = err as { statusCode?: number; code?: string };
      if (e.statusCode === 401 || e.code === "InvalidAuthenticationToken") {
        const next = await refreshTokens(this.creds.refreshToken, this.creds.oauthApp!);
        this.creds = { ...this.creds, ...next };
        this.client = Client.init({ authProvider: (done) => done(null, this.creds.accessToken) });
        return fn();
      }
      throw err;
    }
  }

  private async sync(cursor: string | null, options: SyncOptions): Promise<SyncResult> {
    if (!cursor) {
      return this.initialSync(options);
    }

    if (!isOutlookDeltaCursor(cursor)) {
      return this.initialSync(options);
    }

    return this.deltaSync(cursor, options);
  }

  private async initialSync(options: SyncOptions): Promise<SyncResult> {
    const page = (await this.client.api(buildOutlookListUrl(options)).get()) as Record<string, unknown>;
    const items = extractActiveMessages(page);
    const emails = items.map((msg) => this.mapMessage(msg, Boolean(options.metadataOnly)));
    const oldestReceivedAt = emails.reduce<number | null>((min, email) => {
      if (!Number.isFinite(email.receivedAt)) return min;
      if (min === null) return email.receivedAt;
      return Math.min(min, email.receivedAt);
    }, null);
    const deltaCursor = await this.bootstrapDeltaCursor(options, oldestReceivedAt);

    return {
      emails,
      removedRemoteIds: [],
      newCursor: deltaCursor,
    };
  }

  private async deltaSync(cursor: string, options: SyncOptions): Promise<SyncResult> {
    const page = (await this.client.api(cursor).get()) as Record<string, unknown>;
    const items = extractActiveMessages(page);
    const emails = items.map((msg) => this.mapMessage(msg, Boolean(options.metadataOnly)));
    const removedRemoteIds = extractRemovedRemoteIds(page);

    return {
      emails,
      removedRemoteIds,
      newCursor: String(page["@odata.deltaLink"] ?? cursor),
    };
  }

  private async bootstrapDeltaCursor(options: SyncOptions, oldestReceivedAt: number | null) {
    let nextUrl: string | null = buildOutlookDeltaUrl(options, oldestReceivedAt);
    let deltaLink: string | null = null;

    while (nextUrl) {
      const page = (await this.client.api(nextUrl).get()) as Record<string, unknown>;
      deltaLink = typeof page["@odata.deltaLink"] === "string" ? String(page["@odata.deltaLink"]) : deltaLink;
      nextUrl = typeof page["@odata.nextLink"] === "string" ? String(page["@odata.nextLink"]) : null;
    }

    return deltaLink;
  }

  private mapMessage(msg: Record<string, unknown>, metadataOnly: boolean): SyncedEmail {
    const attachmentsRaw = Array.isArray(msg.attachments) ? msg.attachments : [];
    const attachments: SyncedAttachment[] = attachmentsRaw.map((att) => ({
      filename: String(att.name ?? "untitled"),
      contentType: String(att.contentType ?? "application/octet-stream"),
      size: typeof att.size === "number" ? att.size : 0,
      content: Buffer.alloc(0),
    }));

    const toRecipients = Array.isArray(msg.toRecipients)
      ? msg.toRecipients
          .map((recipient) => {
            const address = (recipient as { emailAddress?: { address?: string } }).emailAddress?.address;
            return address ?? "";
          })
          .filter(Boolean)
      : [];

    const bodyContent = String((msg.body as { content?: string } | undefined)?.content ?? "");
    const receivedDateTime = String(msg.receivedDateTime ?? "");
    const receivedAt = Number.isNaN(new Date(receivedDateTime).getTime())
      ? Math.floor(Date.now() / 1000)
      : Math.floor(new Date(receivedDateTime).getTime() / 1000);

    return {
      remoteId: String(msg.id),
      messageId: String(msg.internetMessageId ?? msg.id),
      subject: String(msg.subject ?? ""),
      sender: String((msg.from as { emailAddress?: { address?: string } } | undefined)?.emailAddress?.address ?? ""),
      recipients: toRecipients,
      snippet: String(msg.bodyPreview ?? ""),
      bodyText: metadataOnly ? null : bodyContent,
      bodyHtml: metadataOnly ? null : bodyContent,
      isRead: Boolean(msg.isRead),
      isStarred: getFlagStatus(msg) === "flagged",
      receivedAt,
      folder: "INBOX",
      attachments,
    };
  }
}
