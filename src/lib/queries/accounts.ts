import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listAccounts() {
  return db.select().from(accounts).orderBy(accounts.createdAt);
}

export async function getAccountRecordById(id: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id));
  return rows[0] ?? null;
}

export async function getAccountRecordByEmail(email: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.email, email));
  return rows[0] ?? null;
}
