"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";

const footerButton = { ...dialogFooterButton, "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

type Colleague = { id: string; displayName: string; available: boolean };

export default function TransferCallDialog({
  open,
  reference,
  onClose,
}: {
  open: boolean;
  reference: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [csrId, setCsrId] = useState("");
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [csrError, setCsrError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
      .then((next) => {
        if (!ignore) setColleagues(next);
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

  async function transfer() {
    const available = colleagues.some((colleague) => colleague.available);
    if (!available) {
      setCsrError(colleagues.length === 0 ? "No other CSR is available" : "Every other CSR already has an open call");
      return;
    }
    if (csrId.length === 0) {
      setCsrError("Choose another CSR");
      return;
    }
    setPending(true);
    setDialogError(null);
    try {
      await postJson("/api/calls/current", { action: "handoff", csrId });
      onClose();
      router.refresh();
    } catch (caught) {
      setDialogError(caught instanceof AuthRequestError ? caught.message : "That call could not be transferred");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => { if (!pending) onClose(); }} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264" }}>Transfer call</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          <Box sx={{ py: 1.5, px: 2, borderRadius: 2, backgroundColor: "#E7F0FA", textAlign: "center" }}>
            <Typography sx={{ color: "#717680", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>Reference</Typography>
            <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 28, letterSpacing: "0.08em" }}>{reference}</Typography>
          </Box>
          <TextField
            select
            label="CSR"
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
          {dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={pending} sx={footerButton}>
              Close
            </Button>
            <Button variant="contained" onClick={transfer} disabled={pending} sx={footerButton}>
              {pending ? "Transferring…" : "Transfer"}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
