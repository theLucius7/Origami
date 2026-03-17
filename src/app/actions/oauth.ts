"use server";

import { encodeOAuthState } from "@/lib/oauth-state";
import { getGmailAuthUrl } from "@/lib/providers/gmail";
import { getOutlookAuthUrl } from "@/lib/providers/outlook";

interface OAuthUrlOptions {
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

export async function getGmailOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  return getGmailAuthUrl(options ? encodeOAuthState(options) : undefined);
}

export async function getOutlookOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  return getOutlookAuthUrl(options ? encodeOAuthState(options) : undefined);
}
