"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

export default function PayButton({ membershipId, amount }: { membershipId: string; amount: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/pay/${encodeURIComponent(membershipId)}`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "That payment could not be taken");
        setPending(false);
        return;
      }
      router.replace(`/pay/${encodeURIComponent(membershipId)}?paid=1`);
      router.refresh();
    } catch {
      setError("That payment could not be taken");
      setPending(false);
    }
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={pay}
        disabled={pending}
        fullWidth
        sx={{ "&&": { minHeight: 48, backgroundColor: "#0B75E1", color: "#FFFFFF", "&:hover": { backgroundColor: "#0968C7" } } }}
      >
        {pending ? "Paying…" : `Pay ${amount}`}
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </>
  );
}
