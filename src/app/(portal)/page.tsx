import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { requireVerifiedCsr } from "@/lib/csr/guard";

export default async function Home() {
  const csr = await requireVerifiedCsr();

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        px: 2,
        pt: 4,
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Typography component="h1" variant="h1">
          Hello, {csr.name}
        </Typography>
        <Typography sx={{ mt: 1 }}>Your email is verified. The customer service tools will live here.</Typography>
      </Box>
    </Box>
  );
}
