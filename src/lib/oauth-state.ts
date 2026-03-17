import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";

export interface OAuthStatePayload {
  appId?: string;
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

export function encodeOAuthState(payload: OAuthStatePayload): string {
  return Buffer.from(
    JSON.stringify({
      ...payload,
      appId: payload.appId?.trim() || DEFAULT_OAUTH_APP_ID,
    }),
    "utf8"
  ).toString("base64url");
}

export function decodeOAuthState(state?: string | null): OAuthStatePayload | null {
  if (!state) return null;

  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    const payload = JSON.parse(json) as OAuthStatePayload;
    return {
      ...payload,
      appId: payload.appId?.trim() || DEFAULT_OAUTH_APP_ID,
    };
  } catch {
    return null;
  }
}
