"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import HighlightMatch from "@/components/HighlightMatch";
import InviteCsrDialog from "@/components/team/InviteCsrDialog";
import MemberDialog from "@/components/team/MemberDialog";
import { RoleBadge, roleBadgeText, type TeamMember } from "@/components/team/team-roles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function TeamDirectory({ initialTeam, canManage }: { initialTeam: TeamMember[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const [team, setTeam] = useState(initialTeam);
  const [reload, setReload] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (debounced.trim()) params.set("q", debounced.trim());
    fetch(`/api/csrs?${params}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { csrs?: TeamMember[]; error?: string } | null;
        if (!response.ok) throw new Error(body?.error ?? "The team could not be loaded");
        return body?.csrs ?? [];
      })
      .then((csrs) => {
        if (!ignore) {
          setTeam(csrs);
          setListError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!ignore) setListError(caught instanceof Error ? caught.message : "The team could not be loaded");
      });
    return () => {
      ignore = true;
    };
  }, [debounced, reload]);

  function changed() {
    setReload((value) => value + 1);
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography component="h1" variant="h1">
          Team
        </Typography>
        {canManage ? (
          <Button variant="contained" onClick={() => setInviteOpen(true)} sx={{ ...compactButton, flexShrink: 0 }}>
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
      {listError ? <Alert severity="error">{listError}</Alert> : null}
      <TeamTable team={team} query={query} canManage={canManage} onOpen={setEditing} />
      <TeamCards team={team} query={query} canManage={canManage} onOpen={setEditing} />
      {canManage ? <InviteCsrDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={() => { setInviteOpen(false); changed(); }} /> : null}
      {canManage ? <MemberDialog member={editing} onClose={() => setEditing(null)} onChanged={changed} /> : null}
    </Stack>
  );
}

function memberLabel(member: TeamMember) {
  return `${member.name} ${member.surname}, ${member.roles.map((entry) => roleBadgeText(entry, member.status)).join(", ")}`;
}

function TeamTable({ team, query, canManage, onOpen }: { team: TeamMember[]; query: string; canManage: boolean; onOpen: (member: TeamMember) => void }) {
  return (
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
            {team.map((member) => (
              <TableRow
                key={member.id}
                hover={canManage}
                tabIndex={canManage ? 0 : undefined}
                role={canManage ? "button" : undefined}
                aria-label={canManage ? memberLabel(member) : undefined}
                onClick={canManage ? () => onOpen(member) : undefined}
                onKeyDown={
                  canManage
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpen(member);
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
                  <RoleList member={member} />
                </TableCell>
              </TableRow>
            ))}
            {team.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No team members match that search.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function TeamCards({ team, query, canManage, onOpen }: { team: TeamMember[]; query: string; canManage: boolean; onOpen: (member: TeamMember) => void }) {
  return (
    <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
      {team.map((member) => (
        <Paper
          key={member.id}
          elevation={0}
          component={canManage ? "button" : "div"}
          type={canManage ? "button" : undefined}
          aria-label={canManage ? memberLabel(member) : undefined}
          onClick={canManage ? () => onOpen(member) : undefined}
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
            <RoleList member={member} align="end" />
          </Stack>
          <Typography sx={{ color: "#717680", fontSize: 14, mt: 0.5 }}>
            <HighlightMatch text={member.email} query={query} />
          </Typography>
        </Paper>
      ))}
      {team.length === 0 ? <Typography>No team members match that search.</Typography> : null}
    </Stack>
  );
}

function RoleList({ member, align = "start" }: { member: TeamMember; align?: "start" | "end" }) {
  return (
    <Stack direction="row" sx={{ flexShrink: 0, flexWrap: "wrap", justifyContent: align === "end" ? "flex-end" : "flex-start", gap: 0.75 }}>
      {member.roles.map((entry) => (
        <RoleBadge key={entry} role={entry} status={member.status} />
      ))}
    </Stack>
  );
}
