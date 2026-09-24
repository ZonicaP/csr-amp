import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        pt: "max(24px, env(safe-area-inset-top))",
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420, mt: { xs: 3, sm: 8 } }}>
        <Image src="/amp-logo-hires.png" alt="AMP" width={368} height={101} priority style={{ width: 168, height: "auto" }} />
        <Typography component="h1" variant="h1" sx={{ mt: 3, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ mb: 3 }}>{description}</Typography>
        {children}
      </Box>
    </Box>
  );
}
