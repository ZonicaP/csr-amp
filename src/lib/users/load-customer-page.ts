import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedCsr } from "@/lib/csr/guard";
import { hasPermission } from "@/lib/csr/permissions";
import { getCustomer } from "@/lib/users/user-service";

export const loadCustomerPage = cache(async (membershipId: string) => {
  const csr = await requireVerifiedCsr();
  if (!hasPermission(csr.roles, "customers:read")) return { forbidden: true as const };
  const customer = await getCustomer(csr.id, membershipId);
  if (!customer) notFound();
  if (customer.membershipId !== membershipId) redirect(`/customers/${encodeURIComponent(customer.membershipId)}`);
  return { forbidden: false as const, csr, customer };
});
