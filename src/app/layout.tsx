import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Origami",
  description: "Serverless 多邮箱管理工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <TooltipProvider delayDuration={0}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
