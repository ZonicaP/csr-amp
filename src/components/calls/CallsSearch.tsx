"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AuthRequestError } from "@/lib/auth/http-client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type CallStatus = "OPEN" | "CLOSED" | "CALLBACK";

type CallListItem = {
  reference: string;
  status: CallStatus;
  startedAt: string;
  callbackNote: string | null;
  agent: string;
  customers: { membershipId: string; firstName: string; lastName: string }[];
};

const compactButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

const when = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function statusChip(status: CallStatus) {
  if (status === "OPEN") return { label: "Open", color: "#003264", backgroundColor: "#E7F0FA" };
  if (status === "CALLBACK") return { label: "Callback", color: "#8A4B08", backgroundColor: "#FFF4E5" };
  return { label: "Closed", color: "#717680", backgroundColor: "#F5F6F7" };
}

function emptyMessage(query: string, callbacksOnly: boolean) {
  if (query.trim() && callbacksOnly) return "No callback calls match that search.";
  if (query.trim()) return "No calls match that search.";
  if (callbacksOnly) return "No calls need a callback.";
  return "No calls yet.";
}

export default function CallsSearch() {
  const [query, setQuery] = useState("");
  const [callbacksOnly, setCallbacksOnly] = useState(false);
  const debounced = useDebouncedValue(query, 300);
  const [calls, setCalls] = useState<CallListItem[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced });
    if (callbacksOnly) params.set("status", "CALLBACK");
    setPending(true);
    fetch(`/api/calls?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { calls?: CallListItem[]; error?: string };
        if (!response.ok) {
          throw new AuthRequestError(body.error ?? "Something went wrong");
        }
        setCalls(body.calls ?? []);
        setError("");
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof AuthRequestError ? caught.message : "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPending(false);
        }
      });
    return () => controller.abort();
  }, [debounced, callbacksOnly]);

  return (
    <Stack spacing={2}>
      <Box component="search">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
          <TextField
            label="Search calls"
            placeholder="Reference, agent, or customer"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            autoComplete="off"
            fullWidth
            sx={{ flex: 1 }}
          />
          <Button
            type="button"
            variant={callbacksOnly ? "contained" : "outlined"}
            aria-pressed={callbacksOnly}
            aria-label="Callbacks only"
            onClick={() => setCallbacksOnly((on) => !on)}
            sx={{ ...compactButton, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Callbacks
          </Button>
        </Stack>
      </Box>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {pending && calls.length === 0 ? <Typography>Loading calls…</Typography> : null}
      {!pending && calls.length === 0 ? (
        <Typography>{emptyMessage(debounced, callbacksOnly)}</Typography>
      ) : null}
      {calls.map((call) => {
        const chip = statusChip(call.status);
        return (
          <NextLink key={call.reference} href={`/calls/${call.reference}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography sx={{ color: "#003264", fontWeight: 700 }}>{call.reference}</Typography>
                <Chip size="small" label={chip.label} sx={{ fontWeight: 600, color: chip.color, backgroundColor: chip.backgroundColor }} />
              </Stack>
              <Typography sx={{ color: "#717680", fontSize: 14, mt: 0.5 }}>
                Assigned to {call.agent} · {when.format(new Date(call.startedAt))}
              </Typography>
              <Typography sx={{ color: "#717680", fontSize: 14 }}>
                {call.customers.length === 0
                  ? "No customer linked"
                  : call.customers.map((customer) => `${customer.firstName} ${customer.lastName} · ${customer.membershipId}`).join(", ")}
              </Typography>
              {call.callbackNote ? <Typography sx={{ color: "#003264", fontSize: 14, mt: 0.5 }}>{call.callbackNote}</Typography> : null}
            </Paper>
          </NextLink>
        );
      })}
    </Stack>
  );
}
