"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { browserDialogHistory } from "@/lib/dialog-history";

export function useDialogHistory(open: boolean, onClose: () => void) {
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const history = browserDialogHistory();
    history.upsert(id, open, () => closeRef.current());
    return () => history.remove(id);
  }, [id, open]);
}
