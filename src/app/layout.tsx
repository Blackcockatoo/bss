import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bss-l8cw.vercel.app"),
  title: "Meta-Pet — Raise, Evolve, Discover",
  description:
    "A privacy-first digital companion powered by real genomics. Raise your pet, watch it evolve through care, and discover the science woven into every trait. Built offline-first by Blue Snake Studios.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meta-Pet",
  },
  openGraph: {
    title: "Meta-Pet — Raise, Evolve, Discover",
    description:
      "A privacy-first digital companion powered by real genomics. Raise your pet, watch it evolve through care, and discover the science woven into every trait.",
    url: "https://bss-l8cw.vercel.app",
    siteName: "Jewble // Meta-Pet by Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Meta-Pet — Raise, Evolve, Discover",
    description:
      "A privacy-first digital companion powered by real genomics. Raise your pet, watch it evolve through care, and discover the science woven into every trait.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = getLegalNoticeYear();
  const legalMetaContent = `© ${currentYear} Blue Snake Studios. ${LEGAL_NOTICE_TEXT}`;

  return (
    <html lang="en" className="font-sans">
      <head>
        <meta name="copyright" content={legalMetaContent} />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
