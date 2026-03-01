import type { Metadata, Viewport } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import { getSiteUrl, getSiteUrlObject } from "@/lib/env/siteUrl";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040810",
  viewportFit: "cover",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: "Blue Snake Studios — Privacy-First Virtual Companion for Australian Classrooms",
  description:
    "Jewble Meta-Pet: a classroom-safe digital companion that teaches systems thinking. Offline-first, zero accounts, zero data collected. Built by an Australian parent for schools.",
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
    title: "Blue Snake Studios — Privacy-First Virtual Companion for Australian Classrooms",
    description:
      "Jewble Meta-Pet: a classroom-safe digital companion that teaches systems thinking. Offline-first, zero accounts, zero data collected.",
    url: siteUrl,
    siteName: "Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blue Snake Studios — Privacy-First Virtual Companion for Australian Classrooms",
    description:
      "Jewble Meta-Pet: a classroom-safe digital companion that teaches systems thinking. Offline-first, zero accounts, zero data collected.",
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
    <html lang="en" className={`font-sans ${outfit.variable} ${spaceMono.variable}`}>
      <head>
        <meta name="copyright" content={legalMetaContent} />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
