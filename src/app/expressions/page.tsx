"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPetRepository, usePetRegistryStore, type PetRecordV2 } from "@/lib/registry";
import { normalizePetForm, PET_FORM_STORAGE_KEY, type PetForm } from "@/lib/petForms";
import { makeCreatureSnapshot, type CreatureSnapshot } from "@/lib/expressions/snapshot";
import { readTake, type PerformanceTake } from "@/lib/expressions/take";
import { ExpressionStudio } from "@/components/expressions/ExpressionStudio";

type LoadState = { status: "loading" | "empty" | "error" } |
  { status: "ready"; id: string; pet: CreatureSnapshot; form: PetForm; take: PerformanceTake | null };

export default function ExpressionsPage() {
  const record = usePetRegistryStore(state => state.activeRecord);
  const [result, setResult] = useState<LoadState>({ status: "loading" });
  useEffect(() => {
    let current = true;
    const prepare = (active: PetRecordV2 | null) => {
      if (!current) return;
      if (!active) {
        setResult({ status: "empty" });
        return;
      }
      let form: PetForm = "auralia";
      try { form = normalizePetForm(localStorage.getItem(PET_FORM_STORAGE_KEY)); } catch { /* Use the default. */ }
      const take = new URLSearchParams(window.location.search).get("take") === "latest" ? readTake(active.petId) : null;
      setResult({ status: "ready", id: active.petId, pet: makeCreatureSnapshot(active), form: take?.form ?? form, take });
    };
    void Promise.resolve().then(() => record ?? getPetRepository().loadActiveRecord()).then(prepare)
      .catch(() => { if (current) setResult({ status: "error" }); });
    return () => { current = false; };
  }, [record]);
  return (
    <main className="min-h-screen bg-[#080d19] px-3 pb-16 pt-7 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 border-b border-[#624d30] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Blue $nake Studio × MetaPet</p>
            <Link href="/pet" className="inline-flex min-h-11 items-center underline decoration-slate-500 underline-offset-4">My Pet</Link>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#fff3d1] sm:text-6xl">MetaPet Expressions</h1>
        </header>
        {result.status === "ready" && (!record || record.petId === result.id) ?
          <ExpressionStudio key={result.id} id={result.id} pet={result.pet} initialForm={result.form} initialTake={result.take} /> : (
          <section className="rounded-xl border border-slate-700 p-5">
            <p role="status">{result.status === "error" ? "Your registered MetaPet could not be loaded." :
              result.status === "empty" ? "Open My Pet to set up your companion first." : "Opening your registered companion…"}</p>
            {result.status !== "loading" && <Link href="/pet" className="mt-2 inline-flex min-h-11 items-center text-amber-300 underline">Open My Pet</Link>}
          </section>
        )}
      </div>
    </main>
  );
}
