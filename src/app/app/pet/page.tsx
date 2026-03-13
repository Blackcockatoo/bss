import { getPetOrDemo } from "@/lib/demo/pet";

export default function AppPetPage() {
  const pet = getPetOrDemo(undefined);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Pet Overview</h1>
      <p className="mt-2 text-zinc-300">Meet {pet.name}, your {pet.species} companion.</p>
      <div className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-zinc-200 md:grid-cols-2">
        <p>Current mood: {pet.mood}</p>
        <p>Level: {pet.level}</p>
        <p>Energy: {pet.energy}%</p>
        <p>Focus: {pet.focus}%</p>
      </div>
    </main>
  );
}
