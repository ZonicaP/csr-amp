import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddVehicle from "@/components/users/AddVehicle";
import PlateField from "@/components/users/PlateField";
import VehicleCard from "@/components/users/VehicleCard";
import VehicleSubscriptions from "@/components/users/VehicleSubscriptions";
import { hasPermission } from "@/lib/csr/permissions";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export async function generateMetadata({ params }: { params: Promise<{ membershipId: string }> }): Promise<Metadata> {
  const { membershipId } = await params;
  return { title: `Vehicles · ${membershipId.toUpperCase()}` };
}
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
      {hasPermission(csr.roles, "customers:update") ? (
        <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end" }}>
          <AddVehicle membershipId={customer.membershipId} />
        </Box>
      ) : null}
      {customer.vehicles.length === 0 ? <Typography>No vehicles on this account.</Typography> : null}
      {customer.vehicles.map((vehicle) => {
        const plan = [...vehicle.subscriptions].sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())[0];
        const vehiclePurchases = customer.purchases.filter((purchase) => purchase.vehicleId === vehicle.id);
        const failed = vehiclePurchases.find((purchase) => purchase.failureReason);
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
            payment={!plan || customer.status === "CANCELLED" ? null : failed ? "outstanding" : "up-to-date"}
            paymentLink={
              failed
                ? { membershipId: customer.membershipId, purchaseId: failed.id }
                : null
            }
            payments={vehiclePurchases.map((purchase) => ({
              id: purchase.id,
              description: purchase.description,
              amount: money.format(Number(purchase.amount)),
              date: date.format(purchase.purchasedAt),
              failureReason: purchase.failureReason,
            }))}
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
          />
        );
      })}
    </Stack>
  );
}
