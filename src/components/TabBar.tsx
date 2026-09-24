import Box from "@mui/material/Box";

export default function TabBar() {
  return (
    <Box
      component="nav"
      aria-label="Tabs"
      sx={{
        display: { xs: "block", md: "none" },
        flexShrink: 0,
        minHeight: 56,
        pb: "env(safe-area-inset-bottom)",
        backgroundColor: "#FDFDFD",
        borderTop: "1px solid #E5E7EB",
      }}
    />
  );
}
