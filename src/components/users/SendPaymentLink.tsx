"use client";

import { useState } from "react";
import Button from "@mui/material/Button";

export default function SendPaymentLink({
  membershipId,
  purchaseId,
  appearance = "link",
  onActivate,
  textColor,
}: {
  membershipId: string;
  purchaseId: string;
  appearance?: "link" | "button";
  onActivate?: () => void;
  textColor?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(event: React.MouseEvent) {
    onActivate?.();
    event.stopPropagation();
    setState("sending");
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/payment-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId }),
    });
    setState(response.ok ? "sent" : "error");
  }

  const label = state === "sent" ? "Email sent" : state === "sending" ? "Sending" : state === "error" ? "Try again" : "Email payment link";

  return (
    <Button
      variant={appearance === "button" ? "outlined" : "text"}
      onClick={send}
      disabled={state === "sending" || state === "sent"}
      sx={
        appearance === "button"
          ? { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14, color: textColor } }
          : { "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, justifyContent: "flex-start", color: textColor } }
      }
    >
      {label}
    </Button>
  );
}
