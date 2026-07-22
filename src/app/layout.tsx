import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { findSiteUrlObject } from "@/lib/env/siteUrl";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";
import { getSurfaceConfig } from "@/lib/domain/surface";
import { resolveServerSurface } from "@/lib/domain/serverSurface";
import { SurfaceProvider } from "@/lib/domain/SurfaceProvider";
import ClientBody from "./ClientBody";
import { Analytics } from "@vercel/analytics/next";

export async function generateViewport(): Promise<Viewport> {
  const config = getSurfaceConfig(await resolveServerSurface());

  return {
    width: "device-width",
    initialScale: 1,
    themeColor: config.metadata.themeColor,
    viewportFit: "cover",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const surface = await resolveServerSurface();
  const config = getSurfaceConfig(surface);
  const { title, description, siteName, origin, locale } = config.metadata;

  // Prefer the surface's canonical origin so each domain owns its own
  // canonical + Open Graph URLs and neither indexes the other's pages.
  const canonicalObject = (() => {
    try {
      return new URL(origin);
    } catch {
      return findSiteUrlObject();
    }
  })();

  return {
    ...(canonicalObject ? { metadataBase: canonicalObject } : {}),
    title,
    description,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title,
    },
    openGraph: {
      title,
      description,
      ...(canonicalObject ? { url: canonicalObject.toString() } : {}),
      siteName,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const surface = await resolveServerSurface();
  const isSchool = surface === "school";
  const config = getSurfaceConfig(surface);
  const currentYear = getLegalNoticeYear();
  const legalMetaContent = isSchool
    ? `MetaPet School is created by Blue Snake Studios. © ${currentYear}. ${LEGAL_NOTICE_TEXT}`
    : `© ${currentYear} Blue Snake Studios. ${LEGAL_NOTICE_TEXT}`;

  return (
    <html
      lang={isSchool ? "en-AU" : "en"}
      data-surface={surface}
      className={isSchool ? "font-sans schools-theme" : "font-sans dark"}
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
        <meta name="application-name" content={config.name} />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <SurfaceProvider surface={surface}>
          <ClientBody>{children}</ClientBody>
        </SurfaceProvider>
        <Analytics />
      </body>
    </html>
  );
}
