"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import { routeAfterCallAction } from "@/lib/calls/after-end";
import { hasDialogHistoryMarker } from "@/lib/dialog-history";

type CurrentCallResult = { call?: { status?: string } };

const footerButton = { ...dialogFooterButton, "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const noteLimit = 1000;

type Colleague = { id: string; displayName: string; available: boolean };
type CallTab = "end" | "transfer" | "callback";

function tabPanel(active: boolean) {
  return {
    gridArea: "1 / 1",
    minWidth: 0,
    visibility: active ? "visible" : "hidden",
    pointerEvents: active ? "auto" : "none",
  } as const;
}

function NoteField({
  notes,
  notesError,
  onNotes,
}: {
  notes: string;
  notesError: string | null;
  onNotes: (value: string) => void;
}) {
  return (
    <TextField
      label="Anything else we should be aware of"
      value={notes}
      onChange={(event) => onNotes(event.target.value.slice(0, noteLimit))}
      error={notesError !== null}
      helperText={notesError ?? undefined}
      multiline
      minRows={2}
      fullWidth
    />
  );
}

export default function CallDialog({
  open,
  reference,
  onClose,
}: {
  open: boolean;
  reference: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<CallTab>("end");
  const [pending, setPending] = useState<"end" | "callback" | "transfer" | null>(null);
  const [gaveReference, setGaveReference] = useState(false);
  const [confirmedNothingElse, setConfirmedNothingElse] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [csrId, setCsrId] = useState("");
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [csrError, setCsrError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("end");
    setGaveReference(false);
    setConfirmedNothingElse(false);
    setNotes("");
    setNotesError(null);
    setCsrId("");
    setColleagues([]);
    setCsrError(null);
    setDialogError(null);
    let ignore = false;
    fetch("/api/calls/colleagues")
      .then(async (response) => {
        const data = (await response.json()) as { colleagues?: Colleague[]; error?: string };
        if (!response.ok) throw new AuthRequestError(data.error ?? "CSRs could not be loaded");
        return data.colleagues ?? [];
      })
      .then((nextColleagues) => {
        if (ignore) return;
        setColleagues(nextColleagues);
      })
      .catch((caught: unknown) => {
        if (ignore) return;
        setColleagues([]);
        setDialogError(caught instanceof AuthRequestError ? caught.message : "CSRs could not be loaded");
      });
    return () => {
      ignore = true;
    };
  }, [open, reference]);

  function finish(status?: string) {
    const next = routeAfterCallAction(status, reference);
    onClose();
    if (!next) {
      router.refresh();
      return;
    }
    const started = Date.now();
    const go = () => {
      if (hasDialogHistoryMarker(window.history.state) && Date.now() - started < 400) {
        window.setTimeout(go, 16);
        return;
      }
      router.push(next);
      router.refresh();
    };
    window.setTimeout(go, 0);
  }

  function dismiss() {
    if (pending !== null) return;
    onClose();
  }

  function onNotes(value: string) {
    setNotes(value);
    if (value.trim().length > 0) setNotesError(null);
  }

  function selectTab(next: CallTab) {
    setTab(next);
    setNotesError(null);
    setDialogError(null);
  }

  async function end() {
    setPending("end");
    setDialogError(null);
    try {
      const result = await postJson<CurrentCallResult>("/api/calls/current", { action: "end", gaveReference, confirmedNothingElse, notes });
      finish(result.call?.status);
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
      const result = await postJson<CurrentCallResult>("/api/calls/current", { action: "callback", note: notes });
      finish(result.call?.status);
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
      const result = await postJson<CurrentCallResult>("/api/calls/current", { action: "handoff", csrId });
      finish(result.call?.status);
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be transferred");
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog open={open} onClose={dismiss} fullWidth maxWidth="sm" sx={sheetDialogSx()}>
      <DialogTitle sx={{ color: "#003264", pb: 0 }}>Call</DialogTitle>
      <Tabs
        value={tab}
        onChange={(_event, next: CallTab) => selectTab(next)}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          px: 1,
          borderBottom: "1px solid #E5E7EB",
          "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: 14, color: "#717680" },
          "& .Mui-selected": { color: "#0B75E1" },
          "& .MuiTabs-indicator": { backgroundColor: "#0B75E1" },
        }}
      >
        <Tab value="end" label="End" />
        <Tab value="transfer" label="Transfer" />
        <Tab value="callback" label="Callback" />
      </Tabs>
      <DialogContent sx={{ "&&": { pt: 2.5 } }}>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          <Box sx={{ py: 1.5, px: 2, borderRadius: 2, backgroundColor: "#E7F0FA", textAlign: "center" }}>
            <Typography sx={{ color: "#717680", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>Reference</Typography>
            <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 28, letterSpacing: "0.08em" }}>{reference}</Typography>
          </Box>
          <Box sx={{ display: "grid" }}>
            <Box aria-hidden={tab !== "end"} sx={tabPanel(tab === "end")}>
              <Stack spacing={1.5}>
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
                <NoteField notes={notes} notesError={notesError} onNotes={onNotes} />
                {tab === "end" && dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
                <Box sx={{ display: "flex" }}>
                  <Button variant="contained" onClick={end} disabled={pending !== null} sx={footerButton}>
                    {pending === "end" ? "Ending…" : "End call"}
                  </Button>
                </Box>
              </Stack>
            </Box>
            <Box aria-hidden={tab !== "transfer"} sx={tabPanel(tab === "transfer")}>
              <Stack spacing={1.5}>
                <TextField
                  select
                  label="Transfer to"
                  value={csrId}
                  onChange={(event) => {
                    setCsrId(event.target.value);
                    setCsrError(null);
                  }}
                  error={csrError !== null}
                  helperText={csrError ?? "They keep this reference, and the call stays open."}
                  fullWidth
                >
                  <MenuItem value="" sx={{ display: "none" }} />
                  {colleagues.map((colleague) => (
                    <MenuItem key={colleague.id} value={colleague.id} disabled={!colleague.available}>
                      {colleague.available ? colleague.displayName : `${colleague.displayName} · On a call`}
                    </MenuItem>
                  ))}
                </TextField>
                {tab === "transfer" && dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
                <Box sx={{ display: "flex" }}>
                  <Button variant="outlined" onClick={submitTransfer} disabled={pending !== null} sx={footerButton}>
                    {pending === "transfer" ? "Transferring…" : "Transfer"}
                  </Button>
                </Box>
              </Stack>
            </Box>
            <Box aria-hidden={tab !== "callback"} sx={tabPanel(tab === "callback")}>
              <Stack spacing={1.5}>
                <NoteField notes={notes} notesError={notesError} onNotes={onNotes} />
                {tab === "callback" && dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
                <Box sx={{ display: "flex" }}>
                  <Button variant="outlined" onClick={submitCallback} disabled={pending !== null} sx={footerButton}>
                    {pending === "callback" ? "Saving…" : "Call back"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <DialogCloseButton short onClick={dismiss} disabled={pending !== null} />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
