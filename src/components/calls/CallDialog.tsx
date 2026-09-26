"use client";

import { useEffect, useState } from "react";
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
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";

const footerButton = { ...dialogFooterButton, "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const noteLimit = 1000;

type Admin = { id: string; displayName: string };
type Colleague = { id: string; displayName: string; available: boolean };

export default function CallDialog({
  open,
  reference,
  canEscalate,
  onClose,
}: {
  open: boolean;
  reference: string;
  canEscalate: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"end" | "callback" | "escalate" | "transfer" | null>(null);
  const [gaveReference, setGaveReference] = useState(false);
  const [confirmedNothingElse, setConfirmedNothingElse] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [csrId, setCsrId] = useState("");
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [csrError, setCsrError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setGaveReference(false);
    setConfirmedNothingElse(false);
    setNotes("");
    setNotesError(null);
    setAdminId("");
    setAdmins([]);
    setAdminError(null);
    setCsrId("");
    setColleagues([]);
    setCsrError(null);
    setDialogError(null);
    let ignore = false;
    const colleaguesRequest = fetch("/api/calls/colleagues").then(async (response) => {
      const data = (await response.json()) as { colleagues?: Colleague[]; error?: string };
      if (!response.ok) throw new AuthRequestError(data.error ?? "CSRs could not be loaded");
      return data.colleagues ?? [];
    });
    const adminsRequest = canEscalate
      ? fetch("/api/calls/admins").then(async (response) => {
          const data = (await response.json()) as { admins?: Admin[]; error?: string };
          if (!response.ok) throw new AuthRequestError(data.error ?? "Admins could not be loaded");
          return data.admins ?? [];
        })
      : Promise.resolve([] as Admin[]);
    Promise.all([colleaguesRequest, adminsRequest])
      .then(([nextColleagues, nextAdmins]) => {
        if (ignore) return;
        setColleagues(nextColleagues);
        setAdmins(nextAdmins);
      })
      .catch((caught: unknown) => {
        if (ignore) return;
        setColleagues([]);
        setAdmins([]);
        setDialogError(caught instanceof AuthRequestError ? caught.message : "CSRs could not be loaded");
      });
    return () => {
      ignore = true;
    };
  }, [open, reference, canEscalate]);

  function finish() {
    onClose();
    router.refresh();
  }

  async function end() {
    if (!gaveReference || !confirmedNothingElse) return;
    setPending("end");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "end", gaveReference: true, confirmedNothingElse: true, notes });
      finish();
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
      finish();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call back could not be saved");
    } finally {
      setPending(null);
    }
  }

  async function submitTransfer() {
    const available = colleagues.some((colleague) => colleague.available);
    if (!available) {
      setCsrError(colleagues.length === 0 ? "No other CSR is available" : "Every other CSR already has an open call");
      return;
    }
    if (csrId.length === 0) {
      setCsrError("Choose another CSR");
      return;
    }
    setPending("transfer");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "handoff", csrId });
      finish();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be transferred");
    } finally {
      setPending(null);
    }
  }

  async function submitEscalate() {
    const missingNote = notes.trim().length === 0;
    const missingAdmin = admins.length === 0 || adminId.length === 0;
    if (missingNote) setNotesError("Add a note before escalating the call");
    if (admins.length === 0) setAdminError("No admin is available");
    else if (adminId.length === 0) setAdminError("Choose an active admin");
    if (missingNote || missingAdmin) return;
    setPending("escalate");
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "escalate", adminId, note: notes });
      finish();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be escalated");
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog open={open} onClose={() => { if (pending === null) onClose(); }} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264" }}>Call</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          <Box sx={{ py: 1.5, px: 2, borderRadius: 2, backgroundColor: "#E7F0FA", textAlign: "center" }}>
            <Typography sx={{ color: "#717680", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>Reference</Typography>
            <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 28, letterSpacing: "0.08em" }}>{reference}</Typography>
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
          <TextField
            select
            label="Transfer to"
            value={csrId}
            onChange={(event) => {
              setCsrId(event.target.value);
              setCsrError(null);
            }}
            error={csrError !== null}
            helperText={csrError ?? "They keep this reference, and the call stays open. Ask them to refresh."}
            fullWidth
          >
            <MenuItem value="" sx={{ display: "none" }} />
            {colleagues.map((colleague) => (
              <MenuItem key={colleague.id} value={colleague.id} disabled={!colleague.available}>
                {colleague.available ? colleague.displayName : `${colleague.displayName} · On a call`}
              </MenuItem>
            ))}
          </TextField>
          {canEscalate ? (
            <TextField
              select
              label="Admin"
              value={adminId}
              onChange={(event) => {
                setAdminId(event.target.value);
                setAdminError(null);
              }}
              error={adminError !== null}
              helperText={adminError ?? undefined}
              fullWidth
            >
              <MenuItem value="" sx={{ display: "none" }} />
              {admins.map((admin) => (
                <MenuItem key={admin.id} value={admin.id}>{admin.displayName}</MenuItem>
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
            <Button variant="outlined" onClick={submitTransfer} disabled={pending !== null} sx={footerButton}>
              {pending === "transfer" ? "Transferring…" : "Transfer"}
            </Button>
            <Button variant="contained" onClick={end} disabled={pending !== null || !gaveReference || !confirmedNothingElse} sx={footerButton}>
              {pending === "end" ? "Ending…" : "End call"}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
