const SAFETY_ARTIFACTS = [
  "Child-safety risk assessment",
  "Misuse and over-engagement risk assessment",
  "Teacher supervision model",
  "Wellbeing escalation pathway",
  "Accessibility and inclusion review",
];

export default function LegalSafetyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          MetaPet Schools
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Safety materials
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          The school deployment is built for supervised, time-bounded classroom
          use. It does not include chat, public sharing, or always-on
          companion behavior.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SAFETY_ARTIFACTS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>

      <a
        href="/docs/schools-au/governance/child-safety-risk-assessment.md"
        className="inline-flex rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200"
      >
        Download the child-safety risk assessment
      </a>
    </main>
  );
}
