import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import PlateField from "@/components/users/PlateField";
import VehicleCard from "@/components/users/VehicleCard";
import VehicleSubscriptions from "@/components/users/VehicleSubscriptions";
import { hasPermission } from "@/lib/csr/permissions";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function CustomerVehiclesPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) return null;
  const { csr, customer } = loaded;
  const vehicleLabel = (vehicle: (typeof customer.vehicles)[number]) =>
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";

  return (
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
            extra={<AccountAction membershipId={customer.membershipId} action={{ type: "email-plate-documents", vehicleId: vehicle.id }} appearance="button" />}
          />
        );
      })}
    </Stack>
  );
}
