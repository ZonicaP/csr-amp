import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create your account" };
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Create your account" description="Set a password to activate the account an admin invited.">
      <SignupForm token={token ?? ""} />
    </AuthShell>
  );
}
