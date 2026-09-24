import Box from "@mui/material/Box";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";

export default function AppShell({ name, children }: { name: string | null; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {name ? <Navbar name={name} /> : null}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        {name ? <Sidebar name={name} /> : null}
        <Box component="section" sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {children}
        </Box>
      </Box>
      {name ? <TabBar /> : null}
    </Box>
  );
}
