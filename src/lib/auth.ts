import { cookies } from "next/headers";

const TOKEN_COOKIE = "origami_token";

export async function verifyAuth(): Promise<boolean> {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  return token === expected;
}

export function getTokenCookieName(): string {
  return TOKEN_COOKIE;
}
