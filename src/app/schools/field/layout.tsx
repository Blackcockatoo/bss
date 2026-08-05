import type { Metadata, Viewport } from "next";

import { FieldModeNav } from "@/components/field-mode/FieldModeNav";
import { FieldOfflineBadge } from "@/components/field-mode/FieldOfflineBadge";
import { FieldStorageGuard } from "@/components/field-mode/FieldStorageGuard";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_MANIFEST_PATH,
} from "@/lib/childSafeBaseline";
import {
  METAPET_SCHOOL_DESCRIPTION,
  METAPET_SCHOOL_NAME,
  METAPET_SCHOOL_ORIGIN,
  METAPET_SCHOOL_THEME_COLOR,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

const FIELD_MODE_TITLE = `${METAPET_SCHOOL_NAME} — Australian Years 3–6 Classroom Lessons`;

/**
 * The shared root layout paints Blue Snake Studios' near-black chrome on the
 * combined production build. The classroom surface is light on every page, so
 * it declares its own theme colour instead of inheriting a mismatched one.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: METAPET_SCHOOL_THEME_COLOR,
  colorScheme: "light",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Overrides the shared Blue Snake Studios metadataBase so canonical and
  // social URLs on classroom pages resolve against the classroom domain.
  metadataBase: new URL(METAPET_SCHOOL_ORIGIN),
  title: {
    default: FIELD_MODE_TITLE,
    template: `%s — ${METAPET_SCHOOL_NAME}`,
  },
  description: METAPET_SCHOOL_DESCRIPTION,
  applicationName: METAPET_SCHOOL_NAME,
  manifest: FIELD_MODE_MANIFEST_PATH,
  alternates: {
    canonical: metaPetSchoolUrl(FIELD_MODE_HOME_PATH),
  },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: FIELD_MODE_TITLE,
    description: METAPET_SCHOOL_DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_HOME_PATH),
    locale: "en_AU",
  },
  twitter: {
    card: "summary",
    title: FIELD_MODE_TITLE,
    description: METAPET_SCHOOL_DESCRIPTION,
  },
  icons: {
    icon: [
      {
        url: FIELD_MODE_ICON_192_PATH,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: FIELD_MODE_ICON_512_PATH,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: {
      url: FIELD_MODE_APPLE_TOUCH_ICON_PATH,
      sizes: "180x180",
      type: "image/png",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: METAPET_SCHOOL_NAME,
  },
};

export default function FieldModeLayout({ children }: { children: React.ReactNode }) {
  return (
    // `field-surface` pins the light design tokens on. The shared shell adds
    // `dark` to <html> on the Blue Snake Studios build, and the classroom
    // pages are light in every deployment.
    <div className="field-surface">
      <FieldStorageGuard />
      <FieldModeNav />
      <FieldOfflineBadge />
      {children}
    </div>
  );
}
