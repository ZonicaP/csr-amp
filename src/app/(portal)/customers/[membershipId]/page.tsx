import { notFound, redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import StatusBadge from "@/components/StatusBadge";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import EditAccount from "@/components/users/EditAccount";
import AccountMenu from "@/components/users/AccountMenu";
import SmartDebug from "@/components/users/SmartDebug";
import VehicleCard from "@/components/users/VehicleCard";
import PlateField from "@/components/users/PlateField";
import VehicleSubscriptions from "@/components/users/VehicleSubscriptions";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";
import { accountIssue, accountSnapshot, duplicateCharge, type SuggestedAction } from "@/lib/debug/account-issue";
import { maxDiscountPercent } from "@/lib/users/discount";
import { getCustomer } from "@/lib/users/user-service";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function CustomerPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const csr = await requireVerifiedCsr();
  if (!hasPermission(csr.roles, "customers:read")) {
    return (
      <Box component="main" sx={{ p: 3 }}>
        <Typography>You do not have permission to view customers.</Typography>
      </Box>
    );
  }
  const customer = await getCustomer(csr.id, membershipId);
  if (!customer) notFound();
  if (customer.membershipId !== membershipId) redirect(`/customers/${encodeURIComponent(customer.membershipId)}`);

  const vehicleLabel = (vehicle: (typeof customer.vehicles)[number]) =>
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
  const snapshot = accountSnapshot(customer);
  const duplicate = duplicateCharge(snapshot);
  const failedPayment = customer.purchases.find((purchase) => purchase.failureReason);
  const menuActions: SuggestedAction[] = [
    ...(failedPayment ? [{ type: "email-payment-link" as const, purchaseId: failedPayment.id }] : []),
    ...(customer.status === "CANCELLED"
      ? [{ type: "reactivate-membership" as const }]
      : [{ type: "cancel-membership" as const }, { type: "offer-discount" as const }]),
    ...customer.vehicles.map((vehicle) => ({ type: "email-plate-documents" as const, vehicleId: vehicle.id })),
    ...(duplicate ? [{ type: "refund-charge" as const, purchaseId: duplicate.id }] : []),
  ];

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        px: 2,
        pt: 3,
        pb: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, #F5FAFF 0%, #FDFDFD 70%)",
      }}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="h1">
              {customer.firstName} {customer.lastName}
            </Typography>
            <Stack direction="row" sx={{ mt: 0.5, gap: 1, alignItems: "center" }}>
              <Typography sx={{ color: "#003264", fontWeight: 600 }}>{customer.membershipId}</Typography>
              <StatusBadge status={customer.status} />
            </Stack>
          </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <SmartDebug membershipId={customer.membershipId} account={snapshot} issue={accountIssue(snapshot)} maxDiscount={maxDiscountPercent(csr.roles)} />
              <AccountMenu membershipId={customer.membershipId} actions={menuActions} maxDiscount={maxDiscountPercent(csr.roles)} />
            </Stack>
        </Stack>
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography>{customer.email}</Typography>
              <Typography>{customer.phone ?? "No phone"}</Typography>
            </Box>
            {hasPermission(csr.roles, "customers:update") ? (
              <EditAccount
                membershipId={customer.membershipId}
                firstName={customer.firstName}
                lastName={customer.lastName}
                email={customer.email}
                phone={customer.phone}
              />
            ) : null}
          </Stack>
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Joined {date.format(customer.createdAt)}</Typography>
        </Paper>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Vehicles
          </Typography>
          <Stack spacing={1}>
            {customer.vehicles.length === 0 ? <Typography>No vehicles on this account.</Typography> : null}
            {customer.vehicles.map((vehicle) => {
              const plan = [...vehicle.subscriptions].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())[0];
              const failed = customer.purchases.find((purchase) => purchase.failureReason);
              const paid = customer.purchases.find((purchase) => !purchase.failureReason);
              return (
                <VehicleCard
                  key={vehicle.id}
                  name={vehicleLabel(vehicle)}
                  plate={vehicle.licensePlate}
                  since={plan ? date.format(plan.startedAt) : null}
                  plans={vehicle.subscriptions.map((subscription) => ({
                    id: subscription.id,
                    name: subscription.planName,
                    status: subscription.status,
                  }))}
                  payment={!plan || customer.status === "CANCELLED" ? null : customer.status === "OVERDUE" ? "outstanding" : "up-to-date"}
                  failure={
                    failed?.failureReason
                      ? {
                          reason: failed.failureReason,
                          amount: money.format(Number(failed.amount)),
                          date: date.format(failed.purchasedAt),
                        }
                      : null
                  }
                  lastPayment={
                    paid
                      ? { amount: money.format(Number(paid.amount)), date: date.format(paid.purchasedAt) }
                      : null
                  }
                  paymentLink={
                    failed
                      ? { membershipId: customer.membershipId, purchaseId: failed.id }
                      : null
                  }
                  plateEditor={
                    hasPermission(csr.roles, "customers:update") ? (
                      <PlateField membershipId={customer.membershipId} vehicleId={vehicle.id} plate={vehicle.licensePlate} />
                    ) : null
                  }
                  planEditor={
                    <VehicleSubscriptions
                      membershipId={customer.membershipId}
                      vehicleId={vehicle.id}
                      plans={vehicle.subscriptions.map((subscription) => ({
                        id: subscription.id,
                        name: subscription.planName,
                        status: subscription.status,
                        since: date.format(subscription.startedAt),
                      }))}
                      canAdd={hasPermission(csr.roles, "customers:update") && customer.status !== "CANCELLED"}
                      canRemove={hasPermission(csr.roles, "subscriptions:cancel")}
                      canTransfer={hasPermission(csr.roles, "subscriptions:transfer")}
                    />
                  }
                  extra={
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                      {customer.status === "CANCELLED" ? (
                        <AccountAction membershipId={customer.membershipId} action={{ type: "reactivate-membership" }} appearance="button" />
                      ) : null}
                      <AccountAction membershipId={customer.membershipId} action={{ type: "email-plate-documents", vehicleId: vehicle.id }} appearance="button" />
                    </Stack>
                  }
                />
              );
            })}
          </Stack>
        </Box>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Payment history
          </Typography>
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
                  {purchase.failureReason ? (
                    <Typography sx={{ color: "#717680", fontSize: 14 }}>{purchase.failureReason}</Typography>
                  ) : null}
                  {refund ? (
                    <AccountAction membershipId={customer.membershipId} action={{ type: "refund-charge", purchaseId: purchase.id }} />
                  ) : null}
                </Stack>
              </Paper>
              );
            })}
          </Stack>
        </Box>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Logs
          </Typography>
          <Stack spacing={1}>
            {customer.events.length === 0 ? <Typography>No events on this account.</Typography> : null}
            {customer.events.map((event) => (
              <Paper key={event.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
                  <Typography sx={{ minWidth: 0, fontSize: 14 }}>{event.summary}</Typography>
                  <Typography sx={{ flexShrink: 0, color: "#717680", fontSize: 13 }}>{date.format(event.createdAt)}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
