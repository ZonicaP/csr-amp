"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import type { OpenCall } from "@/lib/calls/call-service";
import { clearStartedCall, isCallStarting, readStartedCall, transferCallNotice } from "@/lib/calls/transfer-notice";

const compactButton = {
  "&&": {
    minHeight: 36,
    py: "6px",
    px: 2,
    fontSize: 14,
    flexShrink: 0,
    color: "#003264",
    backgroundColor: "#FDFDFD",
    "&:hover": { backgroundColor: "#F5FAFF" },
  },
};

export default function TransferredCallNotice({ call }: { call: OpenCall | null }) {
  const openReference = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [startedReference, setStartedReference] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [dismissedReference, setDismissedReference] = useState<string | null>(null);

  useEffect(() => {
    const next = call?.reference ?? null;
    if (openReference.current && !next) clearStartedCall(window.localStorage);
    openReference.current = next;
    setStartedReference(readStartedCall(window.localStorage));
    setStarting(isCallStarting(window.localStorage));
    setReady(true);
  }, [call]);

  const notice = ready
    ? transferCallNotice({ call, startedReference, dismissedReference, starting })
    : null;
  function dismiss() {
    setDismissedReference(call?.reference ?? null);
  }

  return (
    <Snackbar
      open={notice !== null}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      onClose={(_event, reason) => {
        if (reason === "clickaway") return;
        dismiss();
      }}
      sx={{
        "&.MuiSnackbar-anchorOriginBottomCenter": {
          bottom: { xs: "calc(64px + env(safe-area-inset-bottom))", md: 24 },
          left: { xs: 12, md: "auto" },
          right: { xs: 12, md: 24 },
          transform: "none",
        },
      }}
    >
      <Paper
        role="status"
        elevation={0}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderRadius: 3,
          color: "#FDFDFD",
          backgroundColor: "#003264",
          boxShadow: "0 8px 24px rgba(0, 50, 100, 0.28)",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{notice?.message}</Box>
        {notice ? (
          <Button component={NextLink} href={notice.href} variant="contained" sx={compactButton} onClick={dismiss}>
            {notice.action}
          </Button>
        ) : null}
        <IconButton aria-label="Close" onClick={dismiss} sx={{ color: "#FDFDFD", width: 36, height: 36 }}>
          <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 18, height: 18, fill: "currentColor" }}>
            <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
          </Box>
        </IconButton>
      </Paper>
    </Snackbar>
  );
}
