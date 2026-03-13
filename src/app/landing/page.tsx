import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-start justify-center gap-6 px-4 py-8">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Meta-Pet</p>
      <h1 className="text-4xl font-semibold text-white">Welcome to the student experience</h1>
      <p className="max-w-xl text-zinc-300">
        Start with a guided pet flow, browse the genome, and launch activities.
      </p>
      <Link
        href="/app"
        className="rounded-md bg-cyan-400 px-5 py-3 font-medium text-slate-950 hover:bg-cyan-300"
      >
        Open the app
      </Link>
    </main>
  );
}
