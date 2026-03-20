import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { authUsers } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { claimInstallation, getInstallation } from "@/lib/queries/installation";
import { getAllowedGitHubLogin, getAuthSecret, getGitHubOAuthConfig, hasGitHubOAuthConfig } from "@/lib/secrets";

type OwnerCandidate = {
  githubId?: string | null;
  githubLogin?: string | null;
};

export type OwnerAuthSession = {
  userId: string;
  githubId: string;
  githubLogin: string;
  githubName: string;
  githubAvatarUrl: string | null;
  setupComplete: boolean;
};

function normalizeGitHubLogin(login?: string | null): string | null {
  const trimmed = login?.trim().toLowerCase();
  return trimmed || null;
}

function getBetterAuthBaseUrl(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return appUrl || undefined;
}

async function assertAllowedOwnerCandidate(candidate: OwnerCandidate): Promise<void> {
  const githubId = candidate.githubId?.trim();
  const githubLogin = normalizeGitHubLogin(candidate.githubLogin);

  if (!githubId || !githubLogin) {
    throw new APIError("BAD_REQUEST", {
      message: "github_callback",
    });
  }

  const allowedGitHubLogin = getAllowedGitHubLogin();
  if (allowedGitHubLogin && githubLogin !== allowedGitHubLogin) {
    throw new APIError("FORBIDDEN", {
      message: "github_not_allowed",
    });
  }

  const installation = await getInstallation();
  if (installation && installation.ownerGithubId !== githubId) {
    throw new APIError("FORBIDDEN", {
      message: "github_not_owner",
    });
  }
}

const githubConfig = hasGitHubOAuthConfig() ? getGitHubOAuthConfig() : null;

export const auth = betterAuth({
  appName: "Origami",
  baseURL: getBetterAuthBaseUrl(),
  basePath: "/api/better-auth",
  secret: getAuthSecret(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: githubConfig
    ? {
        github: {
          clientId: githubConfig.clientId,
          clientSecret: githubConfig.clientSecret,
          mapProfileToUser(profile) {
            return {
              githubId: String(profile.id),
              githubLogin: normalizeGitHubLogin(profile.login) ?? profile.login,
            };
          },
        },
      }
    : undefined,
  onAPIError: {
    errorURL: "/login",
  },
  user: {
    additionalFields: {
      githubId: {
        type: "string",
        required: true,
        input: false,
        returned: false,
        fieldName: "github_id",
      },
      githubLogin: {
        type: "string",
        required: true,
        input: false,
        fieldName: "github_login",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const githubId = user.githubId as string | undefined;
          const githubLogin = normalizeGitHubLogin(user.githubLogin as string | undefined);

          await assertAllowedOwnerCandidate({ githubId, githubLogin });

          return {
            data: {
              ...user,
              githubId,
              githubLogin,
              name: user.name?.trim() || githubLogin || user.email,
            },
          };
        },
        async after(user) {
          const githubId = typeof user.githubId === "string" ? user.githubId : null;
          const githubLogin = normalizeGitHubLogin(
            typeof user.githubLogin === "string" ? user.githubLogin : null
          );

          if (!githubId || !githubLogin) {
            return;
          }

          await claimInstallation({
            ownerGithubId: githubId,
            ownerGithubLogin: githubLogin,
            ownerUserId: user.id,
            ownerGithubName: user.name,
            ownerGithubAvatarUrl: user.image ?? null,
          });
        },
      },
    },
    session: {
      create: {
        async before(session) {
          const user = await db.query.authUsers.findFirst({
            where: eq(authUsers.id, session.userId),
          });

          if (!user) {
            throw new APIError("UNAUTHORIZED", {
              message: "github_not_owner",
            });
          }

          await assertAllowedOwnerCandidate({
            githubId: user.githubId,
            githubLogin: user.githubLogin,
          });

          return {
            data: session,
          };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export async function getOwnerAuthSession(options?: {
  requestHeaders?: HeadersInit;
}): Promise<OwnerAuthSession | null> {
  const session = await auth.api.getSession({
    headers: options?.requestHeaders ?? (await headers()),
  });

  if (!session) {
    return null;
  }

  const [installation, user] = await Promise.all([
    getInstallation(),
    db.query.authUsers.findFirst({
      where: eq(authUsers.id, session.user.id),
    }),
  ]);

  if (!user) {
    return null;
  }

  if (installation?.ownerUserId && installation.ownerUserId !== session.user.id) {
    return null;
  }

  return {
    userId: session.user.id,
    githubId: user.githubId,
    githubLogin: user.githubLogin,
    githubName: session.user.name,
    githubAvatarUrl: session.user.image ?? null,
    setupComplete: Boolean(installation?.setupCompletedAt),
  };
}

export async function verifyAuth(): Promise<boolean> {
  return Boolean(await getOwnerAuthSession());
}
