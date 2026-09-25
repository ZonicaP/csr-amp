import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Choose a new password" };
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" description="This link expires one hour after it was created.">
      <ResetPasswordForm token={token ?? ""} />
    </AuthShell>
  );
}
