"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import type { SuggestedAction } from "@/lib/debug/account-issue";

const labels: Record<SuggestedAction["type"], string> = {
  "email-payment-link": "Email payment link",
  "reactivate-membership": "Reactivate membership",
  "cancel-membership": "Cancel membership",
  "offer-discount": "Offer 10% off",
  "email-plate-documents": "Email plate documents",
  "refund-charge": "Refund",
};

export default function AccountAction({ membershipId, action }: { membershipId: string; action: Exclude<SuggestedAction, { type: "email-payment-link" }> }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function run(event: React.MouseEvent) {
    event.stopPropagation();
    setState("sending");
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    if (!response.ok) {
      setState("error");
      return;
    }
    setState("sent");
    if (action.type === "cancel-membership" || action.type === "reactivate-membership") router.refresh();
  }

  const label = state === "sent" ? "Done" : state === "sending" ? "Sending" : state === "error" ? "Try again" : labels[action.type];

  return (
    <Button
      variant="text"
      onClick={run}
      disabled={state === "sending" || state === "sent"}
      sx={{ "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, justifyContent: "flex-start" } }}
    >
      {label}
    </Button>
  );
}
