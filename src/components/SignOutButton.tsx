"use client";

import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="outlined" onClick={signOut} sx={{ minHeight: 40, px: 2, py: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
      Sign out
    </Button>
  );
}
