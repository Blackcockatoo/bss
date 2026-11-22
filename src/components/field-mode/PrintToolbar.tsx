import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";

export function PrintToolbar({
  backHref = FIELD_MODE_HOME_PATH,
  backLabel = "Back to home",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
      <a
        href={backHref}
        className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
      >
        {backLabel}
      </a>
      <PrintLessonButton />
    </div>
  );
}

export const printArticleClassName =
  "mx-auto max-w-4xl rounded-2xl bg-white p-7 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none md:p-10";

export const printMainClassName =
  "field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0";
