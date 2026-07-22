import Link from "next/link";
import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Field Mode — MetaPet School",
  description:
    "Field Mode is the focused, restricted classroom runtime for MetaPet School: lessons, classroom and teacher guidance only, with a clear exit back to the school home.",
  alternates: { canonical: "/field" },
};

const FIELD_NAV = [
  { href: "/field", label: "Field Home" },
  { href: "/lessons", label: "Lessons" },
  { href: "/classroom", label: "Classroom" },
  { href: "/teacher-guide", label: "Teacher Guide" },
  { href: "/safety", label: "Safety and Privacy" },
  { href: "/", label: "Exit Field Mode" },
];

export default function FieldModePage() {
  enforceChildSafeServerRoute("/schools/field");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            MetaPet School · Field Mode
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            A focused classroom runtime
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Field Mode narrows the product to exactly what a class needs during
            a session: the lessons, the classroom runtime, and teacher guidance.
            Everything else stays out of the way. When the session ends, exit
            Field Mode to return to the school home.
          </p>
        </header>

        <nav
          aria-label="Field Mode navigation"
          className="rounded-3xl border border-emerald-400/20 bg-slate-950/50 p-5"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
            Field Mode navigation
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FIELD_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-100 hover:border-emerald-400/40"
                >
                  <span>{item.label}</span>
                  <span aria-hidden className="text-emerald-300">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/start"
            className="rounded-2xl bg-emerald-400 px-5 py-4 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Start the session
          </Link>
          <Link
            href="/lessons"
            className="rounded-2xl border border-slate-700 px-5 py-4 text-center text-sm font-semibold text-slate-100 hover:border-slate-500"
          >
            Browse lessons
          </Link>
          <Link
            href="/teacher-guide"
            className="rounded-2xl border border-slate-700 px-5 py-4 text-center text-sm font-semibold text-slate-100 hover:border-slate-500"
          >
            Teacher guide
          </Link>
        </section>
      </div>
    </main>
  );
}
