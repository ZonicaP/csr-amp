"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AccountAction from "@/components/users/AccountAction";
import SendPaymentLink from "@/components/users/SendPaymentLink";
import type { SuggestedAction } from "@/lib/debug/account-issue";

function actionKey(action: SuggestedAction) {
  if (action.type === "email-payment-link" || action.type === "refund-charge") return `${action.type}-${action.purchaseId}`;
  return action.type;
}

export default function AccountMenu({ membershipId, actions, maxDiscount = 10 }: { membershipId: string; actions: SuggestedAction[]; maxDiscount?: number | null }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          width: 36,
          height: 36,
          color: "#181D27",
          border: "1px solid #E5E7EB",
          borderRadius: "40px",
          "&&": { minWidth: 36, minHeight: 36, p: 0 },
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        keepMounted
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { elevation: 0, sx: { mt: 0.5, minWidth: 220, border: "1px solid #E5E7EB", borderRadius: 2 } } }}
      >
        {actions.length === 0 ? <MenuItem disabled>No actions for this account</MenuItem> : null}
        {actions.map((action) => (
          <MenuItem key={actionKey(action)} onClick={() => setAnchor(null)} sx={{ py: 0.25 }}>
            {action.type === "email-payment-link" ? (
              <SendPaymentLink membershipId={membershipId} purchaseId={action.purchaseId} textColor="#181D27" onActivate={() => setAnchor(null)} />
            ) : (
              <AccountAction membershipId={membershipId} action={action} textColor="#181D27" maxDiscount={maxDiscount} onActivate={() => setAnchor(null)} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
