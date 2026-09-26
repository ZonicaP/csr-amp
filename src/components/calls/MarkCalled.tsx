"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { AuthRequestError } from "@/lib/auth/http-client";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function MarkCalled({ reference }: { reference: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function markCalled() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/calls/${encodeURIComponent(reference)}/resolve`, { method: "POST" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new AuthRequestError(body.error ?? "Something went wrong");
      router.refresh();
    } catch (caught: unknown) {
      setError(caught instanceof AuthRequestError ? caught.message : "That call could not be marked as called");
    } finally {
      setPending(false);
    }
  }

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button variant="outlined" onClick={markCalled} disabled={pending} sx={compactButton}>
        Mark as called
      </Button>
    </Stack>
  );
}
