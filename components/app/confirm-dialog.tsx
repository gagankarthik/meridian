"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="gap-0 rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="px-5 pb-4 pt-5">
          <DialogTitle className="font-display text-lg font-bold tracking-tight text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-ink-muted">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-paper-raised px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "rounded-xl px-4 py-2 text-[13px] font-bold text-white transition-colors",
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-signal hover:bg-signal-strong",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
