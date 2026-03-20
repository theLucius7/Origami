import { NextRequest, NextResponse } from "next/server";
import { getOwnerAppAuthContext } from "@/lib/app-session";
import { toPublicUrl } from "@/lib/request-origin";
import { markInstallationSetupComplete } from "@/lib/queries/installation";

export async function POST(request: NextRequest) {
  const authContext = await getOwnerAppAuthContext({
    requestHeaders: request.headers,
    cookieStore: request.cookies,
  });
  if (!authContext) {
    return NextResponse.redirect(toPublicUrl(request, "/login"));
  }

  await markInstallationSetupComplete();

  return NextResponse.redirect(toPublicUrl(request, "/"));
}
