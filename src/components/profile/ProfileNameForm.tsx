"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, patchJson } from "@/lib/auth/http-client";
import { parseOwnName } from "@/lib/csr/own-name";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function ProfileNameForm({ id, name, surname }: { id: string; name: string; surname: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(name);
  const [lastName, setLastName] = useState(surname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function begin() {
    setFirstName(name);
    setLastName(surname);
    setError(null);
    setSaving(false);
    setOpen(true);
  }

  function close() {
    if (saving) return;
    setOpen(false);
  }

  const parsed = parseOwnName({ name: firstName, surname: lastName });
  const unchanged = "value" in parsed && parsed.value.name === name && parsed.value.surname === surname;

  async function save() {
    if (!("value" in parsed) || unchanged) {
      setError("error" in parsed ? parsed.error : null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patchJson(`/api/csrs/${id}`, { name: parsed.value.name, surname: parsed.value.surname });
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That name could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outlined" onClick={begin} sx={{ minHeight: 40, px: 2, py: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
        Edit
      </Button>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="sm"
        sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>Your name</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <TextField
              label="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value.slice(0, 80))}
              required
              autoFocus
              autoComplete="given-name"
              error={!("value" in parsed) && parsed.error === "Enter a first name"}
              helperText={!("value" in parsed) && parsed.error === "Enter a first name" ? parsed.error : undefined}
              fullWidth
            />
            <TextField
              label="Surname"
              value={lastName}
              onChange={(event) => setLastName(event.target.value.slice(0, 80))}
              required
              autoComplete="family-name"
              error={!("value" in parsed) && parsed.error === "Enter a surname"}
              helperText={!("value" in parsed) && parsed.error === "Enter a surname" ? parsed.error : undefined}
              fullWidth
            />
            {error && error !== "Enter a first name" && error !== "Enter a surname" ? (
              <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{error}</Typography>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={close} disabled={saving} sx={{ ...dialogFooterButton, ...compactButton }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={save} disabled={saving || unchanged || !("value" in parsed)} sx={{ ...dialogFooterButton, ...compactButton }}>
                {saving ? "Saving" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
