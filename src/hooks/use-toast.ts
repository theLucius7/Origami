"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/providers/toast-provider";

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
