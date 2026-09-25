"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import HighlightMatch from "@/components/HighlightMatch";
import { AuthRequestError, deleteJson, patchJson, postJson } from "@/lib/auth/http-client";
import { csrMatchesQuery } from "@/lib/csr/team-search";

type CsrRoleName = "ADMIN" | "SUPERVISOR" | "AGENT";
type CsrStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type TeamMember = {
  id: string;
  name: string;
  surname: string;
  email: string;
  status: CsrStatus;
  roles: CsrRoleName[];
};

const roles: { value: CsrRoleName; label: string; description: string }[] = [
  { value: "AGENT", label: "Agent", description: "Looks up memberships and can update plates, plans, and contact details. Discounts up to 10%." },
  { value: "SUPERVISOR", label: "Supervisor", description: "Same as an agent, and can cancel a membership, move a plan, and refund a duplicate charge." },
  { value: "ADMIN", label: "Admin", description: "Same as a supervisor, with no discount limit, and can invite staff and change roles." },
];

function roleOptions() {
  return roles.map((entry) => (
    <MenuItem key={entry.value} value={entry.value} sx={{ alignItems: "flex-start", whiteSpace: "normal", py: 1.25 }}>
      <Stack sx={{ minWidth: 0, gap: 0.25 }}>
        <Typography sx={{ fontWeight: 600, color: "#181D27" }}>{entry.label}</Typography>
        <Typography sx={{ color: "#717680", fontSize: 13, lineHeight: 1.4, whiteSpace: "normal" }}>{entry.description}</Typography>
      </Stack>
    </MenuItem>
  ));
}

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

const roleMenu = {
  slotProps: { paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)" } } },
} as const;

function roleLabel(role: CsrRoleName) {
  return roles.find((entry) => entry.value === role)?.label ?? role;
}

function roleBadgeText(role: CsrRoleName, status: CsrStatus) {
  const name = roleLabel(role);
  if (status === "DISABLED") return `${name} · Inactive`;
  if (status === "INVITED") return `${name} · Invited`;
  return name;
}

function RoleBadge({ role, status }: { role: CsrRoleName; status: CsrStatus }) {
  const quiet = status !== "ACTIVE";
  return (
    <Chip
      size="small"
      label={roleBadgeText(role, status)}
      sx={{ fontWeight: 600, color: quiet ? "#717680" : "#003264", backgroundColor: quiet ? "#F5F6F7" : "#E7F0FA" }}
    />
  );
}

function primaryRole(member: TeamMember): CsrRoleName {
  if (member.roles.includes("ADMIN")) return "ADMIN";
  if (member.roles.includes("SUPERVISOR")) return "SUPERVISOR";
  return "AGENT";
}

