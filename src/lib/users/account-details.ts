export type AccountDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAccountDetails(input: { firstName: string; lastName: string; email: string; phone: string }): { value: AccountDetails } | { error: string } {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (firstName.length < 1 || firstName.length > 80 || /[\r\n]/.test(firstName)) return { error: "Enter a first name" };
  if (lastName.length < 1 || lastName.length > 80 || /[\r\n]/.test(lastName)) return { error: "Enter a last name" };
  if (email.length > 254 || !emailPattern.test(email)) return { error: "Enter a valid email" };
  const digits = phone.replace(/\D/g, "");
  if (phone && (digits.length < 7 || digits.length > 15)) return { error: "Enter a phone number with 7 to 15 digits" };
  return { value: { firstName, lastName, email, phone: phone || null } };
}

export function accountDetailChanges(current: AccountDetails, next: AccountDetails) {
  const changes: string[] = [];
  if (current.firstName !== next.firstName || current.lastName !== next.lastName) {
    changes.push(`Name changed from ${current.firstName} ${current.lastName} to ${next.firstName} ${next.lastName}.`);
  }
  if (current.email.toLowerCase() !== next.email) {
    changes.push(`Email changed from ${current.email} to ${next.email}.`);
  }
  if ((current.phone ?? "") !== (next.phone ?? "")) {
    changes.push(`Phone changed from ${current.phone ?? "none"} to ${next.phone ?? "none"}.`);
  }
  return changes;
}
