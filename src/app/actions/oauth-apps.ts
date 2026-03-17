"use server";

import { count, eq } from "drizzle-orm";
import { runLoggedAction } from "@/lib/actions";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { accounts, oauthApps } from "@/lib/db/schema";
import { listOAuthAppOptions } from "@/lib/oauth-apps";
import { getOAuthAppRecordById } from "@/lib/queries/oauth-apps";

export interface OAuthAppFormInput {
  id: string;
  provider: "gmail" | "outlook";
  label: string;
  clientId: string;
  clientSecret?: string;
  tenant?: string;
}

function normalizeAppId(value: string) {
  const id = value.trim().toLowerCase();
  if (!id) throw new Error("OAuth App ID 不能为空");
  if (id === "default") throw new Error("default 保留给环境变量默认应用，不能用于数据库配置");
  if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(id)) {
    throw new Error("OAuth App ID 只能包含小写字母、数字、下划线和连字符，且长度为 2-63");
  }
  return id;
}

function normalizeLabel(value: string) {
  const label = value.trim();
  if (!label) throw new Error("应用名称不能为空");
  return label;
}

function normalizeClientId(value: string) {
  const clientId = value.trim();
  if (!clientId) throw new Error("Client ID 不能为空");
  return clientId;
}

function normalizeTenant(provider: "gmail" | "outlook", tenant?: string) {
  if (provider !== "outlook") return null;
  const normalized = tenant?.trim();
  return normalized || "common";
}

export async function getOAuthAppOptions(provider?: "gmail" | "outlook") {
  return listOAuthAppOptions(provider);
}

export async function addOAuthApp(input: OAuthAppFormInput) {
  return runLoggedAction("addOAuthApp", async () => {
    const id = normalizeAppId(input.id);
    const label = normalizeLabel(input.label);
    const clientId = normalizeClientId(input.clientId);
    const clientSecret = input.clientSecret?.trim();
    if (!clientSecret) throw new Error("Client Secret 不能为空");

    await db.insert(oauthApps).values({
      id,
      provider: input.provider,
      label,
      clientId,
      clientSecret: encrypt(clientSecret),
      tenant: normalizeTenant(input.provider, input.tenant),
    });

    return id;
  });
}

export async function updateOAuthApp(input: OAuthAppFormInput) {
  return runLoggedAction("updateOAuthApp", async () => {
    const existing = await getOAuthAppRecordById(input.id, input.provider);
    if (!existing) throw new Error("OAuth 应用不存在");

    const patch: Partial<typeof oauthApps.$inferInsert> = {
      label: normalizeLabel(input.label),
      clientId: normalizeClientId(input.clientId),
      tenant: normalizeTenant(input.provider, input.tenant),
    };

    const clientSecret = input.clientSecret?.trim();
    if (clientSecret) {
      patch.clientSecret = encrypt(clientSecret);
    }

    await db.update(oauthApps).set(patch).where(eq(oauthApps.id, existing.id));
    return existing.id;
  });
}

export async function removeOAuthApp(id: string) {
  return runLoggedAction("removeOAuthApp", async () => {
    const normalizedId = normalizeAppId(id);
    const usageRows = await db
      .select({ count: count() })
      .from(accounts)
      .where(eq(accounts.oauthAppId, normalizedId));

    const usageCount = usageRows[0]?.count ?? 0;
    if (usageCount > 0) {
      throw new Error(`仍有 ${usageCount} 个账号在使用这个 OAuth 应用，请先重新授权或移除这些账号。`);
    }

    await db.delete(oauthApps).where(eq(oauthApps.id, normalizedId));
  });
}
