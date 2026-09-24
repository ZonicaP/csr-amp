export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "OVERDUE" | "CANCELLED";
};
