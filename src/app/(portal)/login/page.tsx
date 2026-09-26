import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";
import { siteDescription, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the AMP Memberships customer service portal.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign in · AMP CSR",
    description: "Sign in to the AMP Memberships customer service portal.",
    url: "/login",
  },
};

function signInJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AMP CSR",
    applicationCategory: "BusinessApplication",
    description: siteDescription,
    url: new URL("/login", siteUrl()).toString(),
    provider: { "@type": "Organization", name: "AMP Memberships" },
  };
}

export default async function LoginPage() {
  const session = await readSession();
  if (session) {
    const csr = await currentCsr(session.csrId);
    redirect(csr.emailVerified ? "/profile" : "/verify-email");
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(signInJsonLd()) }} />
      <AuthShell title="Sign in" description="Use the email and password for your CSR account.">
        <LoginForm />
      </AuthShell>
    </>
  );
}
