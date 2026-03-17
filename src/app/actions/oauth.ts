"use server";

import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import { encodeOAuthState } from "@/lib/oauth-state";
import { getGmailAuthUrl } from "@/lib/providers/gmail";
import { getOutlookAuthUrl } from "@/lib/providers/outlook";

interface OAuthUrlOptions {
  appId?: string;
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

export async function getGmailOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  const appId = options?.appId?.trim() || DEFAULT_OAUTH_APP_ID;
  return getGmailAuthUrl(options ? encodeOAuthState({ ...options, appId }) : undefined, appId);
}

export async function getOutlookOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  const appId = options?.appId?.trim() || DEFAULT_OAUTH_APP_ID;
  return getOutlookAuthUrl(options ? encodeOAuthState({ ...options, appId }) : undefined, appId);
}
