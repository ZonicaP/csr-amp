"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { OpenCall } from "@/lib/calls/call-service";
import { clearStartedCall, isCallStarting, readStartedCall, transferCallNotice } from "@/lib/calls/transfer-notice";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14, flexShrink: 0 } };
const refreshWaitMs = 12_000;

export default function TransferredCallNotice({ call }: { call: OpenCall | null }) {
  const router = useRouter();
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

  useEffect(() => {
    let stopped = false;
    let lastRefresh = 0;

    function refresh() {
      if (stopped || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefresh < 2000) return;
      lastRefresh = now;
      router.refresh();
    }

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = window.setInterval(refresh, refreshWaitMs);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  const notice = ready
    ? transferCallNotice({ call, startedReference, dismissedReference, starting })
    : null;
  if (!notice) return null;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Alert
        severity="info"
        role="status"
        onClose={() => setDismissedReference(call?.reference ?? null)}
        sx={{
          alignItems: "center",
          color: "#003264",
          backgroundColor: "#F5FAFF",
          border: "1px solid #E5E7EB",
          "& .MuiAlert-icon": { color: "#0B75E1" },
          "& .MuiAlert-message": { flex: 1, color: "#003264", fontSize: 14, fontWeight: 500 },
          "& .MuiAlert-action": { alignItems: "center", pt: 0 },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5 }}>
          <Box sx={{ flex: 1 }}>{notice.message}</Box>
          <Button component={NextLink} href={notice.href} variant="contained" sx={compactButton}>
            {notice.action}
          </Button>
        </Box>
      </Alert>
    </Box>
  );
}
