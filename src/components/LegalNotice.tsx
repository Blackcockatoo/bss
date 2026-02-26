"use client";

import { cn } from "@/lib/utils";
import { LEGAL_NOTICE_TEXT, getLegalNoticeYear } from "@/lib/legalNotice";

type LegalNoticeProps = {
  className?: string;
};

export default function LegalNotice({ className }: LegalNoticeProps) {
  const year = getLegalNoticeYear();

  return (
    <p
      className={cn(
        "text-xs text-slate-500 leading-relaxed dark:text-slate-400",
        className,
      )}
    >
      © {year} Blue Snake Studios — {LEGAL_NOTICE_TEXT}
    </p>
  );
}
