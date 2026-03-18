import { NextRequest, NextResponse } from "next/server";
import { toPublicUrl } from "@/lib/request-origin";
import { withHttpsPreviewCookieCompat } from "@/lib/cookie-compat";
import { markInstallationSetupComplete } from "@/lib/queries/installation";
import {
  createSessionCookieValue,
  getSessionCookieName,
  getSessionCookieOptions,
  readSessionFromCookies,
} from "@/lib/session";

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
