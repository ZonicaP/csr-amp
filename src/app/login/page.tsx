import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" description="Use the email and password for your CSR account.">
      <LoginForm />
    </AuthShell>
  );
}
