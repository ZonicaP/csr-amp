"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { cancellationReasonLimit, cancellationReasons, cancellationSummary } from "@/lib/users/cancellation";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const otherPrefix = "Other: ";

export default function CancelMembershipDialog({
  open,
  membershipId,
  customerName,
  state,
  message,
  onClose,
  onDone,
  onSubmit,
}: {
  open: boolean;
  membershipId: string;
  customerName: string | null;
  state: "idle" | "sending" | "sent" | "error";
  message: string | null;
  onClose: () => void;
  onDone: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const summary = cancellationSummary(reason, notes);

  return (
    <Dialog open={open} onClose={state === "sent" ? onDone : onClose} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264", pb: 1 }}>{state === "sent" ? "Membership cancelled" : "Cancel membership"}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          {state === "sent" ? (
            <Typography sx={{ color: "#181D27", fontSize: 14 }}>
              Membership {membershipId} has been cancelled. A confirmation email was sent.
            </Typography>
          ) : (
            <>
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>
                {customerName ? `${customerName}'s membership ${membershipId}` : `Membership ${membershipId}`} will be cancelled.
              </Typography>
              <TextField select label="Reason for cancellation" value={reason} onChange={(event) => setReason(event.target.value)} fullWidth autoFocus>
                <MenuItem value="" sx={{ display: "none" }} />
                {cancellationReasons.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
              {reason === "Other" ? (
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value.slice(0, cancellationReasonLimit - otherPrefix.length))}
                  multiline
                  minRows={2}
                  fullWidth
                  required
                  autoFocus
                />
              ) : null}
            </>
          )}
          {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
          <Stack direction="row" spacing={1}>
            {state === "sent" ? (
              <DialogCloseButton short onClick={onDone} />
            ) : (
              <>
                <Button variant="outlined" onClick={onClose} disabled={state === "sending"} sx={{ ...dialogFooterButton, ...compactButton }}>
                  Keep membership
                </Button>
                <Button variant="contained" color="error" onClick={() => onSubmit(summary)} disabled={state === "sending" || summary.length === 0} sx={{ ...dialogFooterButton, ...compactButton }}>
                  {state === "sending" ? "Cancelling" : "Cancel membership"}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
