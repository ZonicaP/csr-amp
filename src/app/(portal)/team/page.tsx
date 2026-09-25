import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TeamDirectory from "@/components/team/TeamDirectory";
import { listCsrs } from "@/lib/csr/csr-service";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";

export const metadata: Metadata = {
  title: "Team",
  description: "Look up AMP customer service staff by name, surname, or email.",
};

export default async function TeamPage() {
  const csr = await requireVerifiedCsr();
  const canRead = hasPermission(csr.roles, "csr:read");
  const canManage = hasPermission(csr.roles, "csr:manage");
  const team = canRead ? await listCsrs(csr.id) : [];

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
        {canRead ? (
          <TeamDirectory team={team} canManage={canManage} />
        ) : (
          <>
            <Typography component="h1" variant="h1">
              Team
            </Typography>
            <Typography sx={{ mt: 1 }}>You do not have permission to view the team.</Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
