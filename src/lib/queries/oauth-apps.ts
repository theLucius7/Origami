import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthApps } from "@/lib/db/schema";

export async function listOAuthApps(provider?: "gmail" | "outlook") {
  const query = db.select().from(oauthApps);

  if (provider) {
    return query.where(eq(oauthApps.provider, provider)).orderBy(asc(oauthApps.provider), asc(oauthApps.createdAt));
  }

  return query.orderBy(asc(oauthApps.provider), asc(oauthApps.createdAt));
}

export async function getOAuthAppRecordById(id: string, provider?: "gmail" | "outlook") {
  const rows = provider
    ? await db
        .select()
        .from(oauthApps)
        .where(and(eq(oauthApps.id, id), eq(oauthApps.provider, provider)))
    : await db.select().from(oauthApps).where(eq(oauthApps.id, id));

  return rows[0] ?? null;
}
