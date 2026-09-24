"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import PasswordField from "@/components/auth/PasswordField";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await postJson("/api/auth/session", { email, password });
      setSignedIn(true);
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (signedIn) {
    return <Alert severity="success">You’re signed in.</Alert>;
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
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      <Button type="submit" variant="contained" disabled={pending} fullWidth>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link component={NextLink} href="/forgot-password" underline="hover">
        Forgot password?
      </Link>
      <Link component={NextLink} href="/signup" underline="hover">
        Have an invite? Create your account
      </Link>
    </Stack>
  );
}
