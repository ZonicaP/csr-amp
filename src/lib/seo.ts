import type { Metadata } from "next";

export function siteUrl() {
  return new URL(process.env.APP_URL ?? "https://csr-amp-ten.vercel.app");
}

export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

export const siteDescription = "Private customer service workspace for AMP Memberships. Agents look up memberships, vehicles, and payments.";
