"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { plansAvailableToAdd, type WashPlan } from "@/lib/users/wash-plans";

const smallButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };
const textButton = { "&&": { minHeight: 0, py: "2px", px: 1, fontSize: 14, fontWeight: 600, color: "#181D27" } };

type Plan = { id: string; name: string; status: "ACTIVE" | "CANCELLED"; since: string };
type Destination = { id: string; label: string };

export default function VehicleSubscriptions({
  membershipId,
  vehicleId,
  plans,
  canAdd,
  canRemove,
  canTransfer,
}: {
  membershipId: string;
  vehicleId: string;
  plans: Plan[];
  canAdd: boolean;
  canRemove: boolean;
  canTransfer: boolean;
}) {
  const router = useRouter();
  const available = plansAvailableToAdd(plans.filter((plan) => plan.status === "ACTIVE").map((plan) => plan.name));
  const [planName, setPlanName] = useState<WashPlan | "">(available[0] ?? "");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [destinationMembership, setDestinationMembership] = useState(membershipId);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationVehicleId, setDestinationVehicleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function findVehicles() {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(destinationMembership.trim())}/vehicles`);
    const payload = (await response.json().catch(() => null)) as { error?: string; vehicles?: Destination[] } | null;
    if (!response.ok) {
      setDestinations([]);
      setDestinationVehicleId("");
      setMessage(payload?.error ?? "That membership could not be found");
      setBusy(false);
      return;
    }
    const vehicles = (payload?.vehicles ?? []).filter((vehicle) => vehicle.id !== vehicleId);
    setDestinations(vehicles);
    setDestinationVehicleId(vehicles[0]?.id ?? "");
    if (vehicles.length === 0) setMessage("No other vehicle on that membership.");
    setBusy(false);
  }

  return (
    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
      {plans.length === 0 ? <Typography>No plan on this vehicle.</Typography> : null}
      {plans.map((plan) => (
        <Stack key={plan.id} spacing={0.5} sx={{ pb: 1, borderBottom: "1px solid #E5E7EB" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
            <Typography sx={{ color: "#003264", fontWeight: 600 }}>{plan.name}</Typography>
            <Chip size="small" label={plan.status === "ACTIVE" ? "Active" : "Cancelled"} color={plan.status === "ACTIVE" ? "success" : "default"} />
          </Stack>
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Since {plan.since}</Typography>
          {plan.status === "ACTIVE" && (canRemove || canTransfer) ? (
            confirmRemove === plan.id ? (
              <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Typography sx={{ color: "#181D27", fontSize: 14 }}>Remove {plan.name}?</Typography>
                <Button variant="contained" color="error" disabled={busy} onClick={() => submit({ type: "remove", subscriptionId: plan.id })} sx={smallButton}>
                  Remove
                </Button>
                <Button variant="text" disabled={busy} onClick={() => setConfirmRemove(null)} sx={textButton}>
                  Back
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" sx={{ flexWrap: "wrap" }}>
                {canRemove ? (
                  <Button variant="text" disabled={busy} onClick={() => { setConfirmRemove(plan.id); setTransferId(null); setMessage(null); }} sx={textButton}>
                    Remove
                  </Button>
                ) : null}
                {canTransfer ? (
                  <Button
                    variant="text"
                    disabled={busy}
                    onClick={() => {
                      setTransferId(plan.id);
                      setConfirmRemove(null);
                      setDestinationMembership(membershipId);
                      setDestinations([]);
                      setDestinationVehicleId("");
                      setMessage(null);
                    }}
                    sx={textButton}
                  >
                    Transfer
                  </Button>
                ) : null}
              </Stack>
            )
          ) : null}
          {transferId === plan.id ? (
            <Stack spacing={1}>
              <TextField label="Membership" value={destinationMembership} onChange={(event) => setDestinationMembership(event.target.value.slice(0, 40))} fullWidth />
              <Stack direction="row" sx={{ gap: 1 }}>
                <Button variant="outlined" disabled={busy || destinationMembership.trim().length === 0} onClick={findVehicles} sx={smallButton}>
                  Find vehicles
                </Button>
              </Stack>
              {destinations.length > 0 ? (
                <TextField select label="Vehicle" value={destinationVehicleId} onChange={(event) => setDestinationVehicleId(event.target.value)} fullWidth>
                  {destinations.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : null}
              <Button variant="contained" disabled={busy || destinationVehicleId.length === 0} onClick={() => submit({ type: "transfer", subscriptionId: plan.id, destinationVehicleId })} sx={smallButton}>
                Transfer
              </Button>
            </Stack>
          ) : null}
        </Stack>
      ))}
      {canAdd && available.length > 0 ? (
        <Stack spacing={1}>
          <TextField select label="Plan" value={available.includes(planName as WashPlan) ? planName : available[0]} onChange={(event) => setPlanName(event.target.value as WashPlan)} fullWidth>
            {available.map((plan) => (
              <MenuItem key={plan} value={plan}>
                {plan}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={busy} onClick={() => submit({ type: "add", vehicleId, planName: available.includes(planName as WashPlan) ? planName : available[0] })} sx={{ ...smallButton, alignSelf: "flex-start" }}>
            Add plan
          </Button>
        </Stack>
      ) : null}
      {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
    </Stack>
  );
}
