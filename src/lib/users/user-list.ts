export function searchTokens(query: string) {
  return query.trim().split(/\s+/).filter(Boolean);
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  membershipId: string;
  status: "ACTIVE" | "OVERDUE" | "CANCELLED";
};
