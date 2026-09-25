import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function CustomerLogsPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) return null;
  const { customer } = loaded;

  return (
    <Stack spacing={1}>
      {customer.events.length === 0 ? <Typography>No events on this account.</Typography> : null}
      {customer.events.map((event) => (
        <Paper key={event.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
            <Typography sx={{ minWidth: 0, fontSize: 14 }}>{event.summary}</Typography>
            <Typography sx={{ flexShrink: 0, color: "#717680", fontSize: 13 }}>{date.format(event.createdAt)}</Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
