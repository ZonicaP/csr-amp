"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthRequestError, postJson } from "@/lib/auth/http-client";
import type { OpenCall } from "@/lib/calls/call-service";

const linkButton = {
  "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14, color: "#003264", borderColor: "#E5E7EB", backgroundColor: "#FDFDFD" },
};

export default function CallerLink({ membershipId, call }: { membershipId: string; call: OpenCall | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!call) return null;

  const linkedHere = call.customer?.membershipId.toLowerCase() === membershipId.toLowerCase();

  async function link() {
    setPending(true);
    setError(null);
    try {
      await postJson("/api/calls/current", { action: "link", membershipId });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That caller could not be linked");
    } finally {
      setPending(false);
    }
  }

  async function undo() {
    setPending(true);
    setError(null);
    try {
      await postJson("/api/calls/current", { action: "unlink" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AuthRequestError ? caught.message : "That caller could not be removed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ minWidth: 0, color: linkedHere ? "#003264" : "#717680", fontSize: 14, fontWeight: linkedHere ? 600 : 400 }}>
          {linkedHere ? (
            `Linked to ${call.reference}`
          ) : call.customer ? (
            <>
              This call is linked to{" "}
              <NextLink href={`/customers/${call.customer.membershipId}`} style={{ color: "#0B75E1", fontWeight: 700, textDecoration: "none" }}>
                {call.customer.firstName} {call.customer.lastName}
              </NextLink>
            </>
          ) : (
            `${call.reference} is not linked yet`
          )}
        </Typography>
        {linkedHere ? (
          <Button variant="text" onClick={undo} disabled={pending} sx={{ flexShrink: 0, color: "#717680", "&&": { minHeight: 36, py: "6px", px: 1, fontSize: 14 } }}>
            {pending ? "Saving" : "Undo"}
          </Button>
        ) : (
          <Button variant="outlined" onClick={link} disabled={pending} sx={{ ...linkButton, flexShrink: 0 }}>
            {pending ? "Saving" : "This is the caller"}
          </Button>
        )}
      </Stack>
      {error ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{error}</Typography> : null}
    </Stack>
  );
}
