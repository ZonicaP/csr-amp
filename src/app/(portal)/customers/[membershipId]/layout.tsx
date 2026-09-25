import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CustomerChrome from "@/components/users/CustomerChrome";
import { accountIssue, accountSnapshot, duplicateCharge, type SuggestedAction } from "@/lib/debug/account-issue";
import { maxDiscountPercent } from "@/lib/users/discount";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

export default async function CustomerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) {
    return (
      <Box component="main" sx={{ p: 3 }}>
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
    ...customer.vehicles.map((vehicle) => ({ type: "email-plate-documents" as const, vehicleId: vehicle.id })),
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
