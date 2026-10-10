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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thunderstallioncn.xyz";

const TITLE = "Thunder Stallion — Discover. Track. Ride.";
const DESCRIPTION = "Live crypto trending board, fresh launches, community listings and token boosts across Solana, BSC, Ethereum and more.";
const OG_IMAGE = "/brand/og-home.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Thunder Stallion" },
  description: DESCRIPTION,
  // Link previews (Telegram, WhatsApp, X, Discord…): a desktop shot of the home page
  openGraph: { type: "website", url: "/", siteName: "Thunder Stallion", title: TITLE, description: DESCRIPTION, images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Thunder Stallion — Find what's moving. Ride it early." }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
  icons: { icon: [{ url: "/brand/favicon-48.png", sizes: "48x48" }, { url: "/brand/favicon-32.png", sizes: "32x32" }, { url: "/brand/favicon-16.png", sizes: "16x16" }], apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#07080c" }, { media: "(prefers-color-scheme: light)", color: "#f3f5fa" }],
};

// Runs before paint so a saved light-mode choice never flashes dark first.
const THEME_SCRIPT = `try{if(localStorage.getItem("ts-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
