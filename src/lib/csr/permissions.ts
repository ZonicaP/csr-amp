import type { CsrRoleName } from "@prisma/client";

export const permissions = [
  "customers:read",
  "purchases:read",
  "subscriptions:read",
  "customers:update",
  "subscriptions:cancel",
  "subscriptions:transfer",
  "billing:resolve-overdue",
  "csr:read",
  "csr:manage",
] as const;

export type Permission = (typeof permissions)[number];

const agentPermissions: Permission[] = [
  "customers:read",
  "purchases:read",
  "subscriptions:read",
  "customers:update",
];

const supervisorPermissions: Permission[] = [
  ...agentPermissions,
  "subscriptions:cancel",
  "subscriptions:transfer",
  "billing:resolve-overdue",
  "csr:read",
];

export const rolePermissions: Record<CsrRoleName, readonly Permission[]> = {
  AGENT: agentPermissions,
  SUPERVISOR: supervisorPermissions,
  ADMIN: permissions,
};

export function permissionsForRoles(roles: readonly CsrRoleName[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of rolePermissions[role]) {
      granted.add(permission);
    }
  }
  return granted;
}

export function hasPermission(roles: readonly CsrRoleName[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}
