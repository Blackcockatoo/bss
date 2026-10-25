"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadForgeMemory } from "@/lib/tools/forgePersistence";
import type { ForgeDiscovery } from "@/lib/tools/learningMemory";

/** Read-only companion recall: the original genome/vitals store is untouched. */
export function ForgeMemoryBadge({ petId }: { petId: string }) {
  const [latest, setLatest] = useState<ForgeDiscovery | null>(null);
  useEffect(() => {
    let active = true;
    setLatest(null);
    if (!petId || petId === "registration-pending") return;
    loadForgeMemory(petId).then((memory) => {
      if (active) setLatest(memory.discoveries.at(-1) ?? null);
    }).catch(() => { if (active) setLatest(null); });
    return () => { active = false; };
  }, [petId]);

  if (!latest) return null;
  return (
    <div className="rounded-xl border border-teal-400/30 bg-teal-950/25 px-4 py-3 text-sm text-teal-100" aria-label="Companion learning memory">
      <strong>Your companion remembers:</strong> {latest.motif} pattern.
      <span className="ml-1">That motif reflects your saved experiment, not a score or a streak.</span>
      <Link className="ml-2 underline underline-offset-2" href="/project-forge">Visit Project Forge</Link>
    </div>
  );
}
