import type { Metadata } from "next";
import NextLink from "next/link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { callsForCustomer } from "@/lib/calls/call-service";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function callStatus(status: string) {
  if (status === "CALLBACK") return "Callback";
  if (status === "OPEN") return "Open";
  return "Closed";
}

export async function generateMetadata({ params }: { params: Promise<{ membershipId: string }> }): Promise<Metadata> {
  const { membershipId } = await params;
  return { title: `Logs · ${membershipId.toUpperCase()}` };
}

export default async function CustomerLogsPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) return null;
  const { csr, customer } = loaded;
  const calls = await callsForCustomer(csr.id, customer.membershipId);

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        {customer.events.length === 0 ? <Typography>No events on this account.</Typography> : null}
        {customer.events.map((event) => (
          <Paper key={event.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography sx={{ minWidth: 0, fontSize: 14 }}>{event.summary}</Typography>
              <Stack sx={{ flexShrink: 0, alignItems: "flex-end" }}>
                <Typography sx={{ color: "#717680", fontSize: 13 }}>{date.format(event.createdAt)}</Typography>
                {event.call ? (
                  <NextLink href={`/calls/${event.call.reference}`} style={{ color: "#0B75E1", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                    {event.call.reference}
                  </NextLink>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ color: "#003264", fontSize: 16, fontWeight: 600 }}>
          Calls
        </Typography>
        {calls.length === 0 ? <Typography>No calls on this account.</Typography> : null}
        {calls.map((call) => (
          <Paper key={call.reference} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <NextLink href={`/calls/${call.reference}`} style={{ color: "#0B75E1", fontWeight: 700, textDecoration: "none" }}>
                {call.reference}
              </NextLink>
              <Typography sx={{ color: "#717680", fontSize: 13 }}>{when.format(call.startedAt)}</Typography>
            </Stack>
            <Typography sx={{ color: "#717680", fontSize: 14 }}>
              {call.csr.displayName} · {callStatus(call.status)}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
