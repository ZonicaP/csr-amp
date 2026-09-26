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
import { offerPeriods, type OfferPeriod } from "@/lib/users/discount";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function OfferDiscountDialog({
  open,
  state,
  message,
  maxDiscount,
  closeLabel,
  onClose,
  onDone,
  onSubmit,
}: {
  open: boolean;
  state: "idle" | "sending" | "sent" | "error";
  message: string | null;
  maxDiscount: number | null;
  closeLabel: string;
  onClose: () => void;
  onDone: () => void;
  onSubmit: (percent: number, period: OfferPeriod) => void;
}) {
  const [percent, setPercent] = useState("");
  const [period, setPeriod] = useState<OfferPeriod>("3-months");
  const discount = Number(percent);
  const ready = Number.isInteger(discount) && discount >= 1 && discount <= 100 && (maxDiscount == null || discount <= maxDiscount);
  const periodLabel = offerPeriods.find((item) => item.value === period)?.label;

  return (
    <Dialog open={open} onClose={state === "sent" ? onDone : onClose} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264", pb: 1 }}>{state === "sent" ? "Discount offered" : "Offer discounted membership"}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          {state === "sent" ? (
            <Typography sx={{ color: "#181D27", fontSize: 14 }}>
              {discount}% off for {periodLabel} was offered. The email was sent to you.
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
                  {state === "sending" ? "Sending" : "Send offer"}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
