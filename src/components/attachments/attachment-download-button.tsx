"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/providers/i18n-provider";

export function AttachmentDownloadButton({
  attachmentId,
  filename,
  className,
  children,
}: {
  attachmentId: string;
  filename: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const { messages } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) return;
    setIsDownloading(true);

    let description = messages.common.attachmentDownloadFailed;

    try {
      const response = await fetch(`/api/attachments/${encodeURIComponent(attachmentId)}`);

      if (!response.ok) {
        try {
          const data = await response.json();
          if (data?.error && typeof data.error === "string") {
            description = data.error;
          }
        } catch {
          // ignore JSON parse failures and use localized fallback below
        }

        throw new Error("attachment_download_failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      toast({
        title: messages.common.actionFailed,
        description,
        variant: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={isDownloading}
      className={className}
    >
      {children}
    </button>
  );
}
