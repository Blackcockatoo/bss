import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { findSiteUrl, findSiteUrlObject } from "@/lib/env/siteUrl";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import ClientBody from "./ClientBody";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040810",
  viewportFit: "cover",
};

const siteUrl = findSiteUrl();
const siteUrlObject = findSiteUrlObject();

export const metadata: Metadata = {
  ...(siteUrlObject ? { metadataBase: siteUrlObject } : {}),
  title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
  description:
    IS_SCHOOLS_PROFILE
      ? "MetaPet Schools is a teacher-led, low-data classroom tool for Years 3-6 digital responsibility, systems thinking, and online safety habits."
      : "Blue Snake Studios builds privacy-first digital learning experiences with a strict child-safe baseline for default student deployments.",
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
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    description:
      IS_SCHOOLS_PROFILE
        ? "MetaPet Schools is a teacher-led, low-data classroom tool for Years 3-6 digital responsibility, systems thinking, and online safety habits."
        : "Blue Snake Studios builds privacy-first digital learning experiences with a strict child-safe baseline for default student deployments.",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    description:
      IS_SCHOOLS_PROFILE
        ? "MetaPet Schools is a teacher-led, low-data classroom tool for Years 3-6 digital responsibility, systems thinking, and online safety habits."
        : "Blue Snake Studios builds privacy-first digital learning experiences with a strict child-safe baseline for default student deployments.",
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
    <html
      lang="en"
      className="font-sans dark"
      style={
        {
          "--font-outfit":
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          "--font-mono":
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        } as CSSProperties
      }
    >
      <head>
        <meta name="copyright" content={legalMetaContent} />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
