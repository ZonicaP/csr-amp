"use client";

import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type CsrRoleName = "ADMIN" | "AGENT";
export type CsrStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type TeamMember = {
  id: string;
  name: string;
  surname: string;
  email: string;
  status: CsrStatus;
  roles: CsrRoleName[];
};

const roles: { value: CsrRoleName; label: string; description: string }[] = [
  { value: "AGENT", label: "Agent", description: "Handles the membership: lookup, contact details, plans, cancel, transfer, and overdue. Discounts up to 10%." },
  { value: "ADMIN", label: "Admin", description: "Same account access, with no discount limit, and can invite staff and change roles." },
];

export const roleMenu = {
  slotProps: { paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)" } } },
} as const;

export function roleOptions() {
  return roles.map((entry) => (
    <MenuItem key={entry.value} value={entry.value} sx={{ alignItems: "flex-start", whiteSpace: "normal", py: 1.25 }}>
      <Stack sx={{ minWidth: 0, gap: 0.25 }}>
        <Typography sx={{ fontWeight: 600, color: "#181D27" }}>{entry.label}</Typography>
        <Typography sx={{ color: "#717680", fontSize: 13, lineHeight: 1.4, whiteSpace: "normal" }}>{entry.description}</Typography>
      </Stack>
    </MenuItem>
  ));
}

export function roleLabel(role: CsrRoleName) {
  return roles.find((entry) => entry.value === role)?.label ?? role;
}

export function roleBadgeText(role: CsrRoleName, status: CsrStatus) {
  const name = roleLabel(role);
  if (status === "DISABLED") return `${name} · Inactive`;
  if (status === "INVITED") return `${name} · Invited`;
  return name;
}

export function RoleBadge({ role, status }: { role: CsrRoleName; status: CsrStatus }) {
  const quiet = status !== "ACTIVE";
  return (
    <Chip
      size="small"
      label={roleBadgeText(role, status)}
      sx={{ fontWeight: 600, color: quiet ? "#717680" : "#003264", backgroundColor: quiet ? "#F5F6F7" : "#E7F0FA" }}
    />
  );
}

export function primaryRole(member: TeamMember): CsrRoleName {
  if (member.roles.includes("ADMIN")) return "ADMIN";
  return "AGENT";
}
