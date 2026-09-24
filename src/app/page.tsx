import AuthShell from "@/components/auth/AuthShell";
import { requireVerifiedCsr } from "@/lib/csr/guard";

export default async function Home() {
  const csr = await requireVerifiedCsr();

  return (
    <AuthShell title={`Hello, ${csr.name}`} description="Your email is verified. The customer service tools will live here.">
      <span />
    </AuthShell>
  );
}
