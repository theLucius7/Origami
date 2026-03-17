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

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => void | Promise<void>;
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
  title = "设置稍后看时间",
}: SnoozeDialogProps) {
  const [value, setValue] = useState(() => buildDefaultSnoozeValue());

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            在这个时间之前，邮件会从主列表中临时隐藏。此操作只在 Origami 本地生效。
          </DialogDescription>
        </DialogHeader>

        <Input
          type="datetime-local"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={async () => {
              await onConfirm(value);
              handleOpenChange(false);
            }}
            disabled={!value}
          >
            确认稍后看
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
