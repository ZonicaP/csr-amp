import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SignOutButton from "@/components/SignOutButton";
import { requireVerifiedCsr } from "@/lib/csr/guard";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const csr = await requireVerifiedCsr();

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
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Typography component="h1" variant="h1">
          {csr.displayName}
        </Typography>
        <Typography>{csr.email}</Typography>
        <Typography sx={{ color: "#717680" }}>{csr.roles.map((role) => role.charAt(0) + role.slice(1).toLowerCase()).join(", ")}</Typography>
        <SignOutButton />
      </Stack>
    </Box>
  );
}
