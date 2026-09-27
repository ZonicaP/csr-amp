import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UnlinkedCallBanner from "@/components/calls/UnlinkedCallBanner";
import UsersTable from "@/components/users/UsersTable";
import { openCall } from "@/lib/calls/call-service";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";

export const metadata: Metadata = {
  title: "Customers",
  description: "Search AMP memberships by name, email, phone, or membership ID.",
};

export default async function CustomersPage() {
  const csr = await requireVerifiedCsr();
  const canRead = hasPermission(csr.roles, "customers:read");
  const call = await openCall(csr.id);
  const unlinkedReference = call && !call.customer ? call.reference : null;

  return (
    <Box
      component="main"
      id="main"
      sx={{
        flex: 1,
        px: 2,
        pt: 3,
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 960, mx: "auto" }}>
        <Typography component="h1" variant="h1">
          Customers
        </Typography>
        <Typography sx={{ mt: 1, mb: unlinkedReference ? 2 : 3 }}>Search the membership accounts that call in.</Typography>
        {unlinkedReference ? <UnlinkedCallBanner reference={unlinkedReference} /> : null}
        {canRead ? <UsersTable /> : <Typography>You do not have permission to view customers.</Typography>}
      </Box>
    </Box>
  );
}
