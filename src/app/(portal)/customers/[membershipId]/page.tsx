import NextLink from "next/link";
import { notFound, redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VehicleCard from "@/components/users/VehicleCard";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";
import { getCustomer } from "@/lib/users/user-service";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const statusColor = {
  ACTIVE: "success",
  OVERDUE: "warning",
  CANCELLED: "default",
} as const;

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
        <NextLink href="/customers" style={{ color: "#0B75E1", fontWeight: 600, textDecoration: "none" }}>
          Customers
        </NextLink>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" variant="h1">
              {customer.firstName} {customer.lastName}
            </Typography>
            <Typography sx={{ mt: 0.5, color: "#003264", fontWeight: 600 }}>{customer.membershipId}</Typography>
          </Box>
          <Chip
            size="small"
            label={customer.status.charAt(0) + customer.status.slice(1).toLowerCase()}
            color={statusColor[customer.status]}
          />
        </Stack>
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #E5E7EB", borderRadius: 3 }}>
          <Typography>{customer.email}</Typography>
          <Typography>{customer.phone ?? "No phone"}</Typography>
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Customer since {date.format(customer.createdAt)}</Typography>
        </Paper>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Vehicles
          </Typography>
          <Stack spacing={1}>
            {customer.vehicles.length === 0 ? <Typography>No vehicles on this account.</Typography> : null}
            {customer.vehicles.map((vehicle) => {
              const plan = vehicle.subscriptions[0];
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
            {customer.purchases.map((purchase) => (
              <Paper key={purchase.id} elevation={0} sx={{ px: 2, py: 1.25, border: "1px solid #E5E7EB", borderRadius: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" sx={{ gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 600 }}>{purchase.description}</Typography>
                      <Typography sx={{ color: "#717680", fontSize: 14 }}>{date.format(purchase.purchasedAt)}</Typography>
                    </Stack>
                    {purchase.failureReason ? (
                      <Typography sx={{ color: "#717680", fontSize: 14 }}>{purchase.failureReason}</Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ flexShrink: 0, fontWeight: 600 }}>{money.format(Number(purchase.amount))}</Typography>
                </Stack>
              </Paper>
            ))}
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
