"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import { appNav } from "@/lib/navigation";

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <Box component="nav" aria-label="Pages" sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 3 }}>
      {appNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Box
            key={item.href}
            component={NextLink}
            href={item.href}
            aria-current={active ? "page" : undefined}
            sx={{
              px: 1.5,
              py: 1.25,
              borderRadius: "12px",
              textDecoration: "none",
              color: active ? "#0B75E1" : "#003264",
              backgroundColor: active ? "rgba(11, 117, 225, 0.1)" : "transparent",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {item.label}
          </Box>
        );
      })}
    </Box>
  );
}
