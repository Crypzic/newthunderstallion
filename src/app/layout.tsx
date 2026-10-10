import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Backdrop } from "@/components/backdrop";
import { DemoNotice, Footer, Navbar, SearchDialog, SearchHotkey, WalletDialog } from "@/components/chrome";
import { UiProvider } from "@/components/ui-state";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thunderstallioncn.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { type: "website", siteName: "Thunder Stallion", images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: "Thunder Stallion" }] },
  twitter: { card: "summary_large_image", images: ["/brand/og.jpg"] },
  title: { default: "Thunder Stallion — Discover. Track. Ride.", template: "%s · Thunder Stallion" },
  description: "Live crypto trending board, fresh launches, community listings and token boosts across Solana, BSC, Ethereum and more.",
  icons: { icon: [{ url: "/brand/favicon-32.png", sizes: "32x32" }, { url: "/brand/favicon-16.png", sizes: "16x16" }], apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#07080c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <I18nProvider>
          <AuthProvider>
            <UiProvider>
              <Backdrop />
              <DemoNotice />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <WalletDialog />
              <SearchDialog />
              <SearchHotkey />
            </UiProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
