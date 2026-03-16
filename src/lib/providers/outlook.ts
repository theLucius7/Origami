import { Client } from "@microsoft/microsoft-graph-client";
import type {
  EmailProvider,
  SyncOptions,
  SyncResult,
  SyncedAttachment,
  SyncedEmail,
} from "./types";

interface OutlookCredentials {
  accessToken: string;
  refreshToken: string;
}

const TENANT = "common";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;

export function getOutlookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/outlook`,
    response_mode: "query",
    scope: "openid email User.Read Mail.Read offline_access",
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
  };
}

export class OutlookProvider implements EmailProvider {
  private creds: OutlookCredentials;
  private client: Client;

  constructor(creds: OutlookCredentials) {
    this.creds = { ...creds };
    this.client = Client.init({
      authProvider: (done) => done(null, this.creds.accessToken),
    });
  }

  getUpdatedTokens() {
    return { ...this.creds };
  }

  async sync(cursor: string | null, options: SyncOptions = {}): Promise<SyncResult> {
    return this.withRefresh(() => this._sync(cursor, options));
  }

  async fetchMessage(remoteId: string): Promise<SyncedEmail | null> {
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

  private async withRefresh<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch {
      const newTokens = await refreshTokens(this.creds.refreshToken);
      this.creds = newTokens;
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
