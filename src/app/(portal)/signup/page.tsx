import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { inviteEmailForToken } from "@/lib/csr/csr-service";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await inviteEmailForToken(token) : null;
  return (
    <AuthShell
      title="Create your account"
      description={invite ? "This invite is for the email below. Choose a password to create the account." : "Enter the email an admin invited, and choose a password."}
    >
      <SignupForm token={invite && token ? token : ""} email={invite?.email ?? ""} linkExpired={Boolean(token) && !invite} />
    </AuthShell>
  );
}
