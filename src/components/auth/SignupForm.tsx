"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import PasswordField from "@/components/auth/PasswordField";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";

export default function SignupForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <Stack spacing={2}>
        <Alert severity="info">An admin needs to invite you before you can create an account.</Alert>
        <Button component={NextLink} href="/login" variant="contained" fullWidth>
          Back to sign in
        </Button>
      </Stack>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setPending(true);
    try {
      await postJson("/api/invites/accept", { token, password });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">Your account is ready.</Alert>
        <Button component={NextLink} href="/login" variant="outlined" fullWidth>
          Continue to sign in
        </Button>
      </Stack>
    );
  }

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <PasswordField
        label="Password"
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
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <Link component={NextLink} href="/login" underline="hover">
        Already have an account? Sign in
      </Link>
    </Stack>
  );
}
