"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CallDialog from "@/components/calls/CallDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import type { OpenCall } from "@/lib/calls/call-service";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function CallControls({
  call,
  canEscalate = false,
  align = "end",
}: {
  call: OpenCall | null;
  canEscalate?: boolean;
  align?: "start" | "end";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      await postJson("/api/calls", {});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That call could not be started");
    } finally {
      setPending(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: align === "start" ? "flex-start" : "flex-end", flexShrink: 0, gap: 0.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
        {call ? (
          <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>
            {call.reference}
            {call.customer ? ` · ${call.customer.firstName}` : ""}
          </Typography>
        ) : null}
        {call ? (
          <Button
            variant="contained"
            onClick={() => setInfoOpen(true)}
            sx={{ ...compactButton, "&&": { ...compactButton["&&"], backgroundColor: "#0B75E1", color: "#FFFFFF", "&:hover": { backgroundColor: "#0968C7" } } }}
          >
            End call
          </Button>
        ) : (
          <Button variant="contained" onClick={start} disabled={pending} sx={compactButton}>
            {pending ? "Starting…" : "Start call"}
          </Button>
        )}
      </Stack>
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={(_event, reason) => {
          if (reason === "clickaway") return;
          setError(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "&.MuiSnackbar-anchorOriginBottomCenter": {
            bottom: { xs: "calc(76px + env(safe-area-inset-bottom))", md: 24 },
            left: 16,
            right: 16,
            transform: "none",
          },
        }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%", alignItems: "center" }}>
          {error}
        </Alert>
      </Snackbar>
      {call ? (
        <CallDialog open={infoOpen} reference={call.reference} canEscalate={canEscalate} onClose={() => setInfoOpen(false)} />
      ) : null}
    </Box>
  );
}
