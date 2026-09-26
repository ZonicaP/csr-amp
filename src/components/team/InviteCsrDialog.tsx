"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import { roleLabel, roleMenu, roleOptions, type CsrRoleName } from "@/components/team/team-roles";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function InviteCsrDialog({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: () => void }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CsrRoleName>("AGENT");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function close() {
    if (sending) return;
    setError(null);
    onClose();
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await postJson("/api/csrs", {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        displayName: `${name.trim()} ${surname.trim()}`,
        roles: [role],
      });
      setName("");
      setSurname("");
      setEmail("");
      setRole("AGENT");
      onInvited();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That invite could not be sent");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" sx={sheetDialogSx()}>
      <DialogTitle sx={{ color: "#003264" }}>Invite a CSR</DialogTitle>
      <DialogContent>
        <Stack component="form" id="invite-csr" onSubmit={invite} spacing={2} sx={{ pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="given-name" />
          <TextField label="Surname" value={surname} onChange={(event) => setSurname(event.target.value)} required autoComplete="family-name" />
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <TextField
            select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as CsrRoleName)}
            slotProps={{ select: { renderValue: (value: unknown) => roleLabel(value as CsrRoleName), MenuProps: roleMenu } }}
          >
            {roleOptions()}
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={close} disabled={sending} sx={{ ...dialogFooterButton, ...compactButton }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={sending} sx={{ ...dialogFooterButton, ...compactButton }}>
              {sending ? "Sending…" : "Send invite"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
