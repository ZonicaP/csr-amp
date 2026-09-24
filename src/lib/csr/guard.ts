import { redirect } from "next/navigation";
import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";

export async function requireVerifiedCsr() {
  const session = await readSession();
  if (!session) {
    redirect("/login");
  }
  const csr = await currentCsr(session.csrId);
  if (!csr.emailVerified) {
    redirect("/verify-email");
  }
  return csr;
}
