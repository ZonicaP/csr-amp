import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function AuthShell({
  title,
  description,
  showLogo = true,
  children,
}: {
  title: string;
  description: string;
  showLogo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      id="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        pt: showLogo ? "max(24px, env(safe-area-inset-top))" : 3,
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420, mt: { xs: showLogo ? 3 : 1, sm: showLogo ? 8 : 4 } }}>
        {showLogo ? (
          <Image src="/amp-logo-hires.png" alt="AMP" width={368} height={101} priority style={{ width: 168, height: "auto" }} />
        ) : null}
        <Typography component="h1" variant="h1" sx={{ mt: showLogo ? 3 : 0, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ mb: 3 }}>{description}</Typography>
        {children}
      </Box>
    </Box>
  );
}
