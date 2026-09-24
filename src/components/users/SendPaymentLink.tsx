"use client";

import { useState } from "react";
import Button from "@mui/material/Button";

export default function SendPaymentLink({ membershipId, purchaseId }: { membershipId: string; purchaseId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(event: React.MouseEvent) {
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
      variant="text"
      onClick={send}
      disabled={state === "sending" || state === "sent"}
      sx={{ "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, justifyContent: "flex-start" } }}
    >
      {label}
    </Button>
  );
}
