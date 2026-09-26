export function handoffAllowed(input: { actorId: string; targetId: string; targetActive: boolean; targetHasOpenCall: boolean }) {
  const targetId = input.targetId.trim();
  if (targetId.length === 0 || targetId === input.actorId) {
    return { ok: false as const, code: "INVALID" as const, error: "Choose another CSR" };
  }
  if (!input.targetActive) {
    return { ok: false as const, code: "INVALID" as const, error: "Choose an active CSR" };
  }
  if (input.targetHasOpenCall) {
    return { ok: false as const, code: "CONFLICT" as const, error: "That CSR already has an open call" };
  }
  return { ok: true as const };
}
