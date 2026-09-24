import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";

export default async function LoginPage() {
  const session = await readSession();
  if (session) {
    const csr = await currentCsr(session.csrId);
    redirect(csr.emailVerified ? "/" : "/verify-email");
  }

  return (
    <AuthShell title="Sign in" description="Use the email and password for your CSR account.">
      <LoginForm />
    </AuthShell>
  );
}
