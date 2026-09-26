"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import BrandLink from "@/components/BrandLink";
import CallControls from "@/components/calls/CallControls";
import { useCustomerNav } from "@/components/users/CustomerNavProvider";

function CustomersIcon() {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 22, height: 22, fill: "currentColor" }}>
      <path d="M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5 1.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19.2c.4-2.6 2.6-4.2 5.5-4.2s5.1 1.6 5.5 4.2a1 1 0 0 1-1 1.1h-9a1 1 0 0 1-1-1.1Zm9.2-.2c-.2-1.5-1.2-2.6-2.7-3.2 1.8.1 3.4 1 4.3 2.5.3.5.2 1.1-.2 1.4-.3.2-.6.3-.9.3h-.5v-.1c0-.3 0-.6 0-.9Zm2.3-1.4c.7 1.1 1 2.2.8 3.1h2.1a1 1 0 0 0 1-1.1c-.3-2-2-3.4-4.2-3.6.2.5.3 1.1.3 1.6Z" />
    </Box>
  );
}

function ProfileIcon() {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 22, height: 22, fill: "currentColor" }}>
      <path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7.1c.6-3 3-4.8 7-4.8s6.4 1.8 7 4.8a1 1 0 0 1-1 1.2H6a1 1 0 0 1-1-1.2Z" />
    </Box>
  );
}

export default function Navbar({ name, call, canEscalate = false }: { name: string; call: { reference: string } | null; canEscalate?: boolean }) {
  const pathname = usePathname();
  const customer = useCustomerNav();
  const onCustomer = /^\/customers\/[^/]+/.test(pathname);
  const onProfile = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: { xs: "flex", md: "none" },
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        px: 2,
        pr: "max(16px, env(safe-area-inset-right))",
        pl: "max(16px, env(safe-area-inset-left))",
        pt: "max(8px, env(safe-area-inset-top))",
        pb: 1,
        minHeight: 64,
        backgroundColor: "#FDFDFD",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      {onCustomer ? (
        <Box
          component={NextLink}
          href="/customers"
          aria-label="Customers"
          sx={{
            flexShrink: 0,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "1px solid #E5E7EB",
            color: "#003264",
            backgroundColor: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          <CustomersIcon />
        </Box>
      ) : (
        <BrandLink width={112} />
      )}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: onCustomer ? "left" : "center",
          color: "#003264",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {onCustomer ? customer?.name : null}
      </Box>
      <CallControls call={call} canEscalate={canEscalate} />
      <Box
        component={NextLink}
        href="/profile"
        aria-label={`Account, ${name}`}
        aria-current={onProfile ? "page" : undefined}
        sx={{
          flexShrink: 0,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "1px solid #E5E7EB",
          color: onProfile ? "#0B75E1" : "#003264",
          backgroundColor: onProfile ? "rgba(11, 117, 225, 0.1)" : "#FFFFFF",
          textDecoration: "none",
        }}
      >
        <ProfileIcon />
      </Box>
    </Box>
  );
}
