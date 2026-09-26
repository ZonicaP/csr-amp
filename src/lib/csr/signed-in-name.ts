import { lookupOpenCall } from "@/lib/calls/call-service";
import { currentCsr } from "@/lib/csr/csr-service";
import { canEscalateCall, hasPermission } from "@/lib/csr/permissions";
import { readSession } from "@/lib/csr/session";

export async function signedInShell(): Promise<{ name: string; showTeam: boolean; canEscalate: boolean; call: { reference: string } | null } | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  try {
    const csr = await currentCsr(session.csrId);
    const call = await lookupOpenCall(session.csrId);
    return { name: csr.displayName, showTeam: hasPermission(csr.roles, "csr:read"), canEscalate: canEscalateCall(csr.roles), call };
  } catch {
    return null;
  }
}
