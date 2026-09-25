import type { Metadata, Viewport } from "next";
import SkipLink from "@/components/SkipLink";
import SplashGate from "@/components/SplashGate";
import ThemeRegistry from "@/components/ThemeRegistry";
import { manrope } from "@/lib/manrope";
import { privateRobots, siteDescription, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "AMP CSR", template: "%s · AMP CSR" },
  description: siteDescription,
  applicationName: "AMP CSR",
  robots: privateRobots,
  referrer: "strict-origin-when-cross-origin",
  appleWebApp: {
    capable: true,
    title: "AMP CSR",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "AMP CSR",
    title: "AMP CSR",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5FAFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className={manrope.className}>
        <SkipLink />
        <ThemeRegistry>
          <SplashGate>{children}</SplashGate>
        </ThemeRegistry>
      </body>
    </html>
  );
}
