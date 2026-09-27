"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallEditGuard } from "@/components/calls/CallEditGuard";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import OfferDiscountDialog from "@/components/users/OfferDiscountDialog";
import { discountPhrase, offerPeriods, type OfferPeriod } from "@/lib/users/discount";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function MembershipDiscount({
  membershipId,
  percent,
  period,
  maxDiscount,
}: {
  membershipId: string;
  percent: number;
  period: OfferPeriod;
  maxDiscount: number | null;
}) {
  const router = useRouter();
  const guardEdit = useCallEditGuard();
  const label = offerPeriods.find((item) => item.value === period)?.label ?? period;
  const phrase = discountPhrase(percent, label);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [sampleAddress, setSampleAddress] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  function begin(next: "update" | "remove") {
    guardEdit(() => {
      setMessage(null);
      setState("idle");
      setSampleAddress(false);
      setDialogKey((value) => value + 1);
      setOfferOpen(next === "update");
      setRemoveOpen(next === "remove");
    });
  }

  function close() {
    if (state === "sending") return;
    const removed = removeOpen && state === "sent";
    setOfferOpen(false);
    setRemoveOpen(false);
    if (removed) router.refresh();
  }

  async function run(body: Record<string, unknown>) {
    setState("sending");
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; sampleAddress?: boolean } | null;
    if (!response.ok) {
      setMessage(payload?.error ?? "That action could not be completed");
      setState("error");
      return;
    }
    setSampleAddress(payload?.sampleAddress === true);
    setState("sent");
    if (body.type !== "remove-discount") router.refresh();
  }

  return (
    <Stack spacing={1}>
      <Stack spacing={0.25}>
        <Typography sx={{ color: "#717680", fontSize: 14 }}>Discount</Typography>
        <Typography>{phrase}</Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => begin("update")} sx={{ ...dialogFooterButton, ...compactButton }}>
          Update discount
        </Button>
        <Button variant="outlined" onClick={() => begin("remove")} sx={{ ...dialogFooterButton, ...compactButton }}>
          Remove discount
        </Button>
      </Stack>
      <OfferDiscountDialog
        key={dialogKey}
        open={offerOpen}
        state={state}
        message={message}
        maxDiscount={maxDiscount}
        sampleAddress={sampleAddress}
        closeLabel="Close"
        initialPercent={percent}
        initialPeriod={period}
        purpose="update"
        onClose={close}
        onDone={close}
        onSubmit={(nextPercent, nextPeriod) => run({ type: "offer-discount", percent: nextPercent, period: nextPeriod })}
      />
      <Dialog open={removeOpen} onClose={close} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>{state === "sent" ? "Discount removed" : "Remove discount"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Typography sx={{ color: "#181D27", fontSize: 14 }}>
              {state === "sent" ? `${phrase} was removed from this membership.` : `Remove ${phrase} from this membership?`}
            </Typography>
            {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
            <Stack direction="row" spacing={1}>
              {state === "sent" ? (
                <DialogCloseButton short onClick={close} />
              ) : (
                <>
                  <Button variant="outlined" onClick={close} disabled={state === "sending"} sx={{ ...dialogFooterButton, ...compactButton }}>
                    Keep discount
                  </Button>
                  <Button variant="contained" color="error" onClick={() => run({ type: "remove-discount" })} disabled={state === "sending"} sx={{ ...dialogFooterButton, ...compactButton }}>
                    {state === "sending" ? "Removing" : "Remove discount"}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
