import { eq } from "drizzle-orm";
import { requireEnv } from "@/config/env";
import { db } from "@/lib/db";
import { oauthApps } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import {
  DEFAULT_OAUTH_APP_ID,
  type OAuthAppOption,
  type OAuthProviderKind,
} from "@/lib/oauth-apps.shared";

export interface ResolvedGmailOAuthApp {
  appId: string;
  source: "env" | "db";
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  sendScopes: string[];
}

export interface ResolvedOutlookOAuthApp {
  appId: string;
  source: "env" | "db";
  tenant: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  requiredSendScope: string;
}

export const GMAIL_SEND_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

function normalizeAppId(appId?: string | null): string {
  const normalized = appId?.trim();
  return normalized || DEFAULT_OAUTH_APP_ID;
}

function getAppUrl() {
  return requireEnv("NEXT_PUBLIC_APP_URL");
}

function hasEnvGmailApp() {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

function hasEnvOutlookApp() {
  return Boolean(process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL);
}

export function getDefaultGmailOAuthAppSync(): ResolvedGmailOAuthApp {
  const appUrl = getAppUrl();
  return {
    appId: DEFAULT_OAUTH_APP_ID,
    source: "env",
    clientId: requireEnv("GMAIL_CLIENT_ID"),
    clientSecret: requireEnv("GMAIL_CLIENT_SECRET"),
    redirectUrl: `${appUrl}/api/oauth/gmail`,
    sendScopes: GMAIL_SEND_SCOPES,
  };
}

export function getDefaultOutlookOAuthAppSync(): ResolvedOutlookOAuthApp {
  const tenant = "common";
  const appUrl = getAppUrl();
  return {
    appId: DEFAULT_OAUTH_APP_ID,
    source: "env",
    tenant,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    clientId: requireEnv("OUTLOOK_CLIENT_ID"),
    clientSecret: requireEnv("OUTLOOK_CLIENT_SECRET"),
    redirectUrl: `${appUrl}/api/oauth/outlook`,
    requiredSendScope: "mail.send",
  };
}

async function getOAuthAppFromDb(appId: string, provider: OAuthProviderKind) {
  const rows = await db
    .select()
    .from(oauthApps)
    .where(eq(oauthApps.id, appId));

  const row = rows[0] ?? null;
  if (!row || row.provider !== provider) {
    throw new Error(`OAuth app \"${appId}\" for ${provider} is not configured.`);
  }

  return row;
}

export async function listOAuthAppOptions(provider?: OAuthProviderKind): Promise<OAuthAppOption[]> {
  const rows = provider
    ? await db.select().from(oauthApps).where(eq(oauthApps.provider, provider))
    : await db.select().from(oauthApps);

  const options: OAuthAppOption[] = [];

  if ((!provider || provider === "gmail") && hasEnvGmailApp()) {
    options.push({
      id: DEFAULT_OAUTH_APP_ID,
      provider: "gmail",
      label: "默认 Gmail 应用（环境变量）",
      source: "env",
      clientId: process.env.GMAIL_CLIENT_ID ?? null,
    });
  }

  if ((!provider || provider === "outlook") && hasEnvOutlookApp()) {
    options.push({
      id: DEFAULT_OAUTH_APP_ID,
      provider: "outlook",
      label: "默认 Outlook 应用（环境变量）",
      source: "env",
      tenant: "common",
      clientId: process.env.OUTLOOK_CLIENT_ID ?? null,
    });
  }

  for (const row of rows) {
    options.push({
      id: row.id,
      provider: row.provider as OAuthProviderKind,
      label: row.label,
      source: "db",
      tenant: row.tenant,
      clientId: row.clientId,
    });
  }

  return options.sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    if (a.source !== b.source) return a.source === "env" ? -1 : 1;
    return a.label.localeCompare(b.label, "zh-CN");
  });
}

export async function resolveGmailOAuthApp(appId?: string | null): Promise<ResolvedGmailOAuthApp> {
  const resolvedAppId = normalizeAppId(appId);
  if (resolvedAppId === DEFAULT_OAUTH_APP_ID) {
    return getDefaultGmailOAuthAppSync();
  }

  const row = await getOAuthAppFromDb(resolvedAppId, "gmail");
  const appUrl = getAppUrl();
  return {
    appId: row.id,
    source: "db",
    clientId: row.clientId,
    clientSecret: decrypt(row.clientSecret),
    redirectUrl: `${appUrl}/api/oauth/gmail`,
    sendScopes: GMAIL_SEND_SCOPES,
  };
}

export async function resolveOutlookOAuthApp(appId?: string | null): Promise<ResolvedOutlookOAuthApp> {
  const resolvedAppId = normalizeAppId(appId);
  if (resolvedAppId === DEFAULT_OAUTH_APP_ID) {
    return getDefaultOutlookOAuthAppSync();
  }

  const row = await getOAuthAppFromDb(resolvedAppId, "outlook");
  const tenant = row.tenant?.trim() || "common";
  const appUrl = getAppUrl();
  return {
    appId: row.id,
    source: "db",
    tenant,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    clientId: row.clientId,
    clientSecret: decrypt(row.clientSecret),
    redirectUrl: `${appUrl}/api/oauth/outlook`,
    requiredSendScope: "mail.send",
  };
}
