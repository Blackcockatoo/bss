import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export const LEGAL_NOTICE_TEXT =
  IS_SCHOOLS_PROFILE
    ? "MetaPet Schools is provided for limited educational pilot use. The school-facing deployment is offline-first, alias-based, and intentionally separate from adult-only or experimental product surfaces."
    : "All Meta-Pet branding and creative IP remains the property of Blue Snake Studios; the school receives a limited educational-use license. Default student deployments operate in offline-first, zero-account mode with no default cloud data transmission, while any adult-only tooling sits outside the child-safe baseline.";

export const getLegalNoticeYear = () => new Date().getFullYear();
