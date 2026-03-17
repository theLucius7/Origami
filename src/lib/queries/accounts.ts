import { cache } from "react";
import { db } from "@/lib/db";
import { accounts, emails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AccountRuntimeHealthSummary {
  hydrationPendingCount: number;
  hydrationFailedCount: number;
  latestHydrationError: string | null;
  latestHydrationAt: number | null;
  readWriteBackPendingCount: number;
  readWriteBackFailedCount: number;
  latestReadWriteBackError: string | null;
  latestReadWriteBackAt: number | null;
  starWriteBackPendingCount: number;
  starWriteBackFailedCount: number;
  latestStarWriteBackError: string | null;
  latestStarWriteBackAt: number | null;
}

interface AccountRuntimeHealthRow {
  accountId: string;
  hydrationStatus: string;
  hydratedAt: number | null;
  hydrationError: string | null;
  readWriteBackStatus: string;
  readWriteBackAt: number | null;
  readWriteBackError: string | null;
  starWriteBackStatus: string;
  starWriteBackAt: number | null;
  starWriteBackError: string | null;
}

export const EMPTY_ACCOUNT_RUNTIME_HEALTH: AccountRuntimeHealthSummary = {
  hydrationPendingCount: 0,
  hydrationFailedCount: 0,
  latestHydrationError: null,
  latestHydrationAt: null,
  readWriteBackPendingCount: 0,
  readWriteBackFailedCount: 0,
  latestReadWriteBackError: null,
  latestReadWriteBackAt: null,
  starWriteBackPendingCount: 0,
  starWriteBackFailedCount: 0,
  latestStarWriteBackError: null,
  latestStarWriteBackAt: null,
};

function createEmptyHealth(): AccountRuntimeHealthSummary {
  return { ...EMPTY_ACCOUNT_RUNTIME_HEALTH };
}

function isNewer(candidateAt: number | null, currentAt: number | null) {
  if (candidateAt === null) return false;
  if (currentAt === null) return true;
  return candidateAt >= currentAt;
}

export function aggregateAccountRuntimeHealth(rows: AccountRuntimeHealthRow[]) {
  const map = new Map<string, AccountRuntimeHealthSummary>();

  for (const row of rows) {
    const current = map.get(row.accountId) ?? createEmptyHealth();

    if (row.hydrationStatus === "hydrating") {
      current.hydrationPendingCount += 1;
    }
    if (row.hydrationStatus === "failed") {
      current.hydrationFailedCount += 1;
      if (row.hydrationError && isNewer(row.hydratedAt, current.latestHydrationAt)) {
        current.latestHydrationError = row.hydrationError;
        current.latestHydrationAt = row.hydratedAt;
      }
    }

    if (row.readWriteBackStatus === "pending") {
      current.readWriteBackPendingCount += 1;
    }
    if (row.readWriteBackStatus === "failed") {
      current.readWriteBackFailedCount += 1;
      if (row.readWriteBackError && isNewer(row.readWriteBackAt, current.latestReadWriteBackAt)) {
        current.latestReadWriteBackError = row.readWriteBackError;
        current.latestReadWriteBackAt = row.readWriteBackAt;
      }
    }

    if (row.starWriteBackStatus === "pending") {
      current.starWriteBackPendingCount += 1;
    }
    if (row.starWriteBackStatus === "failed") {
      current.starWriteBackFailedCount += 1;
      if (row.starWriteBackError && isNewer(row.starWriteBackAt, current.latestStarWriteBackAt)) {
        current.latestStarWriteBackError = row.starWriteBackError;
        current.latestStarWriteBackAt = row.starWriteBackAt;
      }
    }

    map.set(row.accountId, current);
  }

  return map;
}

export const listAccounts = cache(async function listAccounts() {
  return db.select().from(accounts).orderBy(accounts.createdAt);
});

export const getAccountRecordById = cache(async function getAccountRecordById(id: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id));
  return rows[0] ?? null;
});

export const getAccountRecordByEmail = cache(async function getAccountRecordByEmail(email: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.email, email));
  return rows[0] ?? null;
});

export const listAccountRuntimeHealth = cache(async function listAccountRuntimeHealth() {
  const rows = await db
    .select({
      accountId: emails.accountId,
      hydrationStatus: emails.hydrationStatus,
      hydratedAt: emails.hydratedAt,
      hydrationError: emails.hydrationError,
      readWriteBackStatus: emails.readWriteBackStatus,
      readWriteBackAt: emails.readWriteBackAt,
      readWriteBackError: emails.readWriteBackError,
      starWriteBackStatus: emails.starWriteBackStatus,
      starWriteBackAt: emails.starWriteBackAt,
      starWriteBackError: emails.starWriteBackError,
    })
    .from(emails);

  return aggregateAccountRuntimeHealth(rows);
});
