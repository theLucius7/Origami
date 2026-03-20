import { cookies } from "next/headers";
import { getOwnerAuthSession, type OwnerAuthSession } from "@/lib/auth";
import { getInstallation } from "@/lib/queries/installation";
import { readSessionFromCookies } from "@/lib/session";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type Installation = Awaited<ReturnType<typeof getInstallation>>;

export type AppOwnerSession = {
  source: "better-auth" | "legacy";
  userId: string | null;
  githubId: string;
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
};

export type OwnerAppAuthContext = {
  session: AppOwnerSession;
  installation: Installation;
  isSetupComplete: boolean;
};

function toAppOwnerSession(session: OwnerAuthSession): AppOwnerSession {
  return {
    source: "better-auth",
    userId: session.userId,
    githubId: session.githubId,
    githubLogin: session.githubLogin,
    githubName: session.githubName,
    githubAvatarUrl: session.githubAvatarUrl,
  };
}

export async function getOwnerAppAuthContext(options?: {
  requestHeaders?: HeadersInit;
  cookieStore?: CookieReader;
}): Promise<OwnerAppAuthContext | null> {
  const installation = await getInstallation();

  const ownerSession = await getOwnerAuthSession(
    options?.requestHeaders ? { requestHeaders: options.requestHeaders } : undefined
  );
  if (ownerSession) {
    return {
      session: toAppOwnerSession(ownerSession),
      installation,
      isSetupComplete: Boolean(installation?.setupCompletedAt),
    };
  }

  const cookieStore = options?.cookieStore ?? (await cookies());
  const legacySession = await readSessionFromCookies(cookieStore);
  if (!legacySession) {
    return null;
  }

  if (installation?.ownerGithubId && installation.ownerGithubId !== legacySession.githubId) {
    return null;
  }

  return {
    session: {
      source: "legacy",
      userId: null,
      githubId: legacySession.githubId,
      githubLogin: legacySession.githubLogin,
      githubName: legacySession.githubName ?? null,
      githubAvatarUrl: legacySession.githubAvatarUrl ?? null,
    },
    installation,
    isSetupComplete: Boolean(installation?.setupCompletedAt ?? legacySession.setupComplete),
  };
}
