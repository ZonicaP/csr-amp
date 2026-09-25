"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PasswordField from "@/components/auth/PasswordField";
import AuthLink from "@/components/auth/AuthLink";
import { putJson } from "@/lib/auth/http-client";
import { useFormRequest } from "@/hooks/useFormRequest";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const { error, setError, pending, run } = useFormRequest();

  if (!token) {
    return (
      <Stack spacing={2}>
        <Alert severity="info">Open the reset link from your email to choose a new password.</Alert>
        <Button component={NextLink} href="/forgot-password" variant="contained" fullWidth>
          Request a reset link
        </Button>
      </Stack>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const result = await run(() => putJson("/api/auth/password-reset", { token, password }));
    if (result) {
      setDone(true);
    }
  }

  if (done) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">Your password has been updated.</Alert>
        <Button component={NextLink} href="/login" variant="contained" fullWidth>
          Sign in
        </Button>
      </Stack>
    );
  }

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <PasswordField
        label="New password"
        name="new-password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        helperText="At least 8 characters"
      />
      <PasswordField
        label="Confirm password"
        name="confirm-password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
      />
      <Button type="submit" variant="contained" disabled={pending} fullWidth>
        {pending ? "Saving…" : "Update password"}
      </Button>
      <AuthLink href="/login">Back to sign in</AuthLink>
    </Stack>
  );
}
