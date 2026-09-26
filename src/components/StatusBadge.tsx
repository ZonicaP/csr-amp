import Chip from "@mui/material/Chip";

const color = {
  ACTIVE: "success",
  OVERDUE: "warning",
} as const;

export const cancelledBadgeSx = {
  height: 24,
  fontWeight: 700,
  backgroundColor: "#FDECEE",
  color: "#FA4362",
  "& .MuiChip-label": { color: "#FA4362" },
} as const;

export default function StatusBadge({ status }: { status: "ACTIVE" | "OVERDUE" | "CANCELLED" }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  if (status === "CANCELLED") return <Chip size="small" label={label} sx={cancelledBadgeSx} />;
  return <Chip size="small" label={label} color={color[status]} />;
}
