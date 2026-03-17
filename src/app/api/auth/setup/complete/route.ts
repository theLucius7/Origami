import { NextRequest, NextResponse } from "next/server";
import { markInstallationSetupComplete } from "@/lib/queries/installation";
import {
  createSessionCookieValue,
  getSessionCookieName,
  getSessionCookieOptions,
  readSessionFromCookies,
} from "@/lib/session";
import { toPublicUrl } from "@/lib/request-origin";

function withHttpsPreviewCookieCompat(request: NextRequest, opts: ReturnType<typeof getSessionCookieOptions>) {
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const isHttps = proto === "https";
  if (process.env.NODE_ENV !== "production" && isHttps) {
    return { ...opts, secure: true, sameSite: "none" as const };
  }
  return opts;
}

export async function POST(request: NextRequest) {
  const session = await readSessionFromCookies(request.cookies);
  if (!session) {
    return NextResponse.redirect(toPublicUrl(request, "/login"));
  }

  await markInstallationSetupComplete();

  const response = NextResponse.redirect(toPublicUrl(request, "/"));
  response.cookies.set(
    getSessionCookieName(),
    await createSessionCookieValue({ ...session, setupComplete: true }),
    withHttpsPreviewCookieCompat(request, getSessionCookieOptions())
  );
  return response;
}
