"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { discountPhrase, offerPeriods, type OfferPeriod } from "@/lib/users/discount";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function OfferDiscountDialog({
  open,
  state,
  message,
  maxDiscount,
  sampleAddress,
  closeLabel,
  onClose,
  onDone,
  onSubmit,
  initialPercent = null,
  initialPeriod = null,
  purpose = "offer",
}: {
  open: boolean;
  state: "idle" | "sending" | "sent" | "error";
  message: string | null;
  maxDiscount: number | null;
  sampleAddress: boolean;
  closeLabel: string;
  onClose: () => void;
  onDone: () => void;
  onSubmit: (percent: number, period: OfferPeriod) => void;
  initialPercent?: number | null;
  initialPeriod?: OfferPeriod | null;
  purpose?: "offer" | "update";
}) {
  const [percent, setPercent] = useState(initialPercent == null ? "" : String(initialPercent));
  const [period, setPeriod] = useState<OfferPeriod>(initialPeriod ?? "3-months");
  const discount = Number(percent);
  const ready = Number.isInteger(discount) && discount >= 1 && discount <= 100 && (maxDiscount == null || discount <= maxDiscount);
  const periodLabel = offerPeriods.find((item) => item.value === period)?.label;
  const updating = purpose === "update";
  const mailNote = sampleAddress ? "This membership uses a sample address, so the email was sent to you." : "The email was sent to the member.";

  return (
    <Dialog open={open} onClose={state === "sent" ? onDone : onClose} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264", pb: 1 }}>{state === "sent" ? (updating ? "Discount updated" : "Discount offered") : updating ? "Update discount" : "Offer discounted membership"}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          {state === "sent" ? (
            <Typography sx={{ color: "#181D27", fontSize: 14 }}>
              {discountPhrase(discount, periodLabel ?? "")} {updating ? "is the current discount." : "was offered."} {mailNote}
            </Typography>
          ) : (
            <>
              <TextField
                label="Discount %"
                value={percent}
                onChange={(event) => setPercent(event.target.value.replace(/\D/g, "").slice(0, 3))}
                helperText={maxDiscount == null ? undefined : `Up to ${maxDiscount}%`}
                fullWidth
                autoFocus
              />
              <TextField select label="Period" value={period} onChange={(event) => setPeriod(event.target.value as OfferPeriod)} fullWidth>
                {offerPeriods.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </TextField>
            </>
          )}
          {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
          <Stack direction="row" spacing={1}>
            {state === "sent" ? (
              <DialogCloseButton short onClick={onDone} />
            ) : (
              <>
                <Button variant="outlined" onClick={onClose} disabled={state === "sending"} sx={{ ...dialogFooterButton, ...compactButton }}>
                  {closeLabel}
                </Button>
                <Button variant="contained" onClick={() => onSubmit(discount, period)} disabled={state === "sending" || !ready} sx={{ ...dialogFooterButton, ...compactButton }}>
                  {state === "sending" ? "Sending" : updating ? "Update discount" : "Send offer"}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
