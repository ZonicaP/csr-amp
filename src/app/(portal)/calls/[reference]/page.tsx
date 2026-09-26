import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MarkCalled from "@/components/calls/MarkCalled";
import { getCall } from "@/lib/calls/call-service";
import { requireVerifiedCsr } from "@/lib/csr/guard";

const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function statusChip(status: "OPEN" | "CLOSED" | "CALLBACK", resolved: boolean) {
  if (status === "OPEN") return { label: "Open", color: "#003264", backgroundColor: "#E7F0FA" };
  if (status === "CALLBACK") return { label: "Callback", color: "#8A4B08", backgroundColor: "#FFF4E5" };
  if (resolved) return { label: "Called", color: "#146C43", backgroundColor: "#E7F6EE" };
  return { label: "Closed", color: "#717680", backgroundColor: "#F5F6F7" };
}

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }): Promise<Metadata> {
  const { reference } = await params;
  return { title: `${reference.toUpperCase()} · Calls` };
}

export default async function CallPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const csr = await requireVerifiedCsr();
  const call = await getCall(csr.id, reference.toUpperCase());
  if (!call) notFound();
  const chip = statusChip(call.status, call.resolvedAt !== null);

  return (
    <Box component="main" id="main" sx={{ flex: 1, px: 2, pt: 3, pb: "max(24px, env(safe-area-inset-bottom))", background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)" }}>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography component="h1" variant="h1">{call.reference}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip size="small" label={chip.label} sx={{ fontWeight: 600, color: chip.color, backgroundColor: chip.backgroundColor }} />
            {call.escalated ? <Chip size="small" label="Escalated" sx={{ fontWeight: 600, color: "#003264", backgroundColor: "#E7F0FA" }} /> : null}
          </Stack>
        </Stack>
        {call.customer ? (
          <Typography>
            <NextLink href={`/customers/${call.customer.membershipId}`} style={{ color: "#0B75E1", fontWeight: 700, textDecoration: "none" }}>
              {call.customer.firstName} {call.customer.lastName} · {call.customer.membershipId}
            </NextLink>
          </Typography>
        ) : null}
        <Typography>
          {call.escalated ? `Escalated to ${call.agent}` : call.agent}
          {call.escalated && call.escalatedBy ? ` by ${call.escalatedBy}` : ""}
          {" · "}Started {when.format(call.startedAt)}{call.endedAt ? ` · Ended ${when.format(call.endedAt)}` : ""}
        </Typography>
        {call.status === "CALLBACK" ? <MarkCalled reference={call.reference} /> : null}
        {call.resolvedAt ? (
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Marked as called {when.format(call.resolvedAt)}</Typography>
        ) : null}
        {call.callbackNote ? (
          <Paper elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
            <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>Callback note</Typography>
            <Typography sx={{ mt: 0.5 }}>{call.callbackNote}</Typography>
          </Paper>
        ) : null}
        {call.closingNotes ? (
          <Paper elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
            <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>Anything else we should be aware of</Typography>
            <Typography sx={{ mt: 0.5 }}>{call.closingNotes}</Typography>
          </Paper>
        ) : null}
        {call.events.length === 0 ? <Typography>Nothing was changed on this call.</Typography> : null}
        {call.events.map((event) => (
          <Paper key={event.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography sx={{ minWidth: 0, fontSize: 14 }}>{event.summary}</Typography>
              <Typography sx={{ flexShrink: 0, color: "#717680", fontSize: 13 }}>{when.format(event.createdAt)}</Typography>
            </Stack>
            <Typography sx={{ mt: 0.5 }}>
              <NextLink href={`/customers/${event.user.membershipId}`} style={{ color: "#0B75E1", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                {event.user.firstName} {event.user.lastName} · {event.user.membershipId}
              </NextLink>
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
