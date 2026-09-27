import AppShell from "@/components/AppShell";
import { signedInShell } from "@/lib/csr/signed-in-name";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const shell = await signedInShell();
  return <AppShell name={shell?.name ?? null} csrId={shell?.csrId ?? null} showTeam={shell?.showTeam ?? false} call={shell?.call ?? null}>{children}</AppShell>;
}
