import { NextRequest, NextResponse } from "next/server";
import { exchangeOutlookCode } from "@/lib/providers/outlook";
import { addOAuthAccount } from "@/actions/account";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const { email, displayName, accessToken, refreshToken, scopes } =
      await exchangeOutlookCode(code);
    await addOAuthAccount("outlook", email, displayName, accessToken, refreshToken, scopes);

    return NextResponse.redirect(new URL("/accounts?success=outlook", request.url));
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Outlook OAuth error:", error.message);
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
