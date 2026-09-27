"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import { useHeldCaller } from "@/components/calls/useHeldCaller";
import { callEditNotice, type CallEditNotice, type CallForEditGuard, type HeldCaller } from "@/lib/calls/edit-guard";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

function runNow(start: () => void) {
  start();
}

const CallEditGuardContext = createContext<(start: () => void) => void>(runNow);

export function useCallEditGuard() {
  return useContext(CallEditGuardContext);
}

export default function CallEditGuard({
  membershipId,
  call,
  busy = null,
  children,
}: {
  membershipId: string;
  call: CallForEditGuard | null;
  busy?: HeldCaller | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const held = useHeldCaller(membershipId, call?.reference ?? null, busy);
  const startRef = useRef<(() => void) | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const linkKey = `${membershipId}\n${call?.reference ?? ""}\n${call?.customer?.membershipId ?? ""}`;
  const [linkedKey, setLinkedKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<CallEditNotice | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkedHere = linkedKey === linkKey;
  const shownCall = useMemo(() => {
    if (!call) return null;
    if (linkedHere && !call.customer) return { reference: call.reference, customer: { membershipId } };
    return call;
  }, [call, linkedHere, membershipId]);

  const guard = useCallback(
    (start: () => void) => {
      const next = callEditNotice(shownCall, membershipId, held);
      if (!next) {
        start();
        return;
      }
      startRef.current = start;
      setNotice(next);
      setError(null);
      setOpen(true);
    },
    [held, membershipId, shownCall],
  );

  function continueEdit() {
    if (startRef.current) pendingRef.current = startRef.current;
    startRef.current = null;
    setError(null);
    setOpen(false);
  }

  function releaseEdit() {
    const start = pendingRef.current;
    pendingRef.current = null;
    start?.();
  }

  function requestClose() {
    if (linking) return;
    continueEdit();
  }

  async function link() {
    if (!notice?.canLink || linking) return;
    setLinking(true);
    setError(null);
    try {
      await postJson("/api/calls/current", { action: "link", membershipId });
      setLinkedKey(linkKey);
      router.refresh();
      continueEdit();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That caller could not be linked");
    } finally {
      setLinking(false);
    }
  }

  return (
    <CallEditGuardContext.Provider value={guard}>
      {children}
      <Dialog
        open={open}
        onClose={requestClose}
        slotProps={{ transition: { onExited: releaseEdit } }}
        fullWidth
        maxWidth="sm"
        sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>{notice?.title ?? "Call not linked"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Typography sx={{ color: "#181D27", fontSize: 14 }}>{notice?.message}</Typography>
            {error ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{error}</Typography> : null}
            <Stack direction="row" spacing={1}>
              <DialogCloseButton short onClick={requestClose} disabled={linking} />
              {notice?.canLink ? (
                <Button variant="contained" onClick={() => void link()} disabled={linking} sx={{ ...dialogFooterButton, ...compactButton }}>
                  {linking ? "Saving" : "This is the caller"}
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </CallEditGuardContext.Provider>
  );
}
