import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/secrets";

const SESSION_COOKIE = "origami_session";
const OAUTH_STATE_COOKIE = "origami_github_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type SessionPayload = {
  v: 1;
  githubId: string;
  githubLogin: string;
  githubName?: string | null;
  githubAvatarUrl?: string | null;
  setupComplete: boolean;
  exp: number;
};

export type AuthSession = Omit<SessionPayload, "v" | "exp">;

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

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getOAuthStateCookieName() {
  return OAUTH_STATE_COOKIE;
}

export async function encodeSession(session: AuthSession): Promise<string> {
  const payload: SessionPayload = {
    v: 1,
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function decodeSession(value?: string | null): Promise<AuthSession | null> {
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  if (!(await verifySignature(encodedPayload, signature))) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (payload.v !== 1) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      githubId: payload.githubId,
      githubLogin: payload.githubLogin,
      githubName: payload.githubName ?? null,
      githubAvatarUrl: payload.githubAvatarUrl ?? null,
      setupComplete: Boolean(payload.setupComplete),
    };
  } catch {
    return null;
  }
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export async function readSessionFromCookies(cookieStore?: CookieReader): Promise<AuthSession | null> {
  const store = cookieStore ?? (await cookies());
  return decodeSession(store.get(SESSION_COOKIE)?.value ?? null);
}

export async function verifyAuth(): Promise<boolean> {
  return Boolean(await readSessionFromCookies());
}

export async function createSessionCookieValue(session: AuthSession): Promise<string> {
  return encodeSession(session);
}

export async function createOAuthStateCookieValue(state: string): Promise<string> {
  const signature = await sign(state);
  return `${state}.${signature}`;
}

export async function verifyOAuthStateCookie(value: string | null | undefined, state: string | null): Promise<boolean> {
  if (!value || !state) return false;
  const [rawState, signature] = value.split(".");
  if (!rawState || !signature) return false;
  if (rawState !== state) return false;
  return verifySignature(rawState, signature);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };
}
