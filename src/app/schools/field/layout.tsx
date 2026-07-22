import type { Metadata } from "next";

import { FieldModeNav } from "@/components/field-mode/FieldModeNav";
import { FieldOfflineBadge } from "@/components/field-mode/FieldOfflineBadge";
import { FieldStorageGuard } from "@/components/field-mode/FieldStorageGuard";
import { FIELD_MODE_MANIFEST_PATH } from "@/lib/childSafeBaseline";
import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

export const metadata: Metadata = {
  title: {
    default: "MetaPet Field Mode — Australian Schools",
    template: "%s — MetaPet Field Mode",
  },
  description:
    "A focused, teacher-led Years 3–6 Australian classroom experience with seven short lessons, aliases and local device records.",
  manifest: FIELD_MODE_MANIFEST_PATH,
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
    title: "MetaPet School",
  },
};

export default function FieldModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FieldStorageGuard />
      <FieldModeNav />
      <FieldOfflineBadge />
      {children}
    </>
  );
}
