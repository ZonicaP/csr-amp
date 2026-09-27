"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { AuthRequestError, patchJson } from "@/lib/auth/http-client";
import { parseOwnName } from "@/lib/csr/own-name";

const buttonSx = { minHeight: 40, px: 2, py: 0.5, whiteSpace: "nowrap", flexShrink: 0 };

export default function ProfileNameForm({ id, name, surname }: { id: string; name: string; surname: string }) {
  const router = useRouter();
  const [savedName, setSavedName] = useState(name);
  const [savedSurname, setSavedSurname] = useState(surname);
  const [firstName, setFirstName] = useState(name);
  const [lastName, setLastName] = useState(surname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (name !== savedName || surname !== savedSurname) {
    setSavedName(name);
    setSavedSurname(surname);
    setFirstName(name);
    setLastName(surname);
    setError(null);
  }

  const parsed = parseOwnName({ name: firstName, surname: lastName });
  const unchanged = "value" in parsed && parsed.value.name === name && parsed.value.surname === surname;

  function reset() {
    setFirstName(name);
    setLastName(surname);
    setError(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!("value" in parsed) || unchanged) {
      setError("error" in parsed ? parsed.error : null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patchJson(`/api/csrs/${id}`, { name: parsed.value.name, surname: parsed.value.surname });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That name could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack component="form" noValidate onSubmit={save} spacing={1.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="First name"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value.slice(0, 80))}
        required
        autoComplete="given-name"
        error={!("value" in parsed) && parsed.error === "Enter a first name"}
        helperText={!("value" in parsed) && parsed.error === "Enter a first name" ? parsed.error : undefined}
        fullWidth
      />
      <TextField
        label="Surname"
        value={lastName}
        onChange={(event) => setLastName(event.target.value.slice(0, 80))}
        required
        autoComplete="family-name"
        error={!("value" in parsed) && parsed.error === "Enter a surname"}
        helperText={!("value" in parsed) && parsed.error === "Enter a surname" ? parsed.error : undefined}
        fullWidth
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {firstName !== name || lastName !== surname ? (
          <Button type="button" variant="outlined" onClick={reset} disabled={saving} sx={buttonSx}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="contained" disabled={saving || unchanged || !("value" in parsed)} sx={buttonSx}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
