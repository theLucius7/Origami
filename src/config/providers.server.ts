import { requireEnv } from "@/config/env";

export const GMAIL_SEND_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

export function getGmailProviderConfig() {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");

  return {
    clientId: requireEnv("GMAIL_CLIENT_ID"),
    clientSecret: requireEnv("GMAIL_CLIENT_SECRET"),
    redirectUrl: `${appUrl}/api/oauth/gmail`,
    sendScopes: GMAIL_SEND_SCOPES,
  };
}

export function getOutlookProviderConfig() {
  const tenant = "common";
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");

  return {
    tenant,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    clientId: requireEnv("OUTLOOK_CLIENT_ID"),
    clientSecret: requireEnv("OUTLOOK_CLIENT_SECRET"),
    redirectUrl: `${appUrl}/api/oauth/outlook`,
    requiredSendScope: "mail.send",
  };
}

export function getQqProviderConfig() {
  return {
    imap: {
      host: "imap.qq.com",
      port: 993,
      secure: true,
    },
    smtp: {
      host: "smtp.qq.com",
      port: 465,
      secure: true,
    },
  };
}
