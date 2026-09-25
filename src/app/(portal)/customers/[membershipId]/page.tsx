import type { Metadata } from "next";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import StatusBadge from "@/components/StatusBadge";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import EditAccount from "@/components/users/EditAccount";
import { hasPermission } from "@/lib/csr/permissions";
import { loadCustomerPage } from "@/lib/users/load-customer-page";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ membershipId: string }> }): Promise<Metadata> {
  const { membershipId } = await params;
  return { title: `Info · ${membershipId.toUpperCase()}` };
}

export default async function CustomerInfoPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  const loaded = await loadCustomerPage(membershipId);
  if (loaded.forbidden) return null;
  const { csr, customer } = loaded;

  const canUpdate = hasPermission(csr.roles, "customers:update");
  const canCancel = hasPermission(csr.roles, "subscriptions:cancel");

  return (
    <Stack spacing={1.5}>
      <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #E5E7EB", borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "#717680", fontSize: 14 }}>Membership</Typography>
              <Typography sx={{ color: "#003264", fontWeight: 600 }}>{customer.membershipId}</Typography>
            </Stack>
            <StatusBadge status={customer.status} />
          </Stack>
          <Typography sx={{ color: "#717680", fontSize: 14 }}>Joined {date.format(customer.createdAt)}</Typography>
          {customer.status === "CANCELLED" && canUpdate ? (
            <AccountAction membershipId={customer.membershipId} action={{ type: "reactivate-membership" }} appearance="button" />
          ) : null}
          {customer.status !== "CANCELLED" && canCancel ? (
            <AccountAction membershipId={customer.membershipId} action={{ type: "cancel-membership" }} appearance="button" />
          ) : null}
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid #E5E7EB", borderRadius: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start", mb: 1.5 }}>
          <Typography sx={{ color: "#003264", fontWeight: 600 }}>Contact</Typography>
          {canUpdate ? (
            <EditAccount
              membershipId={customer.membershipId}
              firstName={customer.firstName}
              lastName={customer.lastName}
              email={customer.email}
              phone={customer.phone}
            />
          ) : null}
        </Stack>
        <Stack spacing={1.25}>
          <Stack spacing={0.25}>
            <Typography sx={{ color: "#717680", fontSize: 14 }}>Name</Typography>
            <Typography>
              {customer.firstName} {customer.lastName}
            </Typography>
          </Stack>
          <Stack spacing={0.25}>
            <Typography sx={{ color: "#717680", fontSize: 14 }}>Email</Typography>
            <Typography>{customer.email}</Typography>
          </Stack>
          <Stack spacing={0.25}>
            <Typography sx={{ color: "#717680", fontSize: 14 }}>Phone</Typography>
            <Typography>{customer.phone ?? "No phone"}</Typography>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
