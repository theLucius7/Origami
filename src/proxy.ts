import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOwnerAppAuthContext } from "@/lib/app-session";
import { toPublicUrl } from "@/lib/request-origin";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/better-auth", "/api/oauth", "/api/cron"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const authContext = await getOwnerAppAuthContext({
    requestHeaders: request.headers,
    cookieStore: request.cookies,
  });
  if (authContext) {
    if (!authContext.isSetupComplete && pathname !== "/setup") {
      return NextResponse.redirect(toPublicUrl(request, "/setup"));
    }

    if (authContext.isSetupComplete && pathname === "/setup") {
      return NextResponse.redirect(toPublicUrl(request, "/"));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("next-action")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(toPublicUrl(request, "/login"));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
