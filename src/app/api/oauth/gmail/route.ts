import { NextRequest, NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/providers/gmail";
import { addOAuthAccount } from "@/app/actions/account";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const { email, accessToken, refreshToken, scopes } = await exchangeGmailCode(code);
    await addOAuthAccount("gmail", email, email, accessToken, refreshToken, scopes);

    return NextResponse.redirect(new URL("/accounts?success=gmail", request.url));
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Gmail OAuth error:", error.message);
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
