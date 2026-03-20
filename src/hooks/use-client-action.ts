"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/providers/i18n-provider";
import { parseSerializedActionError } from "@/lib/actions";
import { getLocalizedActionErrorFallback, getLocalizedActionErrorMessage } from "@/i18n/action-errors";
import { APP_LOCALE_COOKIE, DEFAULT_APP_LOCALE, normalizeAppLocale, type AppLocale } from "@/i18n/locale";
import { mapRuntimeErrorToMessage } from "@/lib/runtime-errors";

export interface ClientActionToast {
  title: string;
  description?: string;
  variant?: "default" | "error";
}

export interface ClientActionFailure {
  title?: string;
  description?: string;
  toast?: ClientActionToast | false | null;
}

type MaybeToast<T> =
  | ClientActionToast
  | false
  | null
  | undefined
  | ((value: T) => ClientActionToast | false | null | undefined);

interface RunClientActionOptions<T> {
  action: () => Promise<T>;
  refresh?: boolean;
  getFailure?: (result: T) => ClientActionFailure | null | undefined;
  successToast?: MaybeToast<T>;
  errorToast?: MaybeToast<unknown>;
  onSuccess?: (result: T) => void | Promise<void>;
  onFailure?: (failure: ClientActionFailure, result: T) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
}

function resolveClientLocale(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_APP_LOCALE;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${APP_LOCALE_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return normalizeAppLocale(cookie ? decodeURIComponent(cookie) : undefined);
}

export function getClientActionErrorMessage(
  error: unknown,
  fallback?: string,
  localeInput?: AppLocale
) {
  const locale = localeInput ?? resolveClientLocale();
  const localizedFallback = fallback ?? getLocalizedActionErrorFallback(locale);

  const rawMessage =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string" && error.trim()
        ? error
        : null;

  if (!rawMessage) {
    return localizedFallback;
  }

  const serialized = parseSerializedActionError(rawMessage);
  if (serialized) {
    const rawSerializedMessage = serialized.message ?? serialized.details;
    const runtimeMessage = rawSerializedMessage
      ? mapRuntimeErrorToMessage({ locale, error: rawSerializedMessage })
      : null;

    return getLocalizedActionErrorMessage(
      serialized.code,
      locale,
      serialized.details,
      runtimeMessage && runtimeMessage !== rawSerializedMessage ? runtimeMessage : localizedFallback
    );
  }

  const runtimeMessage = mapRuntimeErrorToMessage({ locale, error: rawMessage });
  if (runtimeMessage && runtimeMessage !== rawMessage) {
    return runtimeMessage;
  }

  return localizedFallback;
}

function resolveToast<T>(input: MaybeToast<T>, value: T) {
  return typeof input === "function" ? input(value) : input;
}

export function useClientAction() {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, messages } = useI18n();
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(async <T,>(options: RunClientActionOptions<T>) => {
    setIsPending(true);

    try {
      const result = await options.action();
      const failure = options.getFailure?.(result);

      if (failure) {
        const failureToast =
          failure.toast === undefined
            ? {
                title: failure.title ?? messages.common.actionFailed,
                description: failure.description,
                variant: "error" as const,
              }
            : failure.toast;

        if (failureToast) {
          toast(failureToast);
        }

        await options.onFailure?.(failure, result);
        return undefined;
      }

      await options.onSuccess?.(result);

      if (options.refresh) {
        router.refresh();
      }

      const successToast = resolveToast(options.successToast, result);
      if (successToast) {
        toast(successToast);
      }

      return result;
    } catch (error) {
      const errorToast = resolveToast(options.errorToast, error);

      if (errorToast !== false) {
        toast(
          errorToast ?? {
            title: messages.common.actionFailed,
            description: getClientActionErrorMessage(error, undefined, locale),
            variant: "error",
          }
        );
      }

      await options.onError?.(error);
      return undefined;
    } finally {
      setIsPending(false);
      await options.onSettled?.();
    }
  }, [locale, messages.common.actionFailed, router, toast]);

  return { isPending, run };
}
