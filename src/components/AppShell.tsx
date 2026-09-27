"use client";

import Box from "@mui/material/Box";
import { CallStreamProvider, usePortalCall } from "@/components/calls/CallStreamProvider";
import TransferredCallNotice from "@/components/calls/TransferredCallNotice";
import DesktopNavbar from "@/components/DesktopNavbar";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import type { OpenCall } from "@/lib/calls/call-service";
import { CustomerNavProvider } from "@/components/users/CustomerNavProvider";

export default function AppShell({ name, csrId = null, showTeam = false, call = null, children }: { name: string | null; csrId?: string | null; showTeam?: boolean; call?: OpenCall | null; children: React.ReactNode }) {
  const chrome = <PortalChrome name={name} showTeam={showTeam} call={call}>{children}</PortalChrome>;
  return (
    <CustomerNavProvider>
      {name && csrId ? (
        <CallStreamProvider csrId={csrId} serverCall={call}>
          {chrome}
        </CallStreamProvider>
      ) : chrome}
    </CustomerNavProvider>
  );
}

function PortalChrome({ name, showTeam = false, call = null, children }: { name: string | null; showTeam?: boolean; call?: OpenCall | null; children: React.ReactNode }) {
  const liveCall = usePortalCall(call);
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {name ? <Navbar name={name} call={liveCall} /> : null}
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
            {name ? <DesktopNavbar call={liveCall} /> : null}
            {name ? <TransferredCallNotice call={liveCall} /> : null}
            {children}
          </Box>
        </Box>
        {name ? <TabBar showTeam={showTeam} /> : null}
    </Box>
  );
}
