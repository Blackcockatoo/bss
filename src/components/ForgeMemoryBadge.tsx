"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePetRegistryStore } from "@/lib/registry";
import { loadForgeMemory } from "@/lib/tools/forgePersistence";
import { adaptation } from "@/lib/tools/activities";
import { playForgeSequence } from "@/lib/tools/audio";
import type { ForgeMemory } from "@/lib/tools/learningMemory";
/** Acquired experience supplies a replayable visual/musical companion response. */
export function ForgeMemoryBadge({ petId }: { petId: string }) {
  const [loaded, setLoaded] = useState<ForgeMemory | null>(null);
  const [message, setMessage] = useState("");
  const record = usePetRegistryStore((s) => s.activeRecord);
  useEffect(() => {
    let active = true;
    const sync = () => {
      if (petId && petId !== "registration-pending")
        void loadForgeMemory(petId)
          .then((m) => {
            if (active) setLoaded(m);
          })
          .catch(() => {
            if (active) setLoaded(null);
          });
    };
    sync();
    window.addEventListener("metapet:forge-changed", sync);
    window.addEventListener("focus", sync);
    return () => {
      active = false;
      window.removeEventListener("metapet:forge-changed", sync);
      window.removeEventListener("focus", sync);
    };
  }, [petId]);
  if (
    loaded?.petId !== petId ||
    (!loaded.projects?.length && !loaded.discoveries.length)
  )
    return null;
  const seed =
    record?.petId === petId ? JSON.stringify(record.genomeHash) : petId;
  const response = adaptation(seed, loaded.projects ?? []);
  const sequence = response.source
    ? response.sequence
    : loaded.discoveries.at(-1)!.sequence;
  return (
    <section
      className="rounded-xl border border-teal-400/30 bg-teal-950/25 p-4 text-teal-100"
      aria-label="Companion learning memory"
    >
      <strong>
        Your companion can echo {response.source ?? "your saved pattern"}.
      </strong>
      <p className="text-sm">
        Your creation supplies the shape and notes; inherited identity supplies
        a fixed transposition. Delete the creation to remove its influence. No
        score or streak.
      </p>
      <svg
        viewBox="0 0 400 90"
        role="img"
        aria-label={`Companion response values: ${sequence.join(", ")}`}
        className="h-24 w-full"
      >
        <polyline
          points={sequence
            .map(
              (n, i) =>
                `${20 + (i * 360) / Math.max(1, sequence.length - 1)},${70 - n * 4}`,
            )
            .join(" ")}
          fill="none"
          stroke="#5eead4"
          strokeWidth="3"
        />
        {sequence.map((n, i) => (
          <circle
            key={i}
            cx={20 + (i * 360) / Math.max(1, sequence.length - 1)}
            cy={70 - n * 4}
            r="5"
            fill="#67e8f9"
          />
        ))}
      </svg>
      <button
        className="min-h-11 rounded border px-3"
        onClick={() =>
          void playForgeSequence(sequence, response.tempo).catch(() =>
            setMessage(
              "Sound unavailable. The visual echo shows the same response.",
            ),
          )
        }
      >
        Hear companion echo (optional)
      </button>
      <p role="status">{message}</p>
      <Link className="underline" href="/project-forge">
        Revisit your projects
      </Link>
    </section>
  );
}
