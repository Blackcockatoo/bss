import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { findSiteUrl, findSiteUrlObject } from "@/lib/env/siteUrl";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { METAPET_SCHOOL_ORIGIN } from "@/lib/fieldMode/identity";
import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
} from "@/lib/fieldMode/pwa";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import { SCHOOL_PROFILE_DESCRIPTION } from "@/lib/schools/privacyTruth";
import ClientBody from "./ClientBody";
import { ConsumerAnalytics } from "@/components/ConsumerAnalytics";

const CORE_SITE_ORIGIN = "https://www.bluesnakestudios.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: IS_SCHOOLS_PROFILE ? "#f5f7fa" : "#040810",
  viewportFit: "cover",
};

const siteUrl = findSiteUrl();
const siteUrlObject =
  findSiteUrlObject() ??
  new URL(IS_SCHOOLS_PROFILE ? METAPET_SCHOOL_ORIGIN : CORE_SITE_ORIGIN);
const siteDescription = IS_SCHOOLS_PROFILE
  ? SCHOOL_PROFILE_DESCRIPTION
  : "Blue Snake Studios builds privacy-first digital learning experiences with a strict child-safe baseline for default student deployments.";

export const metadata: Metadata = {
  metadataBase: siteUrlObject,
  title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: IS_SCHOOLS_PROFILE ? FIELD_MODE_ICON_192_PATH : "/icon.svg",
    apple: IS_SCHOOLS_PROFILE
      ? FIELD_MODE_APPLE_TOUCH_ICON_PATH
      : "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
  },
  openGraph: {
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    description: siteDescription,
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Blue Snake Studios",
    description: siteDescription,
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
        <ClientBody>{children}</ClientBody>
        <ConsumerAnalytics />
      </body>
    </html>
  );
}
