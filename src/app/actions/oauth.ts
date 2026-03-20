"use server";

import { ActionError, runLoggedAction } from "@/lib/actions";
import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import { encodeOAuthState } from "@/lib/oauth-state";
import { getOwnerAppAuthContext } from "@/lib/app-session";
import { getGmailAuthUrl } from "@/lib/providers/gmail";
import { getOutlookAuthUrl } from "@/lib/providers/outlook";

interface OAuthUrlOptions {
  appId?: string;
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

export async function getGmailOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  return runLoggedAction("getGmailOAuthUrl", async () => {
    const authContext = await getOwnerAppAuthContext();
    if (!authContext) {
      throw new ActionError("UNAUTHORIZED", "Authentication is required");
    }

    const appId = options?.appId?.trim() || DEFAULT_OAUTH_APP_ID;
    const sessionBindingId = authContext.session.userId ?? authContext.session.githubId;
    const state = options
      ? await encodeOAuthState({ ...options, appId }, { sessionBindingId })
      : undefined;
    return getGmailAuthUrl(state, appId);
  });
}

export async function getOutlookOAuthUrl(options?: OAuthUrlOptions): Promise<string> {
  return runLoggedAction("getOutlookOAuthUrl", async () => {
    const authContext = await getOwnerAppAuthContext();
    if (!authContext) {
      throw new ActionError("UNAUTHORIZED", "Authentication is required");
    }

    const appId = options?.appId?.trim() || DEFAULT_OAUTH_APP_ID;
    const sessionBindingId = authContext.session.userId ?? authContext.session.githubId;
    const state = options
      ? await encodeOAuthState({ ...options, appId }, { sessionBindingId })
      : undefined;
    return getOutlookAuthUrl(state, appId);
  });
}
