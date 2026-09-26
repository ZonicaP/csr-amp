"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";

function CustomersIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{ width: 24, height: 24, fill: "currentColor" }}
    >
      <path d="M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5 1.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19.2c.4-2.6 2.6-4.2 5.5-4.2s5.1 1.6 5.5 4.2a1 1 0 0 1-1 1.1h-9a1 1 0 0 1-1-1.1Zm9.2-.2c-.2-1.5-1.2-2.6-2.7-3.2 1.8.1 3.4 1 4.3 2.5.3.5.2 1.1-.2 1.4-.3.2-.6.3-.9.3h-.5v-.1c0-.3 0-.6 0-.9Zm2.3-1.4c.7 1.1 1 2.2.8 3.1h2.1a1 1 0 0 0 1-1.1c-.3-2-2-3.4-4.2-3.6.2.5.3 1.1.3 1.6Z" />
    </Box>
  );
}

function TeamIcon() {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 24, height: 24, fill: "currentColor" }}>
      <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 3a1.5 1.5 0 1 0 .01 3A1.5 1.5 0 0 0 12 5zM8.6 10.2h6.8V12H8.6v-1.8zm0 3.2h6.8v1.6H8.6v-1.6zm0 3.1H13v1.6H8.6v-1.6z" />
    </Box>
  );
}

const tabs = [
  { href: "/customers", label: "Customers", icon: CustomersIcon, match: (pathname: string) => pathname === "/customers" || pathname.startsWith("/customers/") },
  { href: "/team", label: "Team", icon: TeamIcon, match: (pathname: string) => pathname === "/team" || pathname.startsWith("/team/") },
] as const;

export default function TabBar({ showTeam }: { showTeam: boolean }) {
  const pathname = usePathname();
  if (/^\/customers\/[^/]+/.test(pathname)) return null;
  const visible = tabs.filter((tab) => tab.href !== "/team" || showTeam);

  return (
    <Box
      component="nav"
      aria-label="Tabs"
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: "#FDFDFD",
        borderTop: "1px solid #E5E7EB",
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      {visible.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Box
            key={tab.href}
            component={NextLink}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            sx={{
              flex: 1,
              minHeight: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              textDecoration: "none",
              color: active ? "#0B75E1" : "#717680",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <Icon />
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
