import { getLocalizedActionErrorFallback, getLocalizedActionErrorMessage } from "@/i18n/action-errors";
import type { AppLocale } from "@/i18n/locale";

export function getSyncFailureMessage(
  locale: AppLocale,
  failure: { error?: string; errorCode?: string; errorDetails?: string }
) {
  if (!failure.errorCode) {
    return failure.error;
  }

  if (failure.errorCode === "UNKNOWN") {
    return getLocalizedActionErrorFallback(locale);
  }

  return getLocalizedActionErrorMessage(
    failure.errorCode,
    locale,
    failure.errorDetails,
    failure.error
  );
}
