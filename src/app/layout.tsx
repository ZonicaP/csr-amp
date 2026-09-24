import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import SplashGate from "@/components/SplashGate";
import ThemeRegistry from "@/components/ThemeRegistry";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "CSR Portal",
  description: "AMP customer service portal",
  applicationName: "AMP CSR",
  appleWebApp: {
    capable: true,
    title: "AMP CSR",
    statusBarStyle: "default",
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
        <ThemeRegistry>
          <SplashGate>{children}</SplashGate>
        </ThemeRegistry>
      </body>
    </html>
  );
}
