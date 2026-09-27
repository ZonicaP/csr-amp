"use client";

import MuiDialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import { useDialogHistory } from "@/hooks/useDialogHistory";

export default function Dialog({ open, onClose, ...props }: DialogProps) {
  useDialogHistory(Boolean(open), () => {
    onClose?.({}, "escapeKeyDown");
  });
  return <MuiDialog open={open} onClose={onClose} {...props} />;
}
