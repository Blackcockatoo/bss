"use client";

import { Printer } from "lucide-react";

export function PrintLessonButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="field-print-hide inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      <Printer className="h-5 w-5" aria-hidden="true" />
      Print / Save as PDF
    </button>
  );
}
