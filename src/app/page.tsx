import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blue Snake Studios — The full MetaPet living system",
  description:
    "Enter the complete MetaPet world: digital companions, DNA, Body Forge, activities, wellness and the separate MetaPet Schools classroom edition.",
  openGraph: {
    title: "Blue Snake Studios — The full MetaPet living system",
    description:
      "The complete MetaPet creative system, with MetaPet Schools kept as a focused classroom product on its own domain.",
  },
  twitter: {
    card: "summary",
    title: "Blue Snake Studios — The full MetaPet living system",
    description:
      "Digital companions, DNA, Body Forge, activities, wellness and a clearly separated school edition.",
  },
};

const PRODUCT_AREAS = [
  {
    eyebrow: "Living companion",
    title: "MetaPet",
    description:
      "Raise, care for and explore a persistent digital companion shaped by its own genome, state and history.",
    href: "/pet",
    action: "Enter MetaPet",
  },
  {
    eyebrow: "Living progression",
    title: "Evolution",
    description:
      "Grow one inherited creature through four visible stages, genome-driven branches, permanent abilities and a full transformation ceremony.",
    href: "/pet?panel=evolution",
    action: "See evolution",
  },
  {
    eyebrow: "Creature design",
    title: "Body Forge",
    description:
      "Build distinctive bodies, silhouettes, wings, surfaces and expressive systems without flattening every pet into the same template.",
    href: "/body-forge",
    action: "Open Body Forge",
  },
  {
    eyebrow: "Generative identity",
    title: "DNA Lab",
    description:
      "Inspect the deeper genetic identity behind a pet through visual, musical and symbolic interpretations of the same seed.",
    href: "/digital-dna",
    action: "Explore DNA",
  },
  {
    eyebrow: "Play and regulation",
    title: "Activities & Wellness",
    description:
      "Move between games, experiments, care loops and calm experiences that make the companion feel alive rather than decorative.",
    href: "/app/activities",
    action: "Explore activities",
  },
] as const;

const FULL_PRODUCT_LINKS = [
  { label: "Pet", href: "/pet" },
  { label: "Evolution", href: "/pet?panel=evolution" },
  { label: "Identity", href: "/identity" },
  { label: "DNA", href: "/digital-dna" },
  { label: "Body Forge", href: "/body-forge" },
  { label: "Activities", href: "/app/activities" },
  { label: "Wellness", href: "/app/wellness" },
  { label: "Pricing", href: "/pricing" },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_34%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              Blue $nake Studios
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                The whole MetaPet world lives here.
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-slate-300 md:text-2xl md:leading-9">
                A living companion system built from DNA, care, play, body design,
                identity and strange creative experiments.
              </p>
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                BlueSnakeStudios.com is the unrestricted home of MetaPet. The
                classroom edition now has its own focused door at MetaPet.school,
                so the full creative product and the school-safe product no longer
                pretend to be the same website.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pet"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
              >
                Enter MetaPet
              </Link>
              <Link
                href="/digital-dna"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                Explore the DNA Lab
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-300/50 hover:bg-cyan-400/15"
              >
                Plans from A$0
              </Link>
              <a
                href="https://www.metapet.school"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/50 hover:bg-amber-400/15"
              >
                Go to MetaPet School
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Full product map
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {FULL_PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                One codebase. Two clear products.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Shared engineering underneath, separate entry points and safety
                boundaries above it.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
            Explore the system
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Different parts of one living product
          </h2>
          <p className="text-base leading-7 text-slate-400">
            Each area changes how the same MetaPet identity looks, behaves, learns
            or expresses itself.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PRODUCT_AREAS.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group rounded-3xl border border-slate-800 bg-slate-900/45 p-6 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-900/75 md:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {area.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {area.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {area.description}
              </p>
              <p className="mt-6 text-sm font-semibold text-cyan-300 transition-transform group-hover:translate-x-1">
                {area.action} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-cyan-400/20 bg-cyan-400/5">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/70">
              Simple consumer pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Start free. Unlock the complete companion for A$4.99/month.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              The free companion includes starter addons and all four evolution
              stages. Companion Pass adds the full addon library, dream journal,
              advanced genome tools and wellness sync. Annual: A$44.
            </p>
            <p className="mt-2 text-sm text-amber-200">
              Checkout is not connected yet. Nothing can be charged today.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
          >
            Compare the plans
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/35">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-6 py-16 md:grid-cols-2">
          <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300/70">
              bluesnakestudios.com
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Full MetaPet and the wider studio
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Consumer features, DNA, identity, creative labs, Body Forge,
              activities, wellness and future experiments stay here.
            </p>
          </article>

          <article className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-200/70">
              metapet.school
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Focused Australian classroom product
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Years 3–6 Field Mode, teacher-led lessons, alias-only records,
              local-first storage and a hard boundary around consumer areas.
            </p>
            <a
              href="https://www.metapet.school"
              className="mt-6 inline-flex text-sm font-semibold text-amber-200 hover:text-amber-100"
            >
              Open MetaPet School →
            </a>
          </article>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Blue $nake Studios</p>
        <p>MetaPet is the living system. MetaPet School is its focused classroom branch.</p>
      </footer>
    </main>
  );
}
