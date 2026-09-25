"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AuthLink from "@/components/auth/AuthLink";
import PasswordField from "@/components/auth/PasswordField";
import { postJson } from "@/lib/auth/http-client";
import { useFormRequest } from "@/hooks/useFormRequest";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { error, pending, run } = useFormRequest();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await run(() => postJson<{ csr: { emailVerified: boolean } }>("/api/auth/session", { email, password }));
    if (!result) {
      return;
    }
    router.replace(result.csr.emailVerified ? "/" : "/verify-email");
    router.refresh();
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
      <AuthLink href="/forgot-password">Forgot password?</AuthLink>
      <AuthLink href="/signup">Have an invite? Create your account</AuthLink>
    </Stack>
  );
}
