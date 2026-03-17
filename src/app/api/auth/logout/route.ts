import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/session";
import { toPublicUrl } from "@/lib/request-origin";

function withHttpsPreviewCookieCompat(request: Request, opts: ReturnType<typeof getSessionCookieOptions>) {
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const isHttps = proto === "https";
  if (process.env.NODE_ENV !== "production" && isHttps) {
    return { ...opts, secure: true, sameSite: "none" as const };
  }
  return opts;
}

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
