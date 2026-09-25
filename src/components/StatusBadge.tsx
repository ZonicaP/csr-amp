import Chip from "@mui/material/Chip";

const color = {
  ACTIVE: "success",
  OVERDUE: "warning",
  CANCELLED: "default",
} as const;

export default function StatusBadge({ status }: { status: keyof typeof color }) {
  return <Chip size="small" label={status.charAt(0) + status.slice(1).toLowerCase()} color={color[status]} />;
}
