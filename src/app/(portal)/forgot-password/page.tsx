import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Reset password" };
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" description="Enter the email on your CSR account. We’ll prepare a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
