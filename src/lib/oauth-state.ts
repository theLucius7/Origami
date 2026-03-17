export interface OAuthStatePayload {
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

export function encodeOAuthState(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOAuthState(state?: string | null): OAuthStatePayload | null {
  if (!state) return null;

  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    return JSON.parse(json) as OAuthStatePayload;
  } catch {
    return null;
  }
}
