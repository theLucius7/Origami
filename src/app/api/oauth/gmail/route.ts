import { NextRequest, NextResponse } from "next/server";
import { addOAuthAccount } from "@/app/actions/account";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { decodeOAuthState } from "@/lib/oauth-state";
import { exchangeGmailCode } from "@/lib/providers/gmail";
import { getAccountRecordByEmail } from "@/lib/queries/accounts";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = decodeOAuthState(request.nextUrl.searchParams.get("state"));

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const { email, accessToken, refreshToken, scopes } = await exchangeGmailCode(code);
    await addOAuthAccount("gmail", email, email, accessToken, refreshToken, scopes);

    if (state?.intent === "writeback") {
      const account = await getAccountRecordByEmail(email);
      if (account) {
        await db
          .update(accounts)
          .set({
            ...(state.enableReadBack ? { syncReadBack: 1 } : {}),
            ...(state.enableStarBack ? { syncStarBack: 1 } : {}),
          })
          .where(eq(accounts.id, account.id));
      }

      return NextResponse.redirect(new URL("/accounts?success=gmail&writebackEnabled=1", request.url));
    }

    return NextResponse.redirect(new URL("/accounts?success=gmail", request.url));
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Gmail OAuth error:", error.message);
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
