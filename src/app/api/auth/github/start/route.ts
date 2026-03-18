import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getGitHubAuthUrl } from "@/lib/github-auth";
import { withHttpsPreviewCookieCompat } from "@/lib/cookie-compat";
import {
  createOAuthStateCookieValue,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
} from "@/lib/session";

export async function GET(request: Request) {
  const state = randomUUID();
  const response = NextResponse.redirect(getGitHubAuthUrl(state));
  response.cookies.set(
    getOAuthStateCookieName(),
    await createOAuthStateCookieValue(state),
    withHttpsPreviewCookieCompat(request, getOAuthStateCookieOptions())
  );
  return response;
}
