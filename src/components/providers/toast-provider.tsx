"use client";

import { createContext, useCallback, useMemo, useState } from "react";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "error";
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, ...input }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur ${
              item.variant === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-100"
                : "border-border bg-background/95 text-foreground"
            }`}
          >
            <div className="text-sm font-medium">{item.title}</div>
            {item.description && (
              <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
