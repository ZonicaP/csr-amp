import NextLink from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const csr = await requireVerifiedCsr();
  if (!hasPermission(csr.roles, "customers:read")) {
    return (
      <Box component="main" sx={{ p: 3 }}>
        <Typography>You do not have permission to view customers.</Typography>
      </Box>
    );
  }
  const customer = await getCustomer(csr.id, id);
  if (!customer) notFound();

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
          <Typography sx={{ display: { xs: "none", md: "block" }, color: "#717680", fontSize: 13, fontWeight: 600 }}>
            Account
          </Typography>
          <Typography sx={{ mt: { xs: 0, md: 1 } }}>{customer.email}</Typography>
          <Typography>{customer.phone ?? "No phone"}</Typography>
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Customer since {date.format(customer.createdAt)}</Typography>
        </Paper>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Vehicles
          </Typography>
          <Stack spacing={1}>
            {customer.vehicles.length === 0 ? <Typography>No vehicles on this account.</Typography> : null}
            {customer.vehicles.map((vehicle) => (
              <Paper key={vehicle.id} elevation={0} sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: 3 }}>
                <Typography sx={{ color: "#003264", fontWeight: 600 }}>{vehicleLabel(vehicle)}</Typography>
                <Typography sx={{ fontSize: 14 }}>{vehicle.licensePlate ?? "No plate"}</Typography>
                {vehicle.subscriptions.length === 0 ? (
                  <Typography sx={{ mt: 1, fontSize: 14 }}>No membership on this vehicle.</Typography>
                ) : (
                  vehicle.subscriptions.map((subscription) => (
                    <Stack key={subscription.id} direction="row" sx={{ mt: 1, justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                      <Typography sx={{ color: "#717680", fontSize: 14 }}>Since {date.format(subscription.startedAt)}</Typography>
                      <Chip size="small" label={subscription.planName} color={statusColor[subscription.status]} />
                    </Stack>
                  ))
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography component="h2" sx={{ color: "#003264", fontWeight: 600, mb: 1 }}>
            Purchases
          </Typography>
          <Stack spacing={1}>
            {customer.purchases.length === 0 ? <Typography>No purchases on this account.</Typography> : null}
            {customer.purchases.map((purchase) => (
              <Paper key={purchase.id} elevation={0} sx={{ px: 2, py: 1.5, border: "1px solid #E5E7EB", borderRadius: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{purchase.description}</Typography>
                    <Typography sx={{ color: "#717680", fontSize: 14 }}>{date.format(purchase.purchasedAt)}</Typography>
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
