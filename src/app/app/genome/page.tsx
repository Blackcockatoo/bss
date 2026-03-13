import { getPetOrDemo } from "@/lib/demo/pet";

export default function AppGenomePage() {
  const pet = getPetOrDemo(undefined);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Genome View</h1>
      <p className="mt-2 text-zinc-300">
        {pet.name}'s current genome signature is shown below.
      </p>
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="font-mono text-lg tracking-widest text-cyan-200">{pet.genomeSummary}</p>
        <p className="mt-3 text-sm text-zinc-400">
          This seeded profile keeps the experience interactive even before syncing live pet data.
        </p>
      </div>
    </main>
  );
}
