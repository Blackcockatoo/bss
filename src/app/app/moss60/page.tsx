import { Moss60Hub } from "@/components/Moss60Hub";

export default function AppMoss60Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">
            Student App
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            MOSS60 Studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Read the active companion through pet-coded glyphs, shaped reality projections,
            readable security lessons, and deterministic MOSS60 exports.
          </p>
        </div>

        <Moss60Hub />
      </div>
    </main>
  );
}
