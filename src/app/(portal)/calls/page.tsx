import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CallsSearch from "@/components/calls/CallsSearch";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";

export const metadata: Metadata = { title: "Calls" };

export default async function CallsPage() {
  const csr = await requireVerifiedCsr();
  const canRead = hasPermission(csr.roles, "customers:read");

  return (
    <Box
      component="main"
      id="main"
      sx={{ flex: 1, px: 2, pt: 3, pb: "max(24px, env(safe-area-inset-bottom))", background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)" }}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Typography component="h1" variant="h1">
          Calls
        </Typography>
        <Typography>Look up a call by its reference, the agent, or the customer.</Typography>
        {canRead ? <CallsSearch /> : <Typography>You do not have permission to look up calls.</Typography>}
      </Stack>
    </Box>
  );
}
