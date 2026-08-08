import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { findSiteUrl, findSiteUrlObject } from "@/lib/env/siteUrl";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
} from "@/lib/fieldMode/pwa";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import { METAPET_PRODUCT } from "@/lib/fieldMode/product";
import ClientBody from "./ClientBody";

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
  title: IS_SCHOOLS_PROFILE ? METAPET_PRODUCT.school : METAPET_PRODUCT.studio,
  description:
    IS_SCHOOLS_PROFILE
      ? "MetaPet School is a teacher-led, local-first classroom tool for Australian Years 3–6 digital responsibility, systems thinking and responsible creation."
      : "Blue $nake Studio builds privacy-first digital learning experiences and the Complete MetaPet universe.",
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
    title: IS_SCHOOLS_PROFILE ? METAPET_PRODUCT.school : METAPET_PRODUCT.studio,
  },
  openGraph: {
    title: IS_SCHOOLS_PROFILE ? METAPET_PRODUCT.school : METAPET_PRODUCT.studio,
    description:
      IS_SCHOOLS_PROFILE
        ? "MetaPet School is a teacher-led, local-first classroom tool for Australian Years 3–6."
        : "Blue $nake Studio builds privacy-first digital learning experiences.",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: IS_SCHOOLS_PROFILE ? METAPET_PRODUCT.school : METAPET_PRODUCT.studio,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: IS_SCHOOLS_PROFILE ? METAPET_PRODUCT.school : METAPET_PRODUCT.studio,
    description:
      IS_SCHOOLS_PROFILE
        ? "MetaPet School is a teacher-led, local-first classroom tool for Australian Years 3–6."
        : "Blue $nake Studio builds privacy-first digital learning experiences.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = getLegalNoticeYear();
  const legalMetaContent = IS_SCHOOLS_PROFILE
    ? `${METAPET_PRODUCT.school} educational pilot by ${METAPET_PRODUCT.studio}. © ${currentYear}. ${LEGAL_NOTICE_TEXT}`
    : `© ${currentYear} ${METAPET_PRODUCT.studio}. ${LEGAL_NOTICE_TEXT}`;

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
      </body>
    </html>
  );
}
