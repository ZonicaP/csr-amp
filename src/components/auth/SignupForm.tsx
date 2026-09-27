"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AuthLink from "@/components/auth/AuthLink";
import PasswordField from "@/components/auth/PasswordField";
import { postJson } from "@/lib/auth/http-client";
import { useFormRequest } from "@/hooks/useFormRequest";
import { parseEmail } from "@/lib/users/account-details";

export default function SignupForm({ token, email, linkExpired }: { token: string; email: string; linkExpired: boolean }) {
  const [address, setAddress] = useState(email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const { error, setError, pending, run } = useFormRequest();

  const parsedEmail = parseEmail(address);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ("error" in parsedEmail) {
      setError(parsedEmail.error);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const result = await run(() => postJson<{ emailSent: boolean }>("/api/invites/accept", { token, email: parsedEmail.value, password }));
    if (result) {
      setEmailSent(result.emailSent);
      setDone(true);
    }
  }

  if (done) {
    return (
      <Stack spacing={2}>
        <Alert severity={emailSent ? "success" : "warning"}>
          {emailSent
            ? "Your account is ready. Check your email to verify it."
            : "Your account is ready, but the verification email could not be sent."}
        </Alert>
        <Button component={NextLink} href="/verify-email" variant="outlined" fullWidth>
          Continue
        </Button>
      </Stack>
    );
  }

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} spacing={2}>
      {linkExpired ? <Alert severity="info">This invite link is no longer valid. Enter the invited email to create the account.</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        disabled={Boolean(email)}
        required
        error={"error" in parsedEmail && address.trim().length > 0}
        helperText={"error" in parsedEmail && address.trim().length > 0 ? parsedEmail.error : undefined}
      />
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
      <AuthLink href="/login">Already have an account? Sign in</AuthLink>
    </Stack>
  );
}
