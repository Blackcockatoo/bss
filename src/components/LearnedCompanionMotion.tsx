"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { loadForgeMemory } from "@/lib/tools/forgePersistence";
import { adaptation } from "@/lib/tools/activities";
/** A child-triggered learned response moves the EXISTING renderer, never identity. */
export function LearnedCompanionMotion({ children }: { children: ReactNode }) {
  const record = usePetRegistryStore((s) => s.activeRecord);
  const [response, setResponse] = useState<{
    petId: string;
    sequence: number[];
    tempo: number;
    source: string | null;
  } | null>(null);
  const [message, setMessage] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const node = stage.current;
    const sync = () => {
      if (record)
        void loadForgeMemory(record.petId)
          .then((memory) => {
            if (active)
              setResponse(
                memory.projects?.length
                  ? {
                      petId: record.petId,
                      ...adaptation(
                        JSON.stringify(record.genomeHash),
                        memory.projects,
                      ),
                    }
                  : null,
              );
          })
          .catch(() => {
            if (active) setResponse(null);
          });
    };
    sync();
    window.addEventListener("metapet:forge-changed", sync);
    window.addEventListener("focus", sync);
    return () => {
      active = false;
      window.removeEventListener("metapet:forge-changed", sync);
      window.removeEventListener("focus", sync);
      node?.getAnimations?.().forEach((a) => a.cancel());
    };
  }, [record]);
  const learned = response?.petId === record?.petId ? response : null;
  return (
    <div>
      <div ref={stage}>{children}</div>
      {learned && (
        <div className="mt-3 rounded border border-teal-400/40 p-3 text-sm text-teal-100">
          <button
            className="min-h-11 rounded border px-3"
            onClick={() => {
              const values = learned.sequence;
              if (
                !stage.current?.animate ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ) {
                setMessage(
                  `Still response from ${learned.source}: ${values.join(", ")}. Motion is reduced.`,
                );
                return;
              }
              stage.current?.getAnimations?.().forEach((a) => a.cancel());
              stage.current?.animate(
                values.map((v) => ({
                  transform: `translateY(${-v}px) rotate(${(v - 5) / 4}deg)`,
                })),
                {
                  duration: Math.min(
                    6000,
                    (values.length * 60000) / learned.tempo,
                  ),
                  iterations: 1,
                  easing: "ease-in-out",
                },
              );
              setMessage(
                `Movement echoes ${learned.source}: ${values.join(", ")}. Saved creation plus inherited transposition; no change to DNA.`,
              );
            }}
          >
            Show learned movement
          </button>
          <p role="status">{message}</p>
        </div>
      )}
    </div>
  );
}
