import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";

export async function signedInName(): Promise<string | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  try {
    return (await currentCsr(session.csrId)).displayName;
  } catch {
    return null;
  }
}
