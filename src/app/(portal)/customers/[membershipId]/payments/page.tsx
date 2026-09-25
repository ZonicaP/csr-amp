import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import { accountSnapshot, duplicateCharge } from "@/lib/debug/account-issue";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ membershipId: string }> }): Promise<Metadata> {
  const { membershipId } = await params;
  return { title: `Payments · ${membershipId.toUpperCase()}` };
}

export default async function CustomerPaymentsPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) return null;
  const { customer } = loaded;
  const duplicate = duplicateCharge(accountSnapshot(customer));

  return (
    <Stack spacing={1}>
      {customer.purchases.length === 0 ? <Typography>No payments on this account.</Typography> : null}
      {customer.purchases.map((purchase) => {
        const refund = duplicate?.id === purchase.id;
        return (
          <Paper key={purchase.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
            <Stack spacing={0.25}>
              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
                <Stack direction="row" sx={{ gap: 1, alignItems: "baseline", flexWrap: "wrap", minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14 }}>{purchase.description}</Typography>
                  <Typography sx={{ color: "#717680", fontSize: 14 }}>·</Typography>
                  <Typography sx={{ color: "#717680", fontSize: 13 }}>{date.format(purchase.purchasedAt)}</Typography>
                </Stack>
                <Typography sx={{ flexShrink: 0, color: "#717680", fontSize: 13 }}>{money.format(Number(purchase.amount))}</Typography>
              </Stack>
              {purchase.failureReason ? <Typography sx={{ color: "#717680", fontSize: 14 }}>{purchase.failureReason}</Typography> : null}
              {refund ? <AccountAction membershipId={customer.membershipId} action={{ type: "refund-charge", purchaseId: purchase.id }} /> : null}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
