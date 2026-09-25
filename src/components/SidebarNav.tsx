"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { appNav } from "@/lib/navigation";
import SmartDebug from "@/components/users/SmartDebug";
import { useCustomerNav } from "@/components/users/CustomerNavProvider";

const linkSx = {
  px: 1.5,
  py: 1.25,
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 16,
} as const;

function customerSection(pathname: string) {
  const match = pathname.match(/^\/customers\/([^/]+)/);
  if (!match) return null;
  const base = `/customers/${match[1]}`;
  return [
    { href: base, label: "Info", active: pathname === base },
    { href: `${base}/vehicles`, label: "Vehicles", active: pathname.startsWith(`${base}/vehicles`) },
    { href: `${base}/payments`, label: "Payments", active: pathname.startsWith(`${base}/payments`) },
    { href: `${base}/logs`, label: "Logs", active: pathname.startsWith(`${base}/logs`) },
  ];
}

export default function SidebarNav() {
  const pathname = usePathname();
  const customer = customerSection(pathname);
  const openCustomer = useCustomerNav();

  return (
    <Box component="nav" aria-label="Pages" sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 3 }}>
      {appNav.map((item) => {
        const active = pathname === item.href;
        const inCustomers = item.href === "/customers" && customer !== null;
        return (
          <Box
            key={item.href}
            component={NextLink}
            href={item.href}
            aria-current={active ? "page" : undefined}
            sx={{
              ...linkSx,
              color: active ? "#0B75E1" : "#003264",
              backgroundColor: active ? "rgba(11, 117, 225, 0.1)" : "transparent",
              fontWeight: inCustomers ? 700 : 600,
            }}
          >
            {item.label}
          </Box>
        );
      })}
      {customer ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1, pt: 1, borderTop: "1px solid #E5E7EB" }}>
          {openCustomer ? (
            <Typography noWrap sx={{ px: 1.5, pt: 0.5, pb: 0.25, color: "#003264", fontWeight: 700, fontSize: 14 }}>
              {openCustomer.name}
            </Typography>
          ) : null}
          {customer.map((item) => (
            <Box
              key={item.href}
              component={NextLink}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              sx={{
                ...linkSx,
                pl: 3,
                color: item.active ? "#0B75E1" : "#003264",
                backgroundColor: item.active ? "rgba(11, 117, 225, 0.1)" : "transparent",
              }}
            >
              {item.label}
            </Box>
          ))}
          {openCustomer ? (
            <SmartDebug
              membershipId={openCustomer.membershipId}
              account={openCustomer.account}
              issue={openCustomer.issue}
              maxDiscount={openCustomer.maxDiscount}
              placement="menu"
            />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
