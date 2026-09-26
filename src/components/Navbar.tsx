"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import BrandLink from "@/components/BrandLink";
import { useCustomerNav } from "@/components/users/CustomerNavProvider";

function ProfileIcon() {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 22, height: 22, fill: "currentColor" }}>
      <path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7.1c.6-3 3-4.8 7-4.8s6.4 1.8 7 4.8a1 1 0 0 1-1 1.2H6a1 1 0 0 1-1-1.2Z" />
    </Box>
  );
}

export default function Navbar({ name }: { name: string }) {
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
        alignItems: "center",
        gap: 1.5,
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
        <Button component={NextLink} href="/customers" variant="outlined" sx={{ flexShrink: 0, "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}>
          Customers
        </Button>
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
          textAlign: "center",
          color: "#003264",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {onCustomer ? customer?.name : null}
      </Box>
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
