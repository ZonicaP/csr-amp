"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { parsePlate } from "@/lib/users/plate";

const fieldButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function PlateField({ membershipId, vehicleId, plate }: { membershipId: string; vehicleId: string; plate: string | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState(plate ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const parsed = parsePlate(draft);
  const unchanged = ("value" in parsed ? parsed.value : draft) === (plate ?? "");

  useEffect(() => {
    setDraft(plate ?? "");
  }, [plate]);

  async function save() {
    if (!("value" in parsed)) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/vehicles/${encodeURIComponent(vehicleId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate: parsed.value }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "That plate could not be saved");
      setSaving(false);
      return;
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <Stack spacing={1}>
      <TextField label="Plate" value={draft} onChange={(event) => setDraft(event.target.value.toUpperCase().slice(0, 8))} fullWidth />
      <Button variant="contained" onClick={save} disabled={saving || !("value" in parsed) || unchanged} sx={{ ...fieldButton, alignSelf: "flex-end" }}>
        {saving ? "Saving" : "Save plate"}
      </Button>
      {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
    </Stack>
  );
}
