"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

export function getClientActionErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后重试。"
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function resolveToast<T>(input: MaybeToast<T>, value: T) {
  return typeof input === "function" ? input(value) : input;
}

export function useClientAction() {
  const router = useRouter();
  const { toast } = useToast();
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
                title: failure.title ?? "操作失败",
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
            title: "操作失败",
            description: getClientActionErrorMessage(error),
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
  }, [router, toast]);

  return { isPending, run };
}
