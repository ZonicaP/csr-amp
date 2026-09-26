"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import CancelMembershipDialog from "@/components/users/CancelMembershipDialog";
import OfferDiscountDialog from "@/components/users/OfferDiscountDialog";
import { useCustomerNav } from "@/components/users/CustomerNavProvider";
import type { SuggestedAction } from "@/lib/debug/account-issue";

const labels: Record<SuggestedAction["type"], string> = {
  "email-payment-link": "Email payment link",
  "reactivate-membership": "Reactivate membership",
  "cancel-membership": "Cancel membership",
  "offer-discount": "Offer discounted membership",
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
  maxDiscount = 10,
}: {
  membershipId: string;
  action: Exclude<SuggestedAction, { type: "email-payment-link" }>;
  appearance?: "link" | "button";
  onActivate?: () => void;
  onCover?: () => void;
  onReveal?: () => void;
  onDone?: () => void;
  textColor?: string;
  maxDiscount?: number | null;
}) {
  const router = useRouter();
  const nav = useCustomerNav();
  const customerName = nav?.membershipId === membershipId ? nav.name : null;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [sampleAddress, setSampleAddress] = useState(false);

  async function run(extra: Record<string, unknown> = {}) {
    onActivate?.();
    setState("sending");
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...action, ...extra }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; sampleAddress?: boolean } | null;
    if (!response.ok) {
      setMessage(body?.error ?? "That action could not be completed");
      setState("error");
      return;
    }
    setSampleAddress(body?.sampleAddress === true);
    setState("sent");
    if (action.type === "cancel-membership" || action.type === "offer-discount" || action.type === "reactivate-membership") {
      router.refresh();
    }
  }

  function openCancel(event: React.MouseEvent) {
    onActivate?.();
    event.stopPropagation();
    setMessage(null);
    setState("idle");
    setDialogKey((value) => value + 1);
    setCancelOpen(true);
    onCover?.();
  }

  function openOffer(event: React.MouseEvent) {
    onActivate?.();
    event.stopPropagation();
    setMessage(null);
    setState("idle");
    setDialogKey((value) => value + 1);
    setOfferOpen(true);
    onCover?.();
  }

  function reveal() {
    if (state === "sending") return;
    setCancelOpen(false);
    setOfferOpen(false);
    onReveal?.();
  }

  function finish() {
    setCancelOpen(false);
    setOfferOpen(false);
    onDone?.();
  }

  const label = state === "sent" ? "Done" : state === "sending" ? "Sending" : state === "error" ? "Try again" : labels[action.type];

  return (
    <>
      <Button
        variant={appearance === "button" ? "outlined" : "text"}
        onClick={action.type === "cancel-membership" ? openCancel : action.type === "offer-discount" ? openOffer : (event) => { event.stopPropagation(); void run(); }}
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
        <CancelMembershipDialog
          key={dialogKey}
          open={cancelOpen}
          membershipId={membershipId}
          customerName={customerName}
          state={state}
          message={message}
          onClose={reveal}
          onDone={finish}
          onSubmit={(reason) => run({ reason })}
        />
      ) : null}
      {action.type === "offer-discount" ? (
        <OfferDiscountDialog
          key={dialogKey}
          open={offerOpen}
          state={state}
          message={message}
          maxDiscount={maxDiscount ?? null}
          sampleAddress={sampleAddress}
          closeLabel={onReveal ? "Back" : "Close"}
          onClose={reveal}
          onDone={finish}
          onSubmit={(percent, period) => run({ percent, period })}
        />
      ) : null}
    </>
  );
}
