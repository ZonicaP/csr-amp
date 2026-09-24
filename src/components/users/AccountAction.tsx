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
}: {
  membershipId: string;
  action: Exclude<SuggestedAction, { type: "email-payment-link" }>;
  appearance?: "link" | "button";
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function run(event?: React.MouseEvent) {
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
    setCancelOpen(false);
    if (action.type === "cancel-membership" || action.type === "reactivate-membership") router.refresh();
  }

  function openCancel(event: React.MouseEvent) {
    event.stopPropagation();
    setReason("");
    setMessage(null);
    setState("idle");
    setCancelOpen(true);
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
          ? { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }
          : { "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, justifyContent: "flex-start" } }
      }
    >
      {label}
    </Button>
    {action.type === "cancel-membership" ? (
      <Dialog
        open={prompt !== null}
        onClose={() => {
          if (state !== "sending") setPrompt(null);
        }}
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
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>{prompt === "confirm" ? "Confirm cancellation" : "Cancel membership"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {prompt === "reason" ? (
              <TextField
                label="Reason for cancellation"
                value={reason}
                onChange={(event) => setReason(event.target.value.slice(0, 200))}
                multiline
                minRows={2}
                fullWidth
                autoFocus
              />
            ) : (
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>
                Cancel {membershipId}. Reason: {reason.trim()}
              </Typography>
            )}
            {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              {prompt === "confirm" ? (
                <Button
                  variant="outlined"
                  onClick={() => setPrompt("reason")}
                  disabled={state === "sending"}
                  sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
                >
                  Back
                </Button>
              ) : (
                <span />
              )}
              {prompt === "reason" ? (
                <Button
                  variant="contained"
                  onClick={() => setPrompt("confirm")}
                  disabled={reason.trim().length === 0}
                  sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => run()}
                  disabled={state === "sending"}
                  sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
                >
                  {state === "sending" ? "Cancelling" : "Confirm cancellation"}
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
