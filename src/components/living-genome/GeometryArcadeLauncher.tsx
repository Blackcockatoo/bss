"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePetRegistryStore } from "@/lib/registry";
import { saveGeometryPilot } from "@/lib/games/geometryPilot";
import { Button } from "../ui/button";

export function GeometryArcadeLauncher({
  scene,
}: { scene: RefObject<HTMLDivElement | null> }) {
  const petId = usePetRegistryStore((state) => state.activeRecord?.petId);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const play = async () => {
    if (lock.current || !scene.current || !petId) return;
    lock.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await saveGeometryPilot(scene.current, petId);
      // The game receives only local pixels. Its mechanics and saves stay its own.
      if (mounted.current) window.location.assign("/monkey-invaders");
    } catch (error) {
      if (!mounted.current) return;
      setNotice(
        error instanceof Error
          ? error.message
          : "The sprite could not be prepared. Try again.",
      );
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button
        onClick={play}
        disabled={busy || !petId}
        variant="outline"
        className="w-full border-cyan-800 text-cyan-100"
      >
        {busy
          ? "Preparing geometry pilot…"
          : "Play geometry in Monkey Invaders"}
      </Button>
      {!petId && (
        <p className="text-xs text-slate-300">
          Load a registered companion to use its geometry in the arcade.
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-amber-200">
          {notice}
        </p>
      )}
    </div>
  );
}
