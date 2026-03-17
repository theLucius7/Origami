function normalizeSecret(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getAuthSecret(): string {
  const secret = normalizeSecret(process.env.AUTH_SECRET) ?? normalizeSecret(process.env.ENCRYPTION_KEY);
  if (!secret) {
    throw new Error("Missing AUTH_SECRET or ENCRYPTION_KEY");
  }
  return secret;
}

export async function deriveScopedSecret(scope: string): Promise<string> {
  const secret = getAuthSecret();
  const payload = new TextEncoder().encode(`${scope}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getCronSecret(): Promise<string> {
  return normalizeSecret(process.env.CRON_SECRET) ?? deriveScopedSecret("origami-cron");
}

export function hasGitHubOAuthConfig(): boolean {
  return Boolean(
    normalizeSecret(process.env.GITHUB_CLIENT_ID) &&
      normalizeSecret(process.env.GITHUB_CLIENT_SECRET) &&
      normalizeSecret(process.env.NEXT_PUBLIC_APP_URL)
  );
}

export function getGitHubOAuthConfig() {
  const clientId = normalizeSecret(process.env.GITHUB_CLIENT_ID);
  const clientSecret = normalizeSecret(process.env.GITHUB_CLIENT_SECRET);
  const appUrl = normalizeSecret(process.env.NEXT_PUBLIC_APP_URL);

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error("GitHub OAuth requires GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL");
  }

  return {
    clientId,
    clientSecret,
    appUrl,
    redirectUrl: `${appUrl.replace(/\/$/, "")}/api/auth/github/callback`,
  };
}

export function getAllowedGitHubLogin(): string | null {
  return normalizeSecret(process.env.GITHUB_ALLOWED_LOGIN)?.toLowerCase() ?? null;
}
