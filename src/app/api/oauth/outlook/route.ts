import { NextRequest, NextResponse } from "next/server";
import { addOAuthAccount } from "@/app/actions/account";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { decodeOAuthState } from "@/lib/oauth-state";
import { exchangeOutlookCode } from "@/lib/providers/outlook";
import { getAccountRecordByEmail } from "@/lib/queries/accounts";
import { readSessionFromCookies } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const session = await readSessionFromCookies(request.cookies);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const stateParam = request.nextUrl.searchParams.get("state");
  const state = stateParam
    ? await decodeOAuthState(stateParam, { sessionGithubId: session.githubId })
    : null;
  if (stateParam && !state) {
    return NextResponse.redirect(new URL("/accounts?error=invalid_oauth_state", request.url));
  }

  try {
    const { email, displayName, accessToken, refreshToken, scopes, appId } =
      await exchangeOutlookCode(code, state?.appId);
    await addOAuthAccount(
      "outlook",
      email,
      displayName,
      accessToken,
      refreshToken,
      scopes,
      200,
      appId
    );

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

      return NextResponse.redirect(new URL("/accounts?success=outlook&writebackEnabled=1", request.url));
    }

    return NextResponse.redirect(new URL("/accounts?success=outlook", request.url));
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Outlook OAuth error:", error.message);
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
