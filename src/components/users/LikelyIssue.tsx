"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import SendPaymentLink from "@/components/users/SendPaymentLink";
import type { AccountIssue, SuggestedAction } from "@/lib/debug/account-issue";

const barColor = {
  warning: { background: "#FFF8EB", border: "#FFA100", label: "#C47F00" },
  success: { background: "#F3FBF7", border: "#11B76B", label: "#0E8F54" },
  neutral: { background: "#F5F6F7", border: "#E5E7EB", label: "#717680" },
} as const;

function actionKey(action: SuggestedAction) {
  if (action.type === "email-payment-link" || action.type === "refund-charge") return `${action.type}-${action.purchaseId}`;
  return action.type;
}

export default function LikelyIssue({
  membershipId,
  issue,
  maxDiscount = 10,
  headline,
}: {
  membershipId: string;
  issue: AccountIssue;
  maxDiscount?: number | null;
  headline?: string;
}) {
  const colors = barColor[issue.tone];

  return (
    <Box
      role="status"
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        columnGap: 1,
        alignItems: "start",
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.background,
      }}
    >
      <Typography sx={{ gridColumn: 1, gridRow: 1, color: colors.label, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
        MOST LIKELY
      </Typography>
      {issue.actions.length > 0 ? (
        <Stack sx={{ gridColumn: 2, gridRow: { xs: 1, md: 2 }, alignItems: "flex-end", alignSelf: "center" }}>
          {issue.actions.map((action) =>
            action.type === "email-payment-link" ? (
              <SendPaymentLink key={actionKey(action)} membershipId={membershipId} purchaseId={action.purchaseId} />
            ) : (
              <AccountAction key={actionKey(action)} membershipId={membershipId} action={action} maxDiscount={maxDiscount} />
            ),
          )}
        </Stack>
      ) : null}
      <Box sx={{ gridColumn: { xs: "1 / -1", md: 1 }, gridRow: 2, minWidth: 0 }}>
        <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>{headline ?? issue.headline}</Typography>
        <Typography sx={{ color: "#717680", fontSize: 14 }}>{issue.detail}</Typography>
      </Box>
    </Box>
  );
}
