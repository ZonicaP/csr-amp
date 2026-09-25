import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Verify email" };
import AuthShell from "@/components/auth/AuthShell";
import AwaitingVerification from "@/components/auth/AwaitingVerification";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const session = await readSession();
  if (token) {
    return (
      <AuthShell title="Verify email" description="This confirms the address on your CSR account." showLogo={!session}>
        <VerifyEmailForm token={token} />
      </AuthShell>
    );
  }

  if (!session) {
    redirect("/login");
  }
  const csr = await currentCsr(session.csrId);
  if (csr.emailVerified) {
    redirect("/");
  }

  return (
    <AuthShell title="Verify your email" description="Your account stays limited until this address is confirmed." showLogo={false}>
      <AwaitingVerification email={csr.email} />
    </AuthShell>
  );
}
