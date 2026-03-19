"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  getAccountsNotificationErrorDescription,
  getAccountsNotificationSuccessDescription,
} from "./accounts-notification-errors";

const WRITEBACK_TOAST_KEY = "origami-writeback-enabled-toast-shown";

export function maybeShowWriteBackEnabledToastOnce(
  toast: (input: { title: string; description?: string; variant?: "default" | "error" }) => void,
  messages?: ReturnType<typeof useI18n>["messages"]
) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(WRITEBACK_TOAST_KEY) === "1") return;

  if (messages) {
    toast({
      title: messages.accountsNotifications.writeBackEnabledTitle,
      description: messages.accountsNotifications.writeBackEnabledDescription,
    });
  }
  window.localStorage.setItem(WRITEBACK_TOAST_KEY, "1");
}

export function AccountsPageNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { messages } = useI18n();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const writebackEnabled = searchParams.get("writebackEnabled");

    if (!success && !error && !writebackEnabled) return;

    if (error) {
      toast({
        title: messages.accountsNotifications.authFailed,
        description: getAccountsNotificationErrorDescription(messages, error),
        variant: "error",
      });
    } else if (writebackEnabled === "1") {
      toast({ title: messages.accountsNotifications.authSuccess, description: messages.accountsNotifications.writeBackEnabled });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WRITEBACK_TOAST_KEY, "1");
      }
    } else if (success) {
      toast({
        title: messages.accountsNotifications.authSuccess,
        description: getAccountsNotificationSuccessDescription(messages, success),
      });
    }

    router.replace(pathname);
  }, [messages, pathname, router, searchParams, toast]);

  return null;
}
