import type { AppMessages } from "@/i18n/messages";

export function getAccountsNotificationErrorDescription(
  messages: AppMessages,
  error: string
) {
  switch (error) {
    case "invalid_oauth_state":
      return messages.accountsNotifications.invalidOauthState;
    case "oauth_callback_failed":
      return messages.accountsNotifications.oauthCallbackFailed;
    default:
      return messages.accountsNotifications.authFailedDescription;
  }
}

export function getAccountsNotificationSuccessDescription(
  messages: AppMessages,
  success: string
) {
  const count = Number(success);
  if (Number.isFinite(count) && count > 0) {
    return messages.accountsNotifications.connectedAccounts(count);
  }

  return messages.accountsNotifications.oauthAccountConnected;
}
