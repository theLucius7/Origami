import { DEFAULT_OAUTH_APP_ID } from "@/lib/oauth-apps.shared";
import { getAuthSecret } from "@/lib/secrets";

export interface OAuthStatePayload {
  appId?: string;
  intent?: "writeback";
  enableReadBack?: boolean;
  enableStarBack?: boolean;
}

interface SignedOAuthStatePayload extends OAuthStatePayload {
  v: 1;
  sessionGithubId: string;
  exp: number;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(input: string): Uint8Array {
  const binary = atob(input);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64Url(input: string): string {
  return encodeBase64(new TextEncoder().encode(input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4 || 4)) % 4;
  return new TextDecoder().decode(decodeBase64(base64 + "=".repeat(padding)));
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64(new Uint8Array(signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function verifySignature(value: string, signature: string): Promise<boolean> {
  const expected = await sign(value);
  return expected === signature;
}

export async function encodeOAuthState(
  payload: OAuthStatePayload,
  options: { sessionGithubId: string }
): Promise<string> {
  const signedPayload: SignedOAuthStatePayload = {
    v: 1,
    ...payload,
    appId: payload.appId?.trim() || DEFAULT_OAUTH_APP_ID,
    sessionGithubId: options.sessionGithubId,
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
  };
  const encodedPayload = toBase64Url(JSON.stringify(signedPayload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function decodeOAuthState(
  state: string | null | undefined,
  options: { sessionGithubId: string }
): Promise<OAuthStatePayload | null> {
  if (!state) return null;

  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;
  if (!(await verifySignature(encodedPayload, signature))) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SignedOAuthStatePayload;
    if (payload.v !== 1) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.sessionGithubId !== options.sessionGithubId) return null;
    return {
      appId: payload.appId?.trim() || DEFAULT_OAUTH_APP_ID,
      intent: payload.intent,
      enableReadBack: payload.enableReadBack,
      enableStarBack: payload.enableStarBack,
    };
  } catch {
    return null;
  }
}
