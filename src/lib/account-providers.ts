import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { accounts, type Account } from "@/lib/db/schema";
import { createEmailProvider, getUpdatedProviderCredentials } from "@/lib/providers/factory";
import type { EmailProvider } from "@/lib/providers/types";
import { eq } from "drizzle-orm";

export interface SendCapableAccountSummary {
  id: string;
  provider: string;
  email: string;
  displayName: string;
  fromAddress: string;
}

export function parseAccountCredentials(account: Account) {
  return JSON.parse(decrypt(account.credentials)) as Record<string, unknown>;
}

export function createProviderForAccount(account: Account): EmailProvider {
  return createEmailProvider(account, parseAccountCredentials(account));
}

export async function getAccountWithProvider(accountId: string): Promise<{
  account: Account;
  provider: EmailProvider;
} | null> {
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId));
  const account = rows[0] ?? null;
  if (!account) return null;

  return {
    account,
    provider: createProviderForAccount(account),
  };
}

export async function persistProviderCredentialsIfNeeded(account: Account, provider: EmailProvider) {
  const updatedCredentials = getUpdatedProviderCredentials(account, provider);
  if (!updatedCredentials) return;

  await db.update(accounts).set({ credentials: updatedCredentials }).where(eq(accounts.id, account.id));
}

export async function listSendCapableAccounts(): Promise<SendCapableAccountSummary[]> {
  const rows = await db.select().from(accounts).orderBy(accounts.createdAt);

  return rows.flatMap((account) => {
    try {
      const provider = createProviderForAccount(account);
      if (!provider.getCapabilities().canSend) return [];

      return [{
        id: account.id,
        provider: account.provider,
        email: account.email,
        displayName: account.displayName ?? account.email,
        fromAddress: account.displayName
          ? `${account.displayName} <${account.email}>`
          : account.email,
      }];
    } catch (error) {
      console.warn("Failed to inspect provider capabilities:", account.email, error);
      return [];
    }
  });
}
