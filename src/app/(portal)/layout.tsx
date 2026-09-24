import AppShell from "@/components/AppShell";
import { signedInName } from "@/lib/csr/signed-in-name";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const name = await signedInName();
  return <AppShell name={name}>{children}</AppShell>;
}
