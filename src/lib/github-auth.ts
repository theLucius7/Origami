import { getAllowedGitHubLogin, getGitHubOAuthConfig } from "@/lib/secrets";

export interface GitHubUser {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}

export function getGitHubAuthUrl(state: string) {
  const config = getGitHubOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGitHubCode(code: string) {
  const config = getGitHubOAuthConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUrl,
    }),
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Failed to exchange GitHub OAuth code");
  }

  return payload.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Origami",
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user profile");
  }

  const userPayload = (await userResponse.json()) as {
    id: number;
    login: string;
    name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  };

  let email = userPayload.email ?? null;
  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Origami",
      },
      cache: "no-store",
    });

    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as Array<{
        email: string;
        primary?: boolean;
        verified?: boolean;
      }>;
      email = emails.find((entry) => entry.primary)?.email ?? emails[0]?.email ?? null;
    }
  }

  return {
    id: String(userPayload.id),
    login: userPayload.login,
    name: userPayload.name ?? null,
    avatarUrl: userPayload.avatar_url ?? null,
    email,
  };
}

export function isAllowedGitHubUser(login: string): boolean {
  const allowed = getAllowedGitHubLogin();
  if (!allowed) return true;
  return login.toLowerCase() === allowed;
}
