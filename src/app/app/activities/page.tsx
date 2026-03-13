import { getPetOrDemo } from "@/lib/demo/pet";

export default function AppActivitiesPage() {
  const pet = getPetOrDemo(undefined);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Activities</h1>
      <p className="mt-2 text-zinc-300">Choose a starter activity for {pet.name}.</p>
      <ul className="mt-6 space-y-3">
        {pet.activities.map((activity) => (
          <li
            key={activity}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-zinc-200"
          >
            {activity}
          </li>
        ))}
      </ul>
    </main>
  );
}
