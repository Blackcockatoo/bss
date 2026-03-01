import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#040810",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bss-l8cw.vercel.app"),
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
    url: "https://bss-l8cw.vercel.app",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Outfit:wght@200;300;400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
