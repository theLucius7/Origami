import { NextRequest, NextResponse } from "next/server";
import { claimInstallation, getInstallation } from "@/lib/queries/installation";
import { exchangeGitHubCode, fetchGitHubUser, isAllowedGitHubUser } from "@/lib/github-auth";
import {
  createSessionCookieValue,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyOAuthStateCookie,
} from "@/lib/session";

function withHttpsPreviewCookieCompat(request: NextRequest, opts: ReturnType<typeof getSessionCookieOptions>) {
  // Preview/proxy environments (e.g. Codespaces) can behave like cross-site contexts.
  // SameSite=Lax cookies may be dropped on POST/XHR requests (including Server Actions).
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const isHttps = proto === "https";
  if (process.env.NODE_ENV !== "production" && isHttps) {
    return { ...opts, secure: true, sameSite: "none" as const };
  }
  return opts;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(getOAuthStateCookieName())?.value;

  if (!code || !(await verifyOAuthStateCookie(stateCookie, state))) {
    return NextResponse.redirect(new URL("/login?error=github_state", request.url));
  }

  try {
    const accessToken = await exchangeGitHubCode(code);
    const githubUser = await fetchGitHubUser(accessToken);

    if (!isAllowedGitHubUser(githubUser.login)) {
      return NextResponse.redirect(new URL("/login?error=github_not_allowed", request.url));
    }

    const existingInstallation = await getInstallation();
    const installation = existingInstallation
      ? existingInstallation
      : await claimInstallation({
          ownerGithubId: githubUser.id,
          ownerGithubLogin: githubUser.login,
          ownerGithubName: githubUser.name,
          ownerGithubAvatarUrl: githubUser.avatarUrl,
        });

    if (installation.ownerGithubId !== githubUser.id) {
      return NextResponse.redirect(new URL("/login?error=github_not_owner", request.url));
    }

    const sessionValue = await createSessionCookieValue({
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      githubName: githubUser.name,
      githubAvatarUrl: githubUser.avatarUrl,
      setupComplete: Boolean(installation.setupCompletedAt),
    });

    const redirectUrl = new URL(installation.setupCompletedAt ? "/" : "/setup", request.url);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(
      getSessionCookieName(),
      sessionValue,
      withHttpsPreviewCookieCompat(request, getSessionCookieOptions())
    );
    response.cookies.set(getOAuthStateCookieName(), "", {
      ...withHttpsPreviewCookieCompat(request, getOAuthStateCookieOptions() as any),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/login?error=github_callback", request.url));
  }
}
