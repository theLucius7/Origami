import { NextResponse } from "next/server";
import { toPublicUrl } from "@/lib/request-origin";
import { withHttpsPreviewCookieCompat } from "@/lib/cookie-compat";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    ...withHttpsPreviewCookieCompat(request, getSessionCookieOptions()),
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(toPublicUrl(request, "/login"));
  response.cookies.set(getSessionCookieName(), "", {
    ...withHttpsPreviewCookieCompat(request, getSessionCookieOptions()),
    maxAge: 0,
  });
  return response;
}
