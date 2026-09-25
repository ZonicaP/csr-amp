import Box from "@mui/material/Box";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import { CustomerNavProvider } from "@/components/users/CustomerNavProvider";

export default function AppShell({ name, showTeam = false, children }: { name: string | null; showTeam?: boolean; children: React.ReactNode }) {
  return (
    <CustomerNavProvider>
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {name ? <Navbar name={name} /> : null}
        <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
          {name ? <Sidebar name={name} showTeam={showTeam} /> : null}
          <Box
            component="section"
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              pb: name ? { xs: "calc(56px + env(safe-area-inset-bottom))", md: 0 } : 0,
            }}
          >
            {children}
          </Box>
        </Box>
        {name ? <TabBar showTeam={showTeam} /> : null}
      </Box>
    </CustomerNavProvider>
  );
}
