"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { dialogFooterButton } from "@/components/DialogCloseButton";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const footerButton = { ...dialogFooterButton, ...compactButton };
const dialogSx = {
  "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
  "& .MuiDialog-paper": {
    m: { xs: 0, md: 4 },
    width: { xs: "100%", md: "calc(100% - 64px)" },
    maxWidth: { xs: "100%", md: 480 },
    borderRadius: { xs: "16px 16px 0 0", md: 2 },
  },
};

export default function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const dismissed = useRef<ServiceWorker | null>(null);
  const reload = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let stopped = false;
    let timer = 0;

    function showIfWaiting() {
      const waiting = registrationRef.current?.waiting ?? null;
      if (!waiting || !navigator.serviceWorker.controller) return;
      if (dismissed.current === waiting) return;
      setOpen(true);
    }

    function onControllerChange() {
      if (reload.current) window.location.reload();
    }

    function check() {
      registrationRef.current?.update().catch(() => undefined);
    }

    function onVisible() {
      if (document.visibilityState === "visible") check();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (stopped) return;
        registrationRef.current = registration;
        showIfWaiting();
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") showIfWaiting();
          });
        });
        timer = window.setInterval(check, 60_000);
        check();
      })
      .catch(() => undefined);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function later() {
    dismissed.current = registrationRef.current?.waiting ?? null;
    setOpen(false);
  }

  function update() {
    const waiting = registrationRef.current?.waiting ?? null;
    reload.current = true;
    if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
    window.setTimeout(() => {
      if (reload.current) window.location.reload();
    }, 1000);
  }

  return (
    <Dialog open={open} onClose={later} fullWidth maxWidth="sm" sx={dialogSx} aria-labelledby="update-title">
      <DialogTitle id="update-title" sx={{ color: "#003264" }}>
        Update available
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          <Typography sx={{ color: "#717680", fontSize: 16 }}>
            A new version of AMP CSR is ready. Update to load the latest version.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={later} sx={footerButton}>
              Later
            </Button>
            <Button variant="contained" onClick={update} sx={footerButton}>
              Update
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
