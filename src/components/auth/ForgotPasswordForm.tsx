"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetPath, setResetPath] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await postJson<{ ok: true; resetToken?: string }>("/api/auth/password-reset", { email });
      setResetPath(result.resetToken ? `/reset-password?token=${encodeURIComponent(result.resetToken)}` : "sent");
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (resetPath === "sent") {
    return (
      <Stack spacing={2}>
        <Alert severity="success">If that email belongs to an active CSR, a reset link is ready.</Alert>
        <Button component={NextLink} href="/login" variant="outlined" fullWidth>
          Back to sign in
        </Button>
      </Stack>
    );
  }

  if (resetPath) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">Reset link created for this local environment.</Alert>
        <Button component={NextLink} href={resetPath} variant="contained" fullWidth>
          Choose a new password
        </Button>
      </Stack>
    );
  }

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Button type="submit" variant="contained" disabled={pending} fullWidth>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <Link component={NextLink} href="/login" underline="hover">
        Back to sign in
      </Link>
    </Stack>
  );
}
