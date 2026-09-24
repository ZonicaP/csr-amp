"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { postJson } from "@/lib/auth/http-client";
import { requestErrorMessage } from "@/hooks/useFormRequest";

export default function VerifyEmailForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "done" | "error">(token ? "pending" : "error");
  const [message, setMessage] = useState(token ? "" : "Open the verification link from your email.");

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    postJson("/api/auth/verify-email", { token })
      .then(() => {
        if (active) {
          setStatus("done");
        }
      })
      .catch((caught: unknown) => {
        if (!active) {
          return;
        }
        setStatus("error");
        setMessage(requestErrorMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (status === "pending") {
    return <Alert severity="info">Verifying your email…</Alert>;
  }

  if (status === "done") {
    return (
      <Stack spacing={2}>
        <Alert severity="success">Your email is verified.</Alert>
        <Button component={NextLink} href="/" variant="contained" fullWidth>
          Continue
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      <Button component={NextLink} href="/login" variant="outlined" fullWidth>
        Back to sign in
      </Button>
    </Stack>
  );
}
