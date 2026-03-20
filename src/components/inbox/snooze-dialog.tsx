"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => boolean | Promise<boolean>;
  title?: string;
}

function buildDefaultSnoozeValue() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function SnoozeDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: SnoozeDialogProps) {
  const [value, setValue] = useState(() => buildDefaultSnoozeValue());
  const { messages } = useI18n();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setValue(buildDefaultSnoozeValue());
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title ?? messages.snoozeDialog.title}</DialogTitle>
          <DialogDescription>{messages.snoozeDialog.description}</DialogDescription>
        </DialogHeader>

        <Input
          type="datetime-local"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {messages.common.cancel}
          </Button>
          <Button
            onClick={async () => {
              const confirmed = await onConfirm(value);
              if (confirmed) {
                handleOpenChange(false);
              }
            }}
            disabled={!value}
          >
            {messages.snoozeDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
