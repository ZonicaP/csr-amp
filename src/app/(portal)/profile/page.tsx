import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
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
          Profile
        </Typography>
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #E5E7EB", borderRadius: 3, backgroundColor: "#FDFDFD" }}>
          <Stack spacing={1.5}>
            <Stack spacing={0.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography noWrap sx={{ minWidth: 0, color: "#003264", fontWeight: 600, fontSize: 18 }}>
                  {csr.displayName}
                </Typography>
                <Stack direction="row" sx={{ flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", gap: 0.75 }}>
                  {csr.roles.map((role) => (
                    <Chip
                      key={role}
                      size="small"
                      label={role.charAt(0) + role.slice(1).toLowerCase()}
                      sx={{ fontWeight: 600, color: "#003264", backgroundColor: "#E7F0FA" }}
                    />
                  ))}
                </Stack>
              </Stack>
              <Typography>{csr.email}</Typography>
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <SignOutButton />
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
