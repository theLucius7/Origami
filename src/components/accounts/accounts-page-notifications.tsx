"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const WRITEBACK_TOAST_KEY = "origami-writeback-enabled-toast-shown";

export function maybeShowWriteBackEnabledToastOnce(toast: (input: { title: string; description?: string; variant?: "default" | "error" }) => void) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(WRITEBACK_TOAST_KEY) === "1") return;

  toast({
    title: "写回已开启",
    description: "Origami 的操作将同步到你的原邮箱。",
  });
  window.localStorage.setItem(WRITEBACK_TOAST_KEY, "1");
}

export function AccountsPageNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const writebackEnabled = searchParams.get("writebackEnabled");

    if (!success && !error && !writebackEnabled) return;

    if (error) {
      toast({ title: "授权失败", description: error, variant: "error" });
    } else if (writebackEnabled === "1") {
      toast({ title: "授权成功", description: "写回已启用" });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WRITEBACK_TOAST_KEY, "1");
      }
    } else if (success) {
      toast({ title: "授权成功", description: `已连接 ${success} 账号。` });
    }

    router.replace(pathname);
  }, [pathname, router, searchParams, toast]);

  return null;
}
