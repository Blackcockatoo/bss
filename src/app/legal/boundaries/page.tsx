import Link from "next/link";

const BOUNDARIES = [
  "Not therapy or counselling",
  "Not social media",
  "Not a generative AI chatbot",
  "Not an always-on companion",
  "Not a behaviour surveillance tool",
  "Not a student profiling system",
  "Not a replacement for teacher judgement",
];

export default function LegalBoundariesPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
          MetaPet Schools
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Product boundaries
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          MetaPet Schools is a teacher-led classroom tool for digital
          responsibility, systems thinking, and online safety habits in Years
          3-6. It is intentionally narrower than broader Meta-Pet product work.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {BOUNDARIES.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/schools/docs/what-metapet-schools-is-is-not"
          className="inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Read the boundaries statement in app
        </Link>
        <a
          href="/docs/schools-au/governance/what-metapet-schools-is-is-not.md"
          className="inline-flex rounded-full border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-200"
        >
          Download the boundaries statement
        </a>
      </div>
    </main>
  );
}
