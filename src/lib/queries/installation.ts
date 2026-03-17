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
  ownerGithubName?: string | null;
  ownerGithubAvatarUrl?: string | null;
}) {
  const existing = await getInstallation();
  if (existing) return existing;

  await db.insert(appInstallation).values({
    id: INSTALLATION_ROW_ID,
    ownerGithubId: input.ownerGithubId,
    ownerGithubLogin: input.ownerGithubLogin,
    ownerGithubName: input.ownerGithubName ?? null,
    ownerGithubAvatarUrl: input.ownerGithubAvatarUrl ?? null,
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
