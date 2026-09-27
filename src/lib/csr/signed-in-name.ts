import { lookupOpenCall, type OpenCall } from "@/lib/calls/call-service";
import { currentCsr } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { readSession } from "@/lib/csr/session";

export async function signedInShell(): Promise<{ name: string; csrId: string; showTeam: boolean; call: OpenCall | null } | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  try {
    const csr = await currentCsr(session.csrId);
    const call = await lookupOpenCall(session.csrId);
    return { name: csr.displayName, csrId: csr.id, showTeam: hasPermission(csr.roles, "csr:read"), call };
  } catch {
    return null;
  }
}
