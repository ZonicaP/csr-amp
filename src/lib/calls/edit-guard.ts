export type CallForEditGuard = {
  reference: string;
  customer: { membershipId: string } | null;
};

export type CallEditNotice = {
  kind: "unlinked" | "other";
  title: string;
  message: string;
  canLink: boolean;
};

export function callEditNotice(call: CallForEditGuard | null, membershipId: string): CallEditNotice | null {
  if (!call) return null;
  const linked = call.customer?.membershipId.trim() ?? "";
  if (linked.length === 0) {
    return {
      kind: "unlinked",
      title: "Call not linked",
      message: `${call.reference} is not linked to this customer yet.`,
      canLink: true,
    };
  }
  if (linked.toLowerCase() === membershipId.trim().toLowerCase()) return null;
  return {
    kind: "other",
    title: "Call already linked",
    message: `${call.reference} is already linked to someone else.`,
    canLink: false,
  };
}
