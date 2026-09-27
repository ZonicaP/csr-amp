"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";

export default function UnlinkedCallBanner({ reference }: { reference: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Alert
      severity="info"
      role="status"
      onClose={() => setDismissed(true)}
      sx={{
        mb: 3,
        alignItems: "center",
        color: "#003264",
        backgroundColor: "#F5FAFF",
        border: "1px solid #E5E7EB",
        "& .MuiAlert-icon": { color: "#0B75E1" },
        "& .MuiAlert-message": { color: "#003264", fontSize: 14, fontWeight: 500 },
        "& .MuiAlert-action": { alignItems: "center", pt: 0 },
      }}
    >
      {reference} is open. Open the customer, then choose This is the caller.
    </Alert>
  );
}
