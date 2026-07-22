import type { Metadata } from "next";

import { FieldModeNav } from "@/components/field-mode/FieldModeNav";
import { FieldStorageGuard } from "@/components/field-mode/FieldStorageGuard";
import { FIELD_MODE_MANIFEST_PATH } from "@/lib/childSafeBaseline";

export const metadata: Metadata = {
  title: {
    default: "MetaPet Field Mode — Australian Schools",
    template: "%s — MetaPet Field Mode",
  },
  description:
    "A focused, teacher-led Years 3–6 Australian classroom experience with seven short lessons, aliases and local device records.",
  manifest: FIELD_MODE_MANIFEST_PATH,
};

export default function FieldModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FieldStorageGuard />
      <FieldModeNav />
      {children}
    </>
  );
}
