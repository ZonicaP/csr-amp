export function searchTokens(query: string) {
  return query.trim().split(/\s+/).filter(Boolean);
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function customerMatchesQuery(customer: UserListItem, query: string) {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  return tokens.every((token) => {
    const digits = phoneDigits(token);
    const membershipKey = token.replace(/[^a-z0-9]/gi, "");
    const customerKey = customer.membershipId.replace(/[^a-z0-9]/gi, "");
    const contains = (value: string) => value.toLowerCase().includes(token.toLowerCase());
    return (
      contains(customer.firstName) ||
      contains(customer.lastName) ||
      contains(customer.email) ||
      (customer.phone !== null && contains(customer.phone)) ||
      contains(customer.membershipId) ||
      (digits.length > 0 && customer.phone !== null && phoneDigits(customer.phone).includes(digits)) ||
      (membershipKey.length > 0 && customerKey.toLowerCase().includes(membershipKey.toLowerCase()))
    );
  });
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
