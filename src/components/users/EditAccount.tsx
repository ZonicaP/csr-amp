"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { dialogFooterButton } from "@/components/DialogCloseButton";
import { parseAccountDetails } from "@/lib/users/account-details";

export default function EditAccount({
  membershipId,
  firstName,
  lastName,
  email,
  phone,
}: {
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ firstName, lastName, email, phone: phone ?? "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function begin() {
    setDraft({ firstName, lastName, email, phone: phone ?? "" });
    setMessage(null);
    setSending(false);
    setOpen(true);
  }

  const parsed = parseAccountDetails(draft);
  const unchanged =
    "value" in parsed &&
    parsed.value.firstName === firstName &&
    parsed.value.lastName === lastName &&
    parsed.value.email === email.toLowerCase() &&
    (parsed.value.phone ?? "") === (phone ?? "");

  async function save() {
    if (!("value" in parsed) || unchanged) {
      setMessage("error" in parsed ? parsed.error : null);
      return;
    }
    setSending(true);
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Those details could not be saved");
      setSending(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <IconButton
        aria-label="Edit contact"
        onClick={begin}
        sx={{
          width: 36,
          height: 36,
          color: "#181D27",
          border: "1px solid #E5E7EB",
          borderRadius: "40px",
          "&&": { minWidth: 36, minHeight: 36, p: 0 },
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
          />
        </svg>
      </IconButton>
      <Dialog
        open={open}
        onClose={() => {
          if (!sending) setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
          "& .MuiDialog-paper": {
            m: { xs: 0, md: 4 },
            width: { xs: "100%", md: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", md: 480 },
            borderRadius: { xs: "16px 16px 0 0", md: 2 },
          },
          "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 },
        }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>Account details</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <TextField label="First name" value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value.slice(0, 80) })} fullWidth autoFocus />
            <TextField label="Last name" value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value.slice(0, 80) })} fullWidth />
            <TextField label="Email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value.slice(0, 254) })} fullWidth />
            <TextField label="Phone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value.slice(0, 24) })} helperText="Leave blank if there is no number" fullWidth />
            {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setOpen(false)} disabled={sending} sx={dialogFooterButton}>
                Cancel
              </Button>
              <Button variant="contained" onClick={save} disabled={sending || !("value" in parsed) || unchanged} sx={dialogFooterButton}>
                {sending ? "Saving" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
