"use server";

import { runActionResult } from "@/lib/actions";
import { syncAccountById, syncAllAccounts } from "@/lib/services/sync-service";

export async function syncAccount(accountId: string) {
  const result = await runActionResult("syncAccount", async () => syncAccountById(accountId));

  if (!result.ok) {
    return { ok: false as const, synced: 0, error: result.errorMessage };
  }

  return { ok: true as const, synced: result.data.synced };
}

export async function syncAll() {
  const result = await runActionResult("syncAll", async () => syncAllAccounts());

  if (!result.ok) {
    return { ok: false as const, results: [], error: result.errorMessage };
  }

  return { ok: true as const, results: result.data.results };
}
