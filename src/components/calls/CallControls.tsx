"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { dialogFooterButton } from "@/components/DialogCloseButton";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import type { OpenCall } from "@/lib/calls/call-service";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const footerButton = { ...dialogFooterButton, ...compactButton };
const noteLimit = 1000;
const callDialog = {
  "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
  "& .MuiDialog-paper": {
    m: { xs: 0, md: 4 },
    width: { xs: "100%", md: "calc(100% - 64px)" },
    maxWidth: { xs: "100%", md: 480 },
    borderRadius: { xs: "16px 16px 0 0", md: 2 },
  },
  "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 },
};

type Supervisor = { id: string; displayName: string };

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
  const [pending, setPending] = useState<"start" | "end" | "callback" | "escalate" | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [gaveReference, setGaveReference] = useState(false);
  const [confirmedNothingElse, setConfirmedNothingElse] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [supervisorId, setSupervisorId] = useState("");
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [supervisorError, setSupervisorError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  function resetClosing() {
    setGaveReference(false);
    setConfirmedNothingElse(false);
    setNotes("");
    setNotesError(null);
    setSupervisorId("");
    setSupervisors([]);
    setSupervisorError(null);
    setDialogError(null);
  }

  function closeInfo() {
    setInfoOpen(false);
    resetClosing();
  }

  async function openInfo() {
    resetClosing();
    setInfoOpen(true);
    if (!canEscalate) return;
    try {
      const response = await fetch("/api/calls/supervisors");
      const data = (await response.json()) as { supervisors?: Supervisor[]; error?: string };
      if (!response.ok) throw new AuthRequestError(data.error ?? "Supervisors could not be loaded");
      setSupervisors(data.supervisors ?? []);
    } catch (caught) {
      setSupervisors([]);
      setDialogError(caught instanceof AuthRequestError ? caught.message : "Supervisors could not be loaded");
    }
  }

  async function start() {
    setPending("start");
    setError(null);
    try {
      await postJson("/api/calls", {});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That call could not be started");
    } finally {
      setPending(null);
    }
  }

  async function end() {
    if (!gaveReference || !confirmedNothingElse) return;
    setPending("end");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "end", gaveReference: true, confirmedNothingElse: true, notes });
      closeInfo();
      router.refresh();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be ended");
    } finally {
      setPending(null);
    }
  }

  async function submitCallback() {
    if (notes.trim().length === 0) {
      setNotesError("Add a note before requesting a call back");
      return;
    }
    setPending("callback");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "callback", note: notes });
      closeInfo();
      router.refresh();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call back could not be saved");
    } finally {
      setPending(null);
    }
  }

  async function submitEscalate() {
    const missingNote = notes.trim().length === 0;
    const missingSupervisor = supervisors.length === 0 || supervisorId.length === 0;
    if (missingNote) setNotesError("Add a note before escalating the call");
    if (supervisors.length === 0) setSupervisorError("No supervisor is available");
    else if (supervisorId.length === 0) setSupervisorError("Choose an active supervisor");
    if (missingNote || missingSupervisor) return;
    setPending("escalate");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "escalate", supervisorId, note: notes });
      closeInfo();
      router.refresh();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be escalated");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
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
              onClick={openInfo}
              disabled={pending !== null}
              sx={{ ...compactButton, "&&": { ...compactButton["&&"], backgroundColor: "#0B75E1", color: "#FFFFFF", "&:hover": { backgroundColor: "#0968C7" } } }}
            >
              End call
            </Button>
          ) : (
            <Button variant="contained" onClick={start} disabled={pending !== null} sx={compactButton}>
              {pending === "start" ? "Starting…" : "Start call"}
            </Button>
          )}
        </Stack>
        {error ? <Alert severity="error" sx={{ py: 0, fontSize: 13 }}>{error}</Alert> : null}
      </Box>
      <Dialog open={infoOpen} onClose={() => { if (pending === null) closeInfo(); }} fullWidth maxWidth="sm" sx={callDialog}>
        <DialogTitle sx={{ color: "#003264" }}>Call</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Box sx={{ py: 1.5, px: 2, borderRadius: 2, backgroundColor: "#E7F0FA", textAlign: "center" }}>
              <Typography sx={{ color: "#717680", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>Reference</Typography>
              <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 28, letterSpacing: "0.08em" }}>{call?.reference}</Typography>
            </Box>
            <FormControlLabel
              sx={{ alignItems: "flex-start", mx: 0, "& .MuiFormControlLabel-label": { fontSize: 14, pt: "9px" } }}
              control={<Checkbox checked={gaveReference} onChange={(event) => setGaveReference(event.target.checked)} sx={{ color: "#0B75E1", "&.Mui-checked": { color: "#0B75E1" } }} />}
              label="I gave the caller their reference number"
            />
            <FormControlLabel
              sx={{ alignItems: "flex-start", mx: 0, "& .MuiFormControlLabel-label": { fontSize: 14, pt: "9px" } }}
              control={<Checkbox checked={confirmedNothingElse} onChange={(event) => setConfirmedNothingElse(event.target.checked)} sx={{ color: "#0B75E1", "&.Mui-checked": { color: "#0B75E1" } }} />}
              label="I confirmed the caller has nothing else"
            />
            <TextField
              label="Anything else we should be aware of"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value.slice(0, noteLimit));
                if (event.target.value.trim().length > 0) setNotesError(null);
              }}
              error={notesError !== null}
              helperText={notesError ?? undefined}
              multiline
              minRows={2}
              fullWidth
            />
            {canEscalate ? (
              <TextField
                select
                label="Supervisor"
                value={supervisorId}
                onChange={(event) => {
                  setSupervisorId(event.target.value);
                  setSupervisorError(null);
                }}
                error={supervisorError !== null}
                helperText={supervisorError ?? undefined}
                fullWidth
              >
                <MenuItem value="" sx={{ display: "none" }} />
                {supervisors.map((supervisor) => (
                  <MenuItem key={supervisor.id} value={supervisor.id}>{supervisor.displayName}</MenuItem>
                ))}
              </TextField>
            ) : null}
            {dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={submitCallback} disabled={pending !== null} sx={footerButton}>
                {pending === "callback" ? "Saving…" : "Call back"}
              </Button>
              {canEscalate ? (
                <Button variant="outlined" onClick={submitEscalate} disabled={pending !== null} sx={footerButton}>
                  {pending === "escalate" ? "Saving…" : "Escalate"}
                </Button>
              ) : null}
              <Button variant="contained" onClick={end} disabled={pending !== null || !gaveReference || !confirmedNothingElse} sx={footerButton}>
                {pending === "end" ? "Ending…" : "End call"}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
