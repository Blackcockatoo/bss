import {
  BookOpen,
  BookOpenCheck,
  DoorOpen,
  GraduationCap,
  HardDriveDownload,
  Home,
  ShieldCheck,
} from "lucide-react";

import type { FieldModeNavItem } from "@/lib/childSafeBaseline";

/**
 * Single icon lookup for every Field Mode navigation "kind", shared by every
 * surface that renders FIELD_MODE_NAV_ITEMS or SCHOOL_PRIMARY_NAV_ITEMS
 * (the Field Mode top bar and the school-profile bottom navigation) so the
 * same destination never gets two different icons in two different places.
 */
export const FIELD_MODE_NAV_ICONS: Record<FieldModeNavItem["kind"], typeof Home> = {
  home: Home,
  lessons: BookOpenCheck,
  classroom: GraduationCap,
  offline: HardDriveDownload,
  guide: BookOpen,
  safety: ShieldCheck,
  exit: DoorOpen,
};
