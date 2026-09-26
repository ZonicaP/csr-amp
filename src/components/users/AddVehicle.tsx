"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { vehicleYears } from "@/lib/users/vehicle-year";

const shortButton = { "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } };

export default function AddVehicle({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setOpen(false);
    setMessage(null);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, make, model, plate }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "That vehicle could not be added");
      setBusy(false);
      return;
    }
    setYear("");
    setMake("");
    setModel("");
    setPlate("");
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ ...shortButton, alignSelf: "flex-end" }}>
        Add vehicle
      </Button>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
          "& .MuiDialog-paper": {
            m: { xs: 0, md: 4 },
            width: { xs: "100%", md: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", md: 444 },
            borderRadius: { xs: "16px 16px 0 0", md: 2 },
          },
        }}
      >
        <DialogTitle sx={{ color: "#003264" }}>Add vehicle</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <TextField select label="Year" value={year} onChange={(event) => setYear(event.target.value)} fullWidth>
              <MenuItem value="">Select a year</MenuItem>
              {vehicleYears().map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Make" value={make} onChange={(event) => setMake(event.target.value.slice(0, 40))} fullWidth />
            <TextField label="Model" value={model} onChange={(event) => setModel(event.target.value.slice(0, 40))} fullWidth />
            <TextField label="Plate" value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase().slice(0, 8))} fullWidth />
            {message ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{message}</Typography> : null}
            <Stack direction="row" spacing={1}>
              <DialogCloseButton short disabled={busy} onClick={close} />
              <Button variant="contained" disabled={busy} onClick={save} sx={{ ...dialogFooterButton, ...shortButton }}>
                {busy ? "Saving" : "Add vehicle"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
