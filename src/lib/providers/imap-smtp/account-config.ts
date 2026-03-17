import type { Account } from "@/lib/db/schema";
import { getMailboxPreset } from "./presets";
import type { ImapSmtpRuntimeConfig } from "./types";

function toPositiveInt(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toSecureFlag(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

export function resolveImapSmtpConfigFromAccount(
  account: Account,
  creds: Record<string, unknown>
): ImapSmtpRuntimeConfig {
  const presetKey = String(
    creds.presetKey ?? account.presetKey ?? (account.provider === "qq" ? "qq" : "custom")
  );
  const preset = getMailboxPreset(presetKey);

  const label = preset?.label ?? account.displayName ?? account.email;
  const authUser = String(
    creds.authUser ??
      creds.email ??
      account.authUser ??
      account.email
  );
  const authPass = String(
    creds.authPass ??
      creds.authCode ??
      ""
  );

  const imapHost = String(account.imapHost ?? preset?.imapHost ?? "");
  const smtpHost = String(account.smtpHost ?? preset?.smtpHost ?? "");
  const imapPort = toPositiveInt(account.imapPort, preset?.imapPort ?? 993);
  const smtpPort = toPositiveInt(account.smtpPort, preset?.smtpPort ?? 465);
  const defaultSecure = preset?.secure ?? true;
  const imapSecure = toSecureFlag(account.imapSecure, defaultSecure);
  const smtpSecure = toSecureFlag(account.smtpSecure, defaultSecure);

  return {
    label,
    email: account.email,
    authUser,
    authPass,
    imap: {
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
    },
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
    },
  };
}