export default function TeamDirectory({ team, canManage }: { team: TeamMember[]; canManage: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CsrRoleName>("AGENT");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [draftRole, setDraftRole] = useState<CsrRoleName>("AGENT");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const matches = useMemo(() => team.filter((member) => csrMatchesQuery(member, query)), [team, query]);
  const cancelling = team.find((member) => member.id === cancelId) ?? null;

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviting(true);
    setInviteError(null);
    try {
      await postJson("/api/csrs", {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        displayName: `${name.trim()} ${surname.trim()}`,
        roles: [role],
      });
      setInviteOpen(false);
      setName("");
      setSurname("");
      setEmail("");
      setRole("AGENT");
      router.refresh();
    } catch (caught) {
      setInviteError(caught instanceof AuthRequestError ? caught.message : "That invite could not be sent");
    } finally {
      setInviting(false);
    }
  }

  function openMember(member: TeamMember) {
    setEditing(member);
    setDraftRole(primaryRole(member));
    setError(null);
  }

  async function changeRole(member: TeamMember, next: CsrRoleName) {
    if (primaryRole(member) === next) return true;
    setBusyId(member.id);
    setError(null);
    try {
      await patchJson(`/api/csrs/${member.id}`, { roles: [next] });
      router.refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That role could not be saved");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function saveRole() {
    if (!editing) return;
    const saved = await changeRole(editing, draftRole);
    if (saved) setEditing(null);
  }

  async function cancelInvite() {
    if (!cancelId) return;
    setBusyId(cancelId);
    setError(null);
    try {
      await deleteJson(`/api/csrs/${cancelId}`);
      setCancelId(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That invite could not be cancelled");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography component="h1" variant="h1">
          Team
        </Typography>
        {canManage ? (
          <Button variant="contained" onClick={() => { setInviteError(null); setInviteOpen(true); }} sx={{ ...compactButton, flexShrink: 0 }}>
            Invite
          </Button>
        ) : null}
      </Stack>
      <Typography>Look up customer service staff by name, surname, or email.</Typography>
      <Box component="search">
        <TextField
          label="Search team"
          placeholder="Name, surname, or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          autoComplete="off"
          fullWidth
        />
      </Box>
      {error && !editing ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Table aria-label="Team">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((member) => {
                const label = `${member.name} ${member.surname}, ${member.roles.map((entry) => roleBadgeText(entry, member.status)).join(", ")}`;
                return (
                  <TableRow
                    key={member.id}
                    hover={canManage}
                    tabIndex={canManage ? 0 : undefined}
                    role={canManage ? "button" : undefined}
                    aria-label={canManage ? label : undefined}
                    onClick={canManage ? () => openMember(member) : undefined}
                    onKeyDown={
                      canManage
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openMember(member);
                            }
                          }
                        : undefined
                    }
                    sx={{ cursor: canManage ? "pointer" : "default" }}
                  >
                    <TableCell sx={{ color: "#003264", fontWeight: 600 }}>
                      <HighlightMatch text={member.name} query={query} /> <HighlightMatch text={member.surname} query={query} />
                    </TableCell>
                    <TableCell>
                      <HighlightMatch text={member.email} query={query} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                        {member.roles.map((entry) => (
                          <RoleBadge key={entry} role={entry} status={member.status} />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No team members match that search.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
        {matches.map((member) => {
          const label = `${member.name} ${member.surname}, ${member.roles.map((entry) => roleBadgeText(entry, member.status)).join(", ")}`;
          return (
            <Paper
              key={member.id}
              elevation={0}
              component={canManage ? "button" : "div"}
              type={canManage ? "button" : undefined}
              aria-label={canManage ? label : undefined}
              onClick={canManage ? () => openMember(member) : undefined}
              sx={{
                p: 1.5,
                border: "1px solid #E5E7EB",
                borderRadius: 3,
                textAlign: "left",
                font: "inherit",
                color: "inherit",
                backgroundColor: "#FDFDFD",
                width: "100%",
                cursor: canManage ? "pointer" : "default",
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography noWrap sx={{ minWidth: 0, color: "#003264", fontWeight: 600 }}>
                  <HighlightMatch text={member.name} query={query} /> <HighlightMatch text={member.surname} query={query} />
                </Typography>
                <Stack direction="row" sx={{ flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", gap: 0.75 }}>
                  {member.roles.map((entry) => (
                    <RoleBadge key={entry} role={entry} status={member.status} />
                  ))}
                </Stack>
              </Stack>
              <Typography sx={{ color: "#717680", fontSize: 14, mt: 0.5 }}>
                <HighlightMatch text={member.email} query={query} />
              </Typography>
            </Paper>
          );
        })}
        {matches.length === 0 ? <Typography>No team members match that search.</Typography> : null}
      </Stack>
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
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
        }}
      >
        <DialogTitle sx={{ color: "#003264" }}>Invite a CSR</DialogTitle>
        <DialogContent>
          <Stack component="form" id="invite-csr" onSubmit={invite} spacing={2} sx={{ pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {inviteError ? <Alert severity="error">{inviteError}</Alert> : null}
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
              <Button variant="outlined" onClick={() => setInviteOpen(false)} disabled={inviting} sx={{ ...dialogFooterButton, ...compactButton }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={inviting} sx={{ ...dialogFooterButton, ...compactButton }}>
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editing) && !cancelling}
        onClose={() => setEditing(null)}
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
        }}
      >
        <DialogTitle sx={{ color: "#003264" }}>{editing ? `${editing.name} ${editing.surname}` : "Role"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {editing ? <Typography>{editing.email}</Typography> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              select
              label="Role"
              value={draftRole}
              onChange={(event) => setDraftRole(event.target.value as CsrRoleName)}
              slotProps={{ select: { renderValue: (value: unknown) => roleLabel(value as CsrRoleName), MenuProps: roleMenu } }}
            >
              {roleOptions()}
            </TextField>
            {editing?.status === "INVITED" ? (
              <Button variant="text" onClick={() => setCancelId(editing.id)} sx={{ alignSelf: "flex-end", minHeight: 48 }}>
                Cancel invite
              </Button>
            ) : null}
            <Stack direction="row" spacing={1}>
              <DialogCloseButton onClick={() => setEditing(null)} disabled={busyId === editing?.id} />
              <Button variant="contained" onClick={saveRole} disabled={busyId === editing?.id} sx={dialogFooterButton}>
                {busyId === editing?.id ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(cancelling)} onClose={() => setCancelId(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "#003264" }}>Cancel invite</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Typography>
              {cancelling ? `${cancelling.name} ${cancelling.surname} will not be able to use this invite.` : ""}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setCancelId(null)} disabled={busyId === cancelId} sx={dialogFooterButton}>
                Keep invite
              </Button>
              <Button variant="contained" onClick={cancelInvite} disabled={busyId === cancelId} sx={{ ...dialogFooterButton, backgroundColor: "#FA4362", "&:hover": { backgroundColor: "#E03652" } }}>
                Cancel invite
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
