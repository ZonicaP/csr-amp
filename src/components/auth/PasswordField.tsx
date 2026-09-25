"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

export default function PasswordField({
  label,
  name,
  autoComplete,
  value,
  onChange,
  helperText,
}: {
  label: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      type={visible ? "text" : "password"}
      name={name}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helperText={helperText}
      required
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Button
                type="button"
                onClick={() => setVisible((current) => !current)}
                aria-pressed={visible}
                aria-label={visible ? "Hide password" : "Show password"}
                sx={{ minWidth: 64, minHeight: 48, px: 1.5 }}
              >
                {visible ? "Hide" : "Show"}
              </Button>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
