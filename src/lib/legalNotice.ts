import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export const LEGAL_NOTICE_TEXT =
  IS_SCHOOLS_PROFILE
    ? "The school-facing deployment is limited to educational pilot use, runs offline-first with alias-based classroom records, and stays intentionally separate from adult-only or experimental product surfaces."
    : "All MetaPet branding and creative IP remains the property of Blue $nake Studio. MetaPet School Field Mode is free for school use under its published educational-use boundary. Default student deployments are local-first and account-free, while adult-only tooling remains outside the child-safe baseline.";

export const getLegalNoticeYear = () => new Date().getFullYear();
