import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await markInstallationSetupComplete();

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(
    getSessionCookieName(),
    await createSessionCookieValue({ ...session, setupComplete: true }),
    getSessionCookieOptions()
  );
  return response;
}
