"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import StatusBadge from "@/components/StatusBadge";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallEditGuard } from "@/components/calls/CallEditGuard";
import DialogCloseButton from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import { planDetails, planInfoNote } from "@/lib/users/plan-info";
import { plansAvailableToAdd, type WashPlan } from "@/lib/users/wash-plans";

const smallButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const textButton = { "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, color: "#181D27" } };
const infoButton = {
  width: 36,
  height: 36,
  flexShrink: 0,
  color: "#0B75E1",
  border: "1px solid #E5E7EB",
  borderRadius: "40px",
  "&&": { minWidth: 36, minHeight: 36, p: 0 },
};

type Plan = { id: string; name: string; status: "ACTIVE" | "CANCELLED"; since: string };
type Destination = { id: string; label: string };

function PlanSummary({ plan }: { plan: Plan }) {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
        <Typography sx={{ color: "#003264", fontWeight: 600 }}>{plan.name}</Typography>
        <StatusBadge status={plan.status} />
      </Stack>
      <Typography sx={{ color: "#717680", fontSize: 14 }}>Since {plan.since}</Typography>
    </Stack>
  );
}

function PlanInfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ ...sheetDialogSx(), "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 } }}>
      <DialogTitle sx={{ color: "#003264", pb: 1 }}>Plan info</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
          {planDetails.map((plan) => (
            <Stack key={plan.name} spacing={0.5}>
              <Typography sx={{ color: "#003264", fontWeight: 600 }}>{plan.name}</Typography>
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>{plan.detail}</Typography>
            </Stack>
          ))}
          <Typography sx={{ color: "#717680", fontSize: 14 }}>{planInfoNote}</Typography>
          <Stack direction="row" spacing={1}>
            <DialogCloseButton short onClick={onClose} />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function VehicleSubscriptions({
  membershipId,
  vehicleId,
  plans,
  otherVehicles,
  canAdd,
  canRemove,
  canTransfer,
}: {
  membershipId: string;
  vehicleId: string;
  plans: Plan[];
  otherVehicles: Destination[];
  canAdd: boolean;
  canRemove: boolean;
  canTransfer: boolean;
}) {
  const router = useRouter();
  const guardEdit = useCallEditGuard();
  const available = plansAvailableToAdd(plans.filter((plan) => plan.status === "ACTIVE").map((plan) => plan.name));
  const [planName, setPlanName] = useState<WashPlan | "">(available[0] ?? "");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [destinationVehicleId, setDestinationVehicleId] = useState(otherVehicles[0]?.id ?? "");
  const [infoOpen, setInfoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const current = plans.find((plan) => plan.status === "ACTIVE");
  const history = plans.filter((plan) => plan.status !== "ACTIVE");
  const planLabel = plans.some((plan) => plan.status === "ACTIVE") ? "Change plan" : "Add plan";
  const selectedPlan = available.includes(planName as WashPlan) ? planName : available[0];
  const transferTargets = otherVehicles.filter((vehicle) => vehicle.id !== vehicleId);
  const canChooseVehicle = Boolean(current && canTransfer && transferTargets.length > 0);
  const chosenDestination = transferTargets.some((vehicle) => vehicle.id === destinationVehicleId) ? destinationVehicleId : (transferTargets[0]?.id ?? "");

  async function submit(body: Record<string, string>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "That plan could not be changed");
      setBusy(false);
      return;
    }
    setConfirmRemove(null);
    setTransferId(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
      {current ? <PlanSummary plan={current} /> : null}
      {!current && history.length === 0 ? <Typography>No plan on this vehicle.</Typography> : null}
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Stack direction="row" sx={{ flex: 1, alignItems: "center", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
          {current && confirmRemove === current.id && canRemove ? (
            <>
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>Remove {current.name}?</Typography>
              <Button variant="contained" color="error" disabled={busy} onClick={() => submit({ type: "remove", subscriptionId: current.id })} sx={smallButton}>
                Remove
              </Button>
              <Button variant="text" disabled={busy} onClick={() => setConfirmRemove(null)} sx={textButton}>
                Back
              </Button>
            </>
          ) : (
            <>
              {current && canRemove ? (
                <Button variant="text" disabled={busy} onClick={() => guardEdit(() => { setConfirmRemove(current.id); setTransferId(null); setMessage(null); })} sx={textButton}>
                  Remove
                </Button>
              ) : null}
              {canChooseVehicle && current ? (
                <Button
                  variant="text"
                  disabled={busy}
                  onClick={() => guardEdit(() => {
                    setTransferId(current.id);
                    setConfirmRemove(null);
                    setDestinationVehicleId(transferTargets[0]?.id ?? "");
                    setMessage(null);
                  })}
                  sx={textButton}
                >
                  Transfer
                </Button>
              ) : null}
              {current && canTransfer && transferTargets.length === 0 ? (
                <Typography sx={{ color: "#717680", fontSize: 14 }}>No other vehicle on this membership.</Typography>
              ) : null}
            </>
          )}
        </Stack>
        <IconButton aria-label="Plan info" onClick={() => setInfoOpen(true)} sx={infoButton}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
          </svg>
        </IconButton>
      </Stack>
      {current && transferId === current.id && canChooseVehicle ? (
        <Stack spacing={1}>
          <TextField select label="Vehicle" value={chosenDestination} onChange={(event) => setDestinationVehicleId(event.target.value)} fullWidth>
            {transferTargets.map((vehicle) => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={busy || chosenDestination.length === 0} onClick={() => submit({ type: "transfer", subscriptionId: current.id, destinationVehicleId: chosenDestination })} sx={smallButton}>
            Transfer
          </Button>
        </Stack>
      ) : null}
      {canAdd && available.length > 0 ? (
        <Stack spacing={1}>
          <TextField select label="Plan" value={selectedPlan} onChange={(event) => setPlanName(event.target.value as WashPlan)} fullWidth>
            {available.map((plan) => (
              <MenuItem key={plan} value={plan}>
                {plan}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" fullWidth disabled={busy || !selectedPlan} onClick={() => guardEdit(() => { void submit({ type: "add", vehicleId, planName: selectedPlan }); })} sx={smallButton}>
            {busy ? "Saving" : planLabel}
          </Button>
        </Stack>
      ) : null}
      {history.length > 0 ? (
        <Stack spacing={1.25} sx={current || (canAdd && available.length > 0) ? { pt: 1.25, borderTop: "1px solid #E5E7EB" } : undefined}>
          <Typography sx={{ color: "#717680", fontSize: 14, fontWeight: 600 }}>History</Typography>
          {history.map((plan) => (
            <PlanSummary key={plan.id} plan={plan} />
          ))}
        </Stack>
      ) : null}
      {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
      <PlanInfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Stack>
  );
}
