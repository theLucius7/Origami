import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/oauth", "/api/cron"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const session = await decodeSession(request.cookies.get("origami_session")?.value ?? null);
  if (session) {
    if (!session.setupComplete && pathname !== "/setup") {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In proxied/preview environments (e.g. Codespaces), redirects from a Server Action
  // request can surface as an opaque "Invalid Server Actions request".
  // Prefer an explicit 401 so the client gets a clear auth failure.
  if (request.headers.get("next-action")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
