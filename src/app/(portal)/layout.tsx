import AppShell from "@/components/AppShell";
import { signedInShell } from "@/lib/csr/signed-in-name";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const shell = await signedInShell();
  return <AppShell name={shell?.name ?? null} showTeam={shell?.showTeam ?? false}>{children}</AppShell>;
}
