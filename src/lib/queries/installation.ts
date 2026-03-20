import { db } from "@/lib/db";
import { appInstallation, type AppInstallation } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const INSTALLATION_ROW_ID = "main";

export async function getInstallation(): Promise<AppInstallation | null> {
  const rows = await db.select().from(appInstallation).where(eq(appInstallation.id, INSTALLATION_ROW_ID));
  return rows[0] ?? null;
}

export async function claimInstallation(input: {
  ownerGithubId: string;
  ownerGithubLogin: string;
  ownerUserId?: string | null;
  ownerGithubName?: string | null;
  ownerGithubAvatarUrl?: string | null;
}) {
  const existing = await getInstallation();
  if (existing) {
    if (!existing.ownerUserId && input.ownerUserId && existing.ownerGithubId === input.ownerGithubId) {
      await db
        .update(appInstallation)
        .set({
          ownerUserId: input.ownerUserId,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(appInstallation.id, INSTALLATION_ROW_ID));
      return (await getInstallation())!;
    }

    return existing;
  }

  await db.insert(appInstallation).values({
    id: INSTALLATION_ROW_ID,
    ownerGithubId: input.ownerGithubId,
    ownerGithubLogin: input.ownerGithubLogin,
    ownerUserId: input.ownerUserId ?? null,
    ownerGithubName: input.ownerGithubName ?? null,
    ownerGithubAvatarUrl: input.ownerGithubAvatarUrl ?? null,
  }).onConflictDoNothing({
    target: appInstallation.id,
  });

  return (await getInstallation())!;
}

export async function markInstallationSetupComplete() {
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(appInstallation)
    .set({
      setupCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(appInstallation.id, INSTALLATION_ROW_ID));

  return getInstallation();
}
