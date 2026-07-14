"use client";

/**
 * PetRuntimeDiagnostics — a development-only status readout on the canonical
 * pet stage. Shows which visual form is active, where the current body came
 * from (Body Forge vs pure DNA), the stored BodySpec packet version and
 * migration provenance, and the live Moss60 movement clip. Renders nothing
 * in production builds.
 */

import { useEffect, useState } from "react";

import { useStore } from "@/lib/store";
import {
  loadForgedBodyPacket,
  type StoredBodyPacket,
} from "@/visual-dna/bodyForgeAdapter";

/** Event VisualDNAPet dispatches (dev only) when the active clip changes. */
export const MOVEMENT_CLIP_EVENT = "bss:moss60:active-clip";

export function PetRuntimeDiagnostics() {
  const petType = useStore((state) => state.petType);
  const [packet, setPacket] = useState<StoredBodyPacket | null>(null);
  const [activeClip, setActiveClip] = useState<string>("—");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const sync = () => setPacket(loadForgedBodyPacket());
    const initialLoad = window.setTimeout(sync, 0);
    window.addEventListener("bss:body-forge:updated", sync);
    window.addEventListener("storage", sync);
    const onClip = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") setActiveClip(detail);
    };
    window.addEventListener(MOVEMENT_CLIP_EVENT, onClip);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("bss:body-forge:updated", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(MOVEMENT_CLIP_EVENT, onClip);
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  const fromForge = packet !== null;
  return (
    <div
      data-testid="pet-runtime-diagnostics"
      className="pointer-events-none absolute left-2 top-2 z-20 rounded-lg border border-slate-700/70 bg-slate-950/85 px-2.5 py-1.5 font-mono text-[9px] leading-4 text-slate-300"
    >
      <p>
        form <span className="text-cyan-300">{petType}</span>
      </p>
      <p>
        body{" "}
        <span className={fromForge ? "text-amber-300" : "text-cyan-300"}>
          {fromForge ? "body-forge" : "pure-dna"}
        </span>
        {fromForge && (
          <>
            {" "}
            v<span className="text-amber-300">{packet.version}</span>
            {" · migrated "}
            <span className="text-amber-300">
              {packet.migratedFrom ?? "none (authored v3)"}
            </span>
          </>
        )}
      </p>
      {petType === "evolved" && (
        <p>
          moss60 clip <span className="text-violet-300">{activeClip}</span>
        </p>
      )}
    </div>
  );
}
