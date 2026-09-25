import Link from "next/link";
import Box from "@mui/material/Box";
import BrandLink from "@/components/BrandLink";
import SidebarNav from "@/components/SidebarNav";
import SignOutButton from "@/components/SignOutButton";

export default function Sidebar({ name, showTeam }: { name: string; showTeam: boolean }) {
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100dvh",
        overflow: "auto",
        boxSizing: "border-box",
        px: 2,
        py: 2.5,
        backgroundColor: "#FDFDFD",
        borderRight: "1px solid #E5E7EB",
      }}
    >
      <BrandLink width={120} />
      <SidebarNav showTeam={showTeam} />
      <Box sx={{ mt: "auto", pt: 3, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
        <Link href="/profile" aria-label={`Account, ${name}`} style={{ color: "#717680", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
          {name}
        </Link>
        <SignOutButton />
      </Box>
    </Box>
  );
}
