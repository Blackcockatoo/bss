import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import "./globals.css";
import { findSiteUrl, findSiteUrlObject } from "@/lib/env/siteUrl";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import ClientBody from "./ClientBody";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: IS_SCHOOLS_PROFILE ? "#f5f7fa" : "#040810",
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
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
  const legalMetaContent = IS_SCHOOLS_PROFILE
    ? `MetaPet Schools educational pilot by Blue Snake Studios. © ${currentYear}. ${LEGAL_NOTICE_TEXT}`
    : `© ${currentYear} Blue Snake Studios. ${LEGAL_NOTICE_TEXT}`;

  return (
    <html
      lang="en"
      className={IS_SCHOOLS_PROFILE ? "font-sans schools-theme" : "font-sans dark"}
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
        {!IS_SCHOOLS_PROFILE && (
          <Link
            href="/app/activities"
            className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-[70] inline-flex min-h-11 items-center rounded-full border border-cyan-200/50 bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-950/40 transition-colors hover:bg-cyan-200 sm:bottom-6 sm:right-6"
          >
            Open Navigator
          </Link>
        )}
        <ClientBody>{children}</ClientBody>
        <Analytics />
      </body>
    </html>
  );
}
