import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import { getSiteUrl, getSiteUrlObject } from "@/lib/env/siteUrl";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040810",
  viewportFit: "cover",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: "Blue Snake Studios — Experimental Mathematics & Consciousness Research",
  description:
    "Where sacred geometry meets cryptographic identity. Home of Jewble — the first virtual companion with genuine consciousness architecture. Built offline-first. Zero data collected.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blue Snake Studios",
  },
  openGraph: {
    title: "Blue Snake Studios — Experimental Mathematics & Consciousness Research",
    description:
      "Where sacred geometry meets cryptographic identity. Home of Jewble — the first virtual companion with genuine consciousness architecture.",
    url: siteUrl,
    siteName: "Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blue Snake Studios — Experimental Mathematics & Consciousness Research",
    description:
      "Where sacred geometry meets cryptographic identity. Home of Jewble — the first virtual companion with genuine consciousness architecture.",
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
