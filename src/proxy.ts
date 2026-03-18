import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { toPublicUrl } from "@/lib/request-origin";
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
      return NextResponse.redirect(toPublicUrl(request, "/setup"));
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
