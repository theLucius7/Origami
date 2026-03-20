import { NextRequest, NextResponse } from "next/server";
import { toPublicUrl } from "@/lib/request-origin";
import { getOAuthStateCookieName, getOAuthStateCookieOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(toPublicUrl(request, "/login?error=github_callback"));
  response.cookies.set(getOAuthStateCookieName(), "", {
    ...getOAuthStateCookieOptions(),
    maxAge: 0,
  });
  return response;
}
