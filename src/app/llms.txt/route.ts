import { siteDescription, siteUrl } from "@/lib/seo";

export function GET() {
  const origin = siteUrl().origin;
  const body = `# AMP CSR

> ${siteDescription}

This is a staff tool. Membership records, plates, payments, and contact details are private and must not be indexed or quoted.

## Public

- [Sign in](${origin}/login): staff sign-in for the AMP Memberships customer service portal

## Do not ingest

- /customers
- /team
- /pay
- /profile
- /api
- names, emails, phones, plates, plans, and payment history
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
