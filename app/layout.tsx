import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "NeuraGuard / NeuraProbe",
    template: "%s · NeuraGuard",
  },
  description:
    "NeuraGuard is a personal neurorights and BCI consent OS. NeuraProbe is a transparent sensor-fusion acquisition lab showing what can be sensed without your charter. Everything runs on-device.",
  manifest: "/manifest.json",
  applicationName: "NeuraGuard",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1210",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-guard-bg font-sans text-guard-ink antialiased">
        <ServiceWorkerRegister />
        <SiteHeader />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
        <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-guard-muted/70 sm:px-6">
          NeuraGuard &amp; NeuraProbe run entirely on your device. No accounts, no server database, no data
          leaves your browser unless you export a file yourself.
        </footer>
      </body>
    </html>
  );
}
