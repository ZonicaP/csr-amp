"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CallerLink from "@/components/calls/CallerLink";
import AccountMenu from "@/components/users/AccountMenu";
import AddVehicle from "@/components/users/AddVehicle";
import LikelyIssue from "@/components/users/LikelyIssue";
import SmartDebug from "@/components/users/SmartDebug";
import type { OpenCall } from "@/lib/calls/call-service";
import type { AccountIssue, AccountSnapshot, SuggestedAction } from "@/lib/debug/account-issue";
import { PublishCustomerNav } from "@/components/users/CustomerNavProvider";

function TabIcon({ path }: { path: string }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 22, height: 22, fill: "currentColor" }}>
      <path d={path} />
    </Box>
  );
}

const tabIcons = {
  Info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  Vehicles: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  Payments: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
  Logs: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
};

export default function CustomerChrome({
  membershipId,
  name,
  actions,
  maxDiscount,
  account,
  issue,
  canAddVehicle = false,
  call = null,
  children,
}: {
  membershipId: string;
  name: string;
  actions: SuggestedAction[];
  maxDiscount: number | null;
  account: AccountSnapshot;
  issue: AccountIssue;
  canAddVehicle?: boolean;
  call?: OpenCall | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/customers/${encodeURIComponent(membershipId)}`;
  const tabs: { href: string; label: keyof typeof tabIcons; match: boolean }[] = [
    { href: base, label: "Info", match: pathname === base },
    { href: `${base}/vehicles`, label: "Vehicles", match: pathname.startsWith(`${base}/vehicles`) },
    { href: `${base}/payments`, label: "Payments", match: pathname.startsWith(`${base}/payments`) },
    { href: `${base}/logs`, label: "Logs", match: pathname.startsWith(`${base}/logs`) },
  ];
  const leading = tabs.slice(0, 2);
  const trailing = tabs.slice(2);
  const pageTitle = tabs.find((tab) => tab.match)?.label ?? "Info";

  return (
    <Box
      component="main"
      id="main"
      sx={{
        flex: 1,
        px: 2,
        pt: 2,
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <PublishCustomerNav name={name} membershipId={membershipId} account={account} issue={issue} maxDiscount={maxDiscount} />
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
          <Typography
            component="h1"
            sx={{
              minWidth: 0,
              color: "#003264",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              fontWeight: { xs: 600, md: 300 },
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            {pageTitle}
          </Typography>
          <Box sx={{ flexShrink: 0, display: { xs: "none", md: "block" } }}>
            <AccountMenu membershipId={membershipId} actions={actions} maxDiscount={maxDiscount} />
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, flexShrink: 0, gap: 1, alignItems: "center" }}>
            {canAddVehicle && pathname.startsWith(`${base}/vehicles`) ? <AddVehicle membershipId={membershipId} /> : null}
            <AccountMenu membershipId={membershipId} actions={actions} maxDiscount={maxDiscount} />
          </Box>
        </Stack>
        <CallerLink membershipId={membershipId} call={call} />
        {pathname === base ? <LikelyIssue membershipId={membershipId} issue={issue} maxDiscount={maxDiscount} /> : null}
        <Box
          component="nav"
          aria-label="Customer"
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
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
          {leading.map((tab) => (
            <CustomerTab key={tab.href} href={tab.href} label={tab.label} active={tab.match} icon={tabIcons[tab.label]} />
          ))}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <SmartDebug membershipId={membershipId} account={account} issue={issue} maxDiscount={maxDiscount} placement="center" />
          </Box>
          {trailing.map((tab) => (
            <CustomerTab key={tab.href} href={tab.href} label={tab.label} active={tab.match} icon={tabIcons[tab.label]} />
          ))}
        </Box>
        {children}
      </Stack>
    </Box>
  );
}

function CustomerTab({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: string }) {
  return (
    <Box
      component={NextLink}
      href={href}
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
      <TabIcon path={icon} />
      {label}
    </Box>
  );
}
