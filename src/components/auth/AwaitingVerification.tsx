"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { postJson } from "@/lib/auth/http-client";
import { useFormRequest } from "@/hooks/useFormRequest";

export default function AwaitingVerification({ email }: { email: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const { error, pending, run } = useFormRequest();

  async function resend() {
    const result = await run(() => postJson("/api/auth/verify-email/resend", {}));
    if (result) {
      setSent(true);
    }
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">We sent a verification link to {email}. Open it on this device, then come back and continue.</Alert>
      {sent ? <Alert severity="success">A new verification email is on its way.</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button variant="contained" disabled={pending} fullWidth onClick={resend}>
        {pending ? "Sending…" : "Resend email"}
      </Button>
      <Button variant="outlined" fullWidth onClick={() => router.refresh()}>
        I’ve verified my email
      </Button>
      <Button variant="text" fullWidth onClick={signOut}>
        Sign out
      </Button>
    </Stack>
  );
}
