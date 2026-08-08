"use client";

import { cn } from "@/lib/utils";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";

type LegalNoticeProps = {
  className?: string;
  schoolsMode?: boolean;
};

export default function LegalNotice({ className, schoolsMode = false }: LegalNoticeProps) {
  const year = getLegalNoticeYear();

  return (
    <p
      className={cn(
        "text-xs text-slate-500 leading-relaxed dark:text-slate-400",
        className,
      )}
    >
      {IS_SCHOOLS_PROFILE || schoolsMode
        ? `MetaPet School educational pilot. Operated by Blue $nake Studio. © ${year}. ${LEGAL_NOTICE_TEXT}`
        : `© ${year} Blue $nake Studio — ${LEGAL_NOTICE_TEXT}`}
    </p>
  );
}
