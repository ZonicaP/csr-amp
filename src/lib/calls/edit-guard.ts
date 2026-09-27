export type HeldCaller = { reference: string; agent: string };

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

export function heldByOtherAgent(
  membershipId: string,
  myReference: string | null,
  serverHold: HeldCaller | null,
  liveCalls: { reference: string; membershipId: string | null; csrId: string; csrName: string }[] | null,
): HeldCaller | null {
  const mine = myReference?.trim() ?? "";
  if (liveCalls) {
    const wanted = membershipId.trim().toLowerCase();
    const live = liveCalls.find((call) => call.membershipId !== null && call.membershipId.toLowerCase() === wanted);
    if (!live || live.reference === mine) return null;
    return { reference: live.reference, agent: live.csrName };
  }
  if (!serverHold || serverHold.reference === mine) return null;
  return serverHold;
}

export function callEditNotice(call: CallForEditGuard | null, membershipId: string, held: HeldCaller | null = null): CallEditNotice | null {
  if (!call) return null;
  const linked = call.customer?.membershipId.trim() ?? "";
  const taken = held && held.reference !== call.reference ? held : null;
  if (linked.length === 0) {
    if (taken) {
      return {
        kind: "unlinked",
        title: "Already on a call",
        message: `This customer is already on ${taken.reference} with ${taken.agent}.`,
        canLink: false,
      };
    }
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
