import Box from "@mui/material/Box";
import CallControls from "@/components/calls/CallControls";

export default function DesktopNavbar({ call, canEscalate = false }: { call: { reference: string } | null; canEscalate?: boolean }) {
  return (
    <Box
      component="header"
      sx={{
        display: { xs: "none", md: "flex" },
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "flex-end",
        px: 2,
        minHeight: 64,
        backgroundColor: "#FDFDFD",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <CallControls call={call} canEscalate={canEscalate} />
    </Box>
  );
}
