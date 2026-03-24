const PRIVACY_ARTIFACTS = [
  "Privacy policy",
  "Child-friendly privacy notice",
  "Parent/carer privacy notice",
  "Data inventory",
  "Retention and deletion schedule",
  "Third-party services register",
];

export default function LegalPrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          MetaPet Schools
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Privacy materials
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          The school deployment uses alias-based local records, short retention,
          and teacher-controlled exports only. Download the privacy pack for the
          full artifact set.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PRIVACY_ARTIFACTS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>

      <a
        href="/docs/schools-au/governance/privacy-policy.md"
        className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200"
      >
        Download the privacy policy
      </a>
    </main>
  );
}
