import { currentCsr } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { readSession } from "@/lib/csr/session";

export async function signedInShell(): Promise<{ name: string; showTeam: boolean } | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  try {
    const csr = await currentCsr(session.csrId);
    return { name: csr.displayName, showTeam: hasPermission(csr.roles, "csr:read") };
  } catch {
    return null;
  }
}
