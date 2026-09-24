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

export default function TabBar() {
  const pathname = usePathname();
  const active = pathname === "/customers" || pathname.startsWith("/customers/");

  return (
    <Box
      component="nav"
      aria-label="Tabs"
      sx={{
        display: { xs: "block", md: "none" },
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
      <Box
        component={NextLink}
        href="/customers"
        aria-current={active ? "page" : undefined}
        sx={{
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
        <CustomersIcon />
        Customers
      </Box>
    </Box>
  );
}
