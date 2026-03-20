import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toPublicUrl, withHttpsPreviewCookieCompat } from "@/lib/request-origin";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/session";

async function withClearedLegacySessionCookie(response: NextResponse, request: Request): Promise<NextResponse> {
  response.cookies.set(getSessionCookieName(), "", {
    ...withHttpsPreviewCookieCompat(request, getSessionCookieOptions()),
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  const response = await auth.api.signOut({
    headers: new Headers(request.headers),
    asResponse: true,
  });

  return withClearedLegacySessionCookie(
    new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }),
    request
  );
}

export async function GET(request: Request) {
  const response = await auth.api.signOut({
    headers: new Headers(request.headers),
    asResponse: true,
  });

  const redirectResponse = NextResponse.redirect(toPublicUrl(request, "/login"));
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    redirectResponse.headers.append("set-cookie", setCookie);
  }

  return withClearedLegacySessionCookie(redirectResponse, request);
}
