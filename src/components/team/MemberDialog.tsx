"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { AuthRequestError, deleteJson, patchJson, postJson } from "@/lib/auth/http-client";
import { primaryRole, roleLabel, roleMenu, roleOptions, type CsrRoleName, type TeamMember } from "@/components/team/team-roles";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const footerButton = { ...dialogFooterButton, ...compactButton };

export default function MemberDialog({ member, onClose, onChanged }: { member: TeamMember | null; onClose: () => void; onChanged: () => void }) {
  const [draftRole, setDraftRole] = useState<CsrRoleName>("AGENT");
  const [seenId, setSeenId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pending, setPending] = useState<"save" | "cancel" | "resend" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (member && member.id !== seenId) {
    setSeenId(member.id);
    setDraftRole(primaryRole(member));
    setCancelOpen(false);
    setPending(null);
    setError(null);
    setSent(false);
  }

  async function saveRole() {
    if (!member || primaryRole(member) === draftRole) {
      onClose();
      return;
    }
    setPending("save");
    setError(null);
    try {
      await patchJson(`/api/csrs/${member.id}`, { roles: [draftRole] });
      onChanged();
      onClose();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That role could not be saved");
    } finally {
      setPending(null);
    }
  }

  async function resendInvite() {
    if (!member) return;
    setPending("resend");
    setError(null);
    setSent(false);
    try {
      await postJson(`/api/csrs/${member.id}`, {});
      setSent(true);
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That invite could not be sent");
    } finally {
      setPending(null);
    }
  }

  async function cancelInvite() {
    if (!member) return;
    setPending("cancel");
    setError(null);
    try {
      await deleteJson(`/api/csrs/${member.id}`);
      setCancelOpen(false);
      onChanged();
      onClose();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That invite could not be cancelled");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Dialog open={Boolean(member) && !cancelOpen} onClose={() => { if (pending === null) onClose(); }} fullWidth maxWidth="sm" sx={sheetDialogSx()}>
        <DialogTitle sx={{ color: "#003264" }}>{member ? `${member.name} ${member.surname}` : "Role"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {member ? <Typography>{member.email}</Typography> : null}
            {error && !cancelOpen ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              select
              label="Role"
              value={draftRole}
              onChange={(event) => setDraftRole(event.target.value as CsrRoleName)}
              slotProps={{ select: { renderValue: (value: unknown) => roleLabel(value as CsrRoleName), MenuProps: roleMenu } }}
            >
              {roleOptions()}
            </TextField>
            {member?.status === "INVITED" ? (
              <Stack spacing={1}>
                {sent ? <Alert severity="success">The invite was sent again.</Alert> : null}
                <Button variant="outlined" onClick={resendInvite} disabled={pending !== null} fullWidth sx={compactButton}>
                  {pending === "resend" ? "Sending…" : "Resend invite"}
                </Button>
                <Button variant="text" onClick={() => setCancelOpen(true)} disabled={pending !== null} fullWidth sx={{ ...compactButton, color: "#FA4362" }}>
                  Cancel invite
                </Button>
              </Stack>
            ) : null}
            <Stack direction="row" spacing={1}>
              <DialogCloseButton onClick={onClose} disabled={pending !== null} />
              <Button variant="contained" onClick={saveRole} disabled={pending !== null} sx={footerButton}>
                {pending === "save" ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog open={cancelOpen} onClose={() => { if (pending === null) setCancelOpen(false); }} fullWidth maxWidth="xs" sx={sheetDialogSx()}>
        <DialogTitle sx={{ color: "#003264" }}>Cancel invite</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Typography>{member ? `${member.name} ${member.surname} will not be able to use this invite.` : ""}</Typography>
            {error && cancelOpen ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setCancelOpen(false)} disabled={pending !== null} sx={footerButton}>
                Keep invite
              </Button>
              <Button variant="contained" onClick={cancelInvite} disabled={pending !== null} sx={{ ...footerButton, backgroundColor: "#FA4362", "&:hover": { backgroundColor: "#E03652" } }}>
                {pending === "cancel" ? "Cancelling…" : "Cancel invite"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
