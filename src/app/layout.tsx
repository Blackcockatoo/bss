import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
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
  title: "Blue Snake Studios",
  description:
    "Blue Snake Studios builds privacy-first digital learning experiences for schools and families.",
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
    title: "Blue Snake Studios",
    description:
      "Blue Snake Studios builds privacy-first digital learning experiences for schools and families.",
    url: siteUrl,
    siteName: "Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blue Snake Studios",
    description:
      "Blue Snake Studios builds privacy-first digital learning experiences for schools and families.",
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
      className="font-sans"
      style={
        {
          '--font-outfit': 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
