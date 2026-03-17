import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getGitHubAuthUrl } from "@/lib/github-auth";
import {
  createOAuthStateCookieValue,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
} from "@/lib/session";

export async function GET() {
  const state = randomUUID();
  const response = NextResponse.redirect(getGitHubAuthUrl(state));
  response.cookies.set(
    getOAuthStateCookieName(),
    await createOAuthStateCookieValue(state),
    getOAuthStateCookieOptions()
  );
  return response;
}
