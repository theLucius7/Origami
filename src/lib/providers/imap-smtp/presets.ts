import type { AppLocale } from "@/i18n/locale";
import type { MailboxPreset } from "./types";

export const MAILBOX_PRESET_KEYS = ["qq", "163", "vip163", "126", "vip126", "yeah", "custom"] as const;

const MAILBOX_PRESET_LABELS: Record<string, Record<AppLocale, string>> = {
  qq: { "zh-CN": "QQ 邮箱", "zh-TW": "QQ 郵箱", en: "QQ Mail", ja: "QQ メール" },
  "163": { "zh-CN": "163 邮箱", "zh-TW": "163 郵箱", en: "163 Mail", ja: "163 メール" },
  vip163: { "zh-CN": "VIP 163 邮箱", "zh-TW": "VIP 163 郵箱", en: "VIP 163 Mail", ja: "VIP 163 メール" },
  "126": { "zh-CN": "126 邮箱", "zh-TW": "126 郵箱", en: "126 Mail", ja: "126 メール" },
  vip126: { "zh-CN": "VIP 126 邮箱", "zh-TW": "VIP 126 郵箱", en: "VIP 126 Mail", ja: "VIP 126 メール" },
  yeah: { "zh-CN": "Yeah 邮箱", "zh-TW": "Yeah 郵箱", en: "Yeah Mail", ja: "Yeah メール" },
  custom: { "zh-CN": "自定义 IMAP/SMTP", "zh-TW": "自訂 IMAP/SMTP", en: "Custom IMAP/SMTP", ja: "カスタム IMAP/SMTP" },
};

export const MAILBOX_PRESETS: Record<string, MailboxPreset> = {
  qq: {
    key: "qq",
    label: "QQ 邮箱",
    imapHost: "imap.qq.com",
    imapPort: 993,
    smtpHost: "smtp.qq.com",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://service.mail.qq.com/detail/0/337",
    canSend: true,
  },
  "163": {
    key: "163",
    label: "163 邮箱",
    imapHost: "imap.163.com",
    imapPort: 993,
    smtpHost: "smtp.163.com",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://www.getmailspring.com/setup/access-163-com-via-imap-smtp",
    canSend: true,
  },
  vip163: {
    key: "vip163",
    label: "VIP 163 邮箱",
    imapHost: "imap.vip.163.com",
    imapPort: 993,
    smtpHost: "smtp.vip.163.com",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://llmbase.ai/openclaw/imap-smtp-email/",
    canSend: true,
  },
  "126": {
    key: "126",
    label: "126 邮箱",
    imapHost: "imap.126.com",
    imapPort: 993,
    smtpHost: "smtp.126.com",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://www.getmailbird.com/setup/access-126-com-via-imap-smtp",
    canSend: true,
  },
  vip126: {
    key: "vip126",
    label: "VIP 126 邮箱",
    imapHost: "imap.vip.126.com",
    imapPort: 993,
    smtpHost: "smtp.vip.126.com",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://llmbase.ai/openclaw/imap-smtp-email/",
    canSend: true,
  },
  yeah: {
    key: "yeah",
    label: "Yeah 邮箱",
    imapHost: "imap.yeah.net",
    imapPort: 993,
    smtpHost: "smtp.yeah.net",
    smtpPort: 465,
    secure: true,
    authType: "authcode",
    helpUrl: "https://smtpedia.com/yeah-net-email-settings-pop3-imap-and-smtp/",
    canSend: true,
  },
  custom: {
    key: "custom",
    label: "自定义 IMAP/SMTP",
    imapHost: "",
    imapPort: 993,
    smtpHost: "",
    smtpPort: 465,
    secure: true,
    authType: "password",
    helpUrl: "https://knowledge.hubspot.com/connected-email/find-your-email-server-imap-and-smtp-information",
    canSend: true,
  },
};

export function getMailboxPreset(key?: string | null): MailboxPreset | null {
  if (!key) return null;
  return MAILBOX_PRESETS[key] ?? null;
}

export function listMailboxPresets(): MailboxPreset[] {
  return Object.values(MAILBOX_PRESETS);
}

export function getMailboxPresetLabel(key: string | undefined | null, locale: AppLocale): string {
  if (!key) return locale === "en" ? "Mailbox" : locale === "ja" ? "メール" : locale === "zh-TW" ? "信箱" : "邮箱";
  return MAILBOX_PRESET_LABELS[key]?.[locale] ?? MAILBOX_PRESETS[key]?.label ?? key;
}
