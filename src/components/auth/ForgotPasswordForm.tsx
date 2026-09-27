"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AuthLink from "@/components/auth/AuthLink";
import { postJson } from "@/lib/auth/http-client";
import { useFormRequest } from "@/hooks/useFormRequest";
import { parseEmail } from "@/lib/users/account-details";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { error, setError, pending, run } = useFormRequest();

  const parsedEmail = parseEmail(email);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ("error" in parsedEmail) {
      setError(parsedEmail.error);
      return;
    }
    const result = await run(() => postJson<{ ok: true }>("/api/auth/password-reset", { email: parsedEmail.value }));
    if (result?.ok) {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">If that email belongs to an active CSR, a reset link is on its way.</Alert>
        <Button component={NextLink} href="/login" variant="outlined" fullWidth>
          Back to sign in
        </Button>
      </Stack>
    );
  }

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        error={"error" in parsedEmail && email.trim().length > 0}
        helperText={"error" in parsedEmail && email.trim().length > 0 ? parsedEmail.error : undefined}
      />
      <Button type="submit" variant="contained" disabled={pending} fullWidth>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <AuthLink href="/login">Back to sign in</AuthLink>
    </Stack>
  );
}
