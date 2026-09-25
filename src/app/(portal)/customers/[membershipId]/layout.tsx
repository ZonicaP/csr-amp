import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CustomerChrome from "@/components/users/CustomerChrome";
import { accountIssue, accountSnapshot, duplicateCharge, type SuggestedAction } from "@/lib/debug/account-issue";
import { maxDiscountPercent } from "@/lib/users/discount";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

export async function generateMetadata({ params }: { params: Promise<{ membershipId: string }> }): Promise<Metadata> {
  const { membershipId } = await params;
  return { title: membershipId.toUpperCase() };
}

export default async function CustomerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) {
    return (
      <Box component="main" id="main" sx={{ p: 3 }}>
        <Typography>You do not have permission to view customers.</Typography>
      </Box>
    );
  }
  const { csr, customer } = loaded;
  const snapshot = accountSnapshot(customer);
  const duplicate = duplicateCharge(snapshot);
  const failedPayment = customer.purchases.find((purchase) => purchase.failureReason);
  const actions: SuggestedAction[] = [
    ...(failedPayment ? [{ type: "email-payment-link" as const, purchaseId: failedPayment.id }] : []),
    ...(customer.status === "CANCELLED"
      ? [{ type: "reactivate-membership" as const }]
      : [{ type: "cancel-membership" as const }, { type: "offer-discount" as const }]),
    { type: "email-plate-documents" },
    ...(duplicate ? [{ type: "refund-charge" as const, purchaseId: duplicate.id }] : []),
  ];

  return (
    <CustomerChrome
      membershipId={customer.membershipId}
      name={`${customer.firstName} ${customer.lastName}`}
      actions={actions}
      maxDiscount={maxDiscountPercent(csr.roles)}
      account={snapshot}
      issue={accountIssue(snapshot)}
    >
      {children}
    </CustomerChrome>
  );
}
