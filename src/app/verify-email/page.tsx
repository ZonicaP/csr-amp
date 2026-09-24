import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Verify email" description="This confirms the address on your CSR account.">
      <VerifyEmailForm token={token ?? ""} />
    </AuthShell>
  );
}
