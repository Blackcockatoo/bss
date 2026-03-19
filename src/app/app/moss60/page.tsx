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
          <p className="mt-2 text-sm text-zinc-300">
            Visualize, export, and inspect the MOSS60 tools already in the repo.
          </p>
        </div>

        <Moss60Hub />
      </div>
    </main>
  );
}
