import Link from "next/link";

export const metadata = {
  title: "Rewards & Share — Meta-Pet",
  description:
    "Earn rewards through play, care, and exploration. Share verifiable achievements with the world.",
};

const HOW_TO_EARN = [
  {
    emoji: "❤️",
    title: "Care for your companion",
    description:
      "Feed, clean, and play with your pet daily. Consistent care unlocks Caretaker achievements and earns Essence.",
    route: "/",
    cta: "Care now",
  },
  {
    emoji: "🎮",
    title: "Play mini-games",
    description:
      "Pattern Recognition and Vimana exploration reward Essence, cosmetics, and earnable add-ons.",
    route: "/school-game",
    cta: "Open Classroom Quest",
  },
  {
    emoji: "🧬",
    title: "Evolve & explore",
    description:
      "Reach new evolution stages (NEURO → QUANTUM → SPECIATION) and map the Vimana grid to unlock rare cosmetics.",
    route: "/genome-explorer",
    cta: "Explore genome",
  },
  {
    emoji: "🏆",
    title: "Complete achievements",
    description:
      "Each unlocked achievement awards +25 Essence instantly. Track progress in the Rewards tab on the main screen.",
    route: "/",
    cta: "View companion",
  },
];

const REWARD_TIERS = [
  {
    tier: "Bronze",
    color: "border-orange-700/50 bg-orange-950/30 text-orange-300",
    essence: 10,
    desc: "First milestones — care, first battle, first scan.",
  },
  {
    tier: "Silver",
    color: "border-zinc-500/50 bg-zinc-900/50 text-zinc-300",
    essence: 25,
    desc: "Sustained effort — 25 battles, 50 samples collected, streak runs.",
  },
  {
    tier: "Gold",
    color: "border-yellow-500/50 bg-yellow-950/30 text-yellow-300",
    essence: 50,
    desc: "Mastery — 100 battles, QUANTUM stage, resolve 10 anomalies.",
  },
  {
    tier: "Platinum",
    color: "border-cyan-500/50 bg-cyan-950/30 text-cyan-300",
    essence: 100,
    desc: "Legendary — perfect care, unstoppable streak, full map, speciation.",
  },
];

export default function ShareLandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <section className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Rewards &amp; Share
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Everything you earn in Meta-Pet is yours — verified on-device with a
            cryptographic signature. Share a reward bundle link to prove your
            achievements to anyone, anywhere.
          </p>
        </section>

        {/* How to earn */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">
            How to earn rewards
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {HOW_TO_EARN.map(({ emoji, title, description, route, cta }) => (
              <div
                key={title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 flex flex-col"
              >
                <div className="text-2xl">{emoji}</div>
                <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                  {description}
                </p>
                <Link
                  href={route}
                  className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Achievement tiers */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">
            Achievement tiers &amp; Essence
          </h2>
          <p className="text-xs text-zinc-500">
            Each unlocked achievement awards Essence instantly based on its
            tier.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REWARD_TIERS.map(({ tier, color, essence, desc }) => (
              <div
                key={tier}
                className={`rounded-xl border p-4 space-y-1 ${color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{tier}</span>
                  <span className="font-mono text-xs font-bold">
                    +{essence} Essence
                  </span>
                </div>
                <p className="text-xs opacity-70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verifiable share */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <h2 className="text-base font-semibold text-zinc-200">
            Verifiable reward bundles
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            MOSS60 reward payloads are cryptographically signed. When you share
            a bundle link, the recipient can verify its authenticity without
            trusting a central server — your achievement is tamper-evident by
            design.
          </p>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            This is the foundation for something bigger: a future where students
            can carry verifiable proof of learning between schools, districts,
            and platforms — without anyone owning their data.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/share/demo"
              className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-medium text-emerald-400 hover:border-emerald-400/60 hover:text-emerald-300 transition-colors"
            >
              View demo bundle →
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
            >
              Browse earnable items →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
