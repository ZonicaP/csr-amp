"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton from "@/components/DialogCloseButton";
import type { SuggestedAction } from "@/lib/debug/account-issue";

const labels: Record<SuggestedAction["type"], string> = {
  "email-payment-link": "Email payment link",
  "reactivate-membership": "Reactivate membership",
  "cancel-membership": "Cancel membership",
  "offer-discount": "Offer 10% off",
  "email-plate-documents": "Email plate documents",
  "refund-charge": "Refund",
};

export default function AccountAction({
  membershipId,
  action,
  appearance = "link",
  onActivate,
  onCover,
  onReveal,
  onDone,
  textColor,
}: {
  membershipId: string;
  action: Exclude<SuggestedAction, { type: "email-payment-link" }>;
  appearance?: "link" | "button";
  onActivate?: () => void;
  onCover?: () => void;
  onReveal?: () => void;
  onDone?: () => void;
  textColor?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function run(event?: React.MouseEvent) {
    onActivate?.();
    event?.stopPropagation();
    setState("sending");
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.type === "cancel-membership" ? { ...action, reason: reason.trim() } : action),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "That action could not be completed");
      setState("error");
      return;
    }
    setState("sent");
    if (action.type === "cancel-membership") {
      router.refresh();
      return;
    }
    if (action.type === "reactivate-membership") router.refresh();
  }

  function openCancel(event: React.MouseEvent) {
    onActivate?.();
    event.stopPropagation();
    setReason("");
    setMessage(null);
    setState("idle");
    setCancelOpen(true);
    onCover?.();
  }

  function reveal() {
    if (state === "sending") return;
    setCancelOpen(false);
    onReveal?.();
  }

  function finish() {
    setCancelOpen(false);
    onDone?.();
  }

  const label = state === "sent" ? "Done" : state === "sending" ? "Sending" : state === "error" ? "Try again" : labels[action.type];

  return (
    <>
    <Button
      variant={appearance === "button" ? "outlined" : "text"}
      onClick={action.type === "cancel-membership" ? openCancel : run}
      disabled={state === "sending" || (state === "sent" && action.type !== "cancel-membership")}
      sx={
        appearance === "button"
          ? { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14, color: textColor } }
          : { "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, justifyContent: "flex-start", color: textColor } }
      }
    >
      {label}
    </Button>
    {action.type === "cancel-membership" ? (
      <Dialog
        open={cancelOpen}
        onClose={state === "sent" ? finish : reveal}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
          "& .MuiDialog-paper": {
            m: { xs: 0, md: 4 },
            width: { xs: "100%", md: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", md: 480 },
            borderRadius: { xs: "16px 16px 0 0", md: 2 },
          },
          "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 },
        }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>{state === "sent" ? "Membership cancelled" : "Cancel membership"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {state === "sent" ? (
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>
                Membership {membershipId} has been cancelled. A confirmation email was sent.
              </Typography>
            ) : (
              <TextField
                label="Reason for cancellation"
                value={reason}
                onChange={(event) => setReason(event.target.value.slice(0, 200))}
                multiline
                minRows={2}
                fullWidth
                autoFocus
              />
            )}
            {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              {state !== "sent" && onReveal ? (
                <Button variant="outlined" onClick={reveal} disabled={state === "sending"} sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              {state === "sent" ? (
                <DialogCloseButton onClick={finish} />
              ) : (
                <Button
                  variant="contained"
                  onClick={() => run()}
                  disabled={state === "sending" || reason.trim().length === 0}
                  sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
                >
                  {state === "sending" ? "Cancelling" : "Cancel"}
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    ) : null}
    </>
  );
}
