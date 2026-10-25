"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { loadForgeMemory } from "@/lib/tools/forgePersistence";
import { adaptation } from "@/lib/tools/activities";
function cancelMotion(node: HTMLDivElement | null) {
  node?.getAnimations?.().forEach((animation) => {
    void animation.finished.catch(() => {}); // A learner/identity change may cancel deliberately.
    animation.cancel();
  });
}
/** A child-triggered learned response moves the EXISTING renderer, never identity. */
export function LearnedCompanionMotion({ children }: { children: ReactNode }) {
  const record = usePetRegistryStore((s) => s.activeRecord);
  const petId = record?.petId ?? null;
  const seed = record ? JSON.stringify(record.genomeHash) : "";
  const [response, setResponse] = useState<{
    petId: string;
    sequence: number[];
    tempo: number;
    source: string | null;
  } | null>(null);
  const [message, setMessage] = useState<{
    petId: string | null;
    text: string;
  }>({ petId: null, text: "" });
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const node = stage.current;
    const sync = () => {
      const token = ++generation;
      if (petId)
        void loadForgeMemory(petId)
          .then((memory) => {
            if (active && token === generation)
              setResponse(
                memory.projects?.length
                  ? {
                      petId,
                      ...adaptation(seed, memory.projects),
                    }
                  : null,
              );
          })
          .catch(() => {
            if (active && token === generation) setResponse(null);
          });
    };
    sync();
    window.addEventListener("metapet:forge-changed", sync);
    window.addEventListener("focus", sync);
    return () => {
      active = false;
      window.removeEventListener("metapet:forge-changed", sync);
      window.removeEventListener("focus", sync);
      cancelMotion(node);
    };
  }, [petId, seed]);
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
                setMessage({
                  petId: record?.petId ?? null,
                  text: `Still response from ${learned.source || "your saved project"}: ${values.join(", ")}. Motion is reduced.`,
                });
                return;
              }
              cancelMotion(stage.current);
              const animation = stage.current?.animate(
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
              void animation?.finished.catch(() => {});
              setMessage({
                petId: record?.petId ?? null,
                text: `Movement echoes ${learned.source || "your saved project"}: ${values.join(", ")}. Saved creation plus inherited transposition; no change to DNA.`,
              });
            }}
          >
            Show learned movement
          </button>
          <p role="status">
            {message.petId === record?.petId ? message.text : ""}
          </p>
        </div>
      )}
    </div>
  );
}
