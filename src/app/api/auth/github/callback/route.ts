import { NextRequest, NextResponse } from "next/server";
import { claimInstallation, getInstallation } from "@/lib/queries/installation";
import { exchangeGitHubCode, fetchGitHubUser, isAllowedGitHubUser } from "@/lib/github-auth";
import { toPublicUrl, withHttpsPreviewCookieCompat } from "@/lib/request-origin";
import {
  createSessionCookieValue,
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyOAuthStateCookie,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(getOAuthStateCookieName())?.value;

  if (!code || !(await verifyOAuthStateCookie(stateCookie, state))) {
    return NextResponse.redirect(toPublicUrl(request, "/login?error=github_state"));
  }

  try {
    const accessToken = await exchangeGitHubCode(code);
    const githubUser = await fetchGitHubUser(accessToken);

    if (!isAllowedGitHubUser(githubUser.login)) {
      return NextResponse.redirect(toPublicUrl(request, "/login?error=github_not_allowed"));
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
      return NextResponse.redirect(toPublicUrl(request, "/login?error=github_not_owner"));
    }

    const sessionValue = await createSessionCookieValue({
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      githubName: githubUser.name,
      githubAvatarUrl: githubUser.avatarUrl,
      setupComplete: Boolean(installation.setupCompletedAt),
    });

    const redirectUrl = toPublicUrl(request, installation.setupCompletedAt ? "/" : "/setup");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(
      getSessionCookieName(),
      sessionValue,
      withHttpsPreviewCookieCompat(request, getSessionCookieOptions())
    );
    response.cookies.set(getOAuthStateCookieName(), "", {
      ...withHttpsPreviewCookieCompat(request, getOAuthStateCookieOptions()),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(toPublicUrl(request, "/login?error=github_callback"));
  }
}
