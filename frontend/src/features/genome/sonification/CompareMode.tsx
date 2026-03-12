"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SonificationPlaybackController,
  type TrackPlaybackState,
  buildSonifiedTracks,
  synchronizeTracks,
} from "./engine";
import type { TraitVector } from "./mappings";

type SonifySummaryResponse = {
  petId: string;
  normalizedTraitVector: Array<{
    traitId: string;
    family: "behavior" | "health" | "athletic" | "cognition";
    value: number;
    confidence: number;
  }>;
  interactionMatrix: Record<string, Record<string, number>>;
};

type Props = {
  petAId: string;
  petBId: string;
};

function toTraitVectors(summary: SonifySummaryResponse): TraitVector[] {
  return summary.normalizedTraitVector.map((trait) => {
    const outgoing = Object.values(
      summary.interactionMatrix[trait.traitId] ?? {},
    );
    const interactionStrength =
      outgoing.length === 0
        ? 0
        : outgoing.reduce((acc, value) => acc + Math.abs(value), 0) /
          outgoing.length;

    return {
      traitId: trait.traitId,
      family: trait.family,
      effectSize: trait.value,
      confidence: trait.confidence,
      interactionStrength,
    };
  });
}

export function SonificationCompareMode({ petAId, petBId }: Props) {
  const [petA, setPetA] = useState<TraitVector[] | null>(null);
  const [petB, setPetB] = useState<TraitVector[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [trackStates, setTrackStates] = useState<
    Record<string, TrackPlaybackState>
  >({});
  const engineRef = useRef<SonificationPlaybackController | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [aResponse, bResponse] = await Promise.all([
          fetch(`/api/genome/sonify/${petAId}`),
          fetch(`/api/genome/sonify/${petBId}`),
        ]);

        if (!aResponse.ok || !bResponse.ok) {
          throw new Error("Unable to load sonification data.");
        }

        const aData = (await aResponse.json()) as SonifySummaryResponse;
        const bData = (await bResponse.json()) as SonifySummaryResponse;

        if (!isMounted) {
          return;
        }

        setPetA(toTraitVectors(aData));
        setPetB(toTraitVectors(bData));
        setLoadError(null);
      } catch (_error) {
        if (isMounted) {
          setLoadError("Unable to load sonification vectors right now.");
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [petAId, petBId]);

  const synced = useMemo(() => {
    if (!petA || !petB) {
      return [];
    }

    const a = buildSonifiedTracks(petA);
    const b = buildSonifiedTracks(petB);
    return synchronizeTracks(a, b);
  }, [petA, petB]);

  useEffect(() => {
    if (synced.length === 0) {
      setTrackStates({});
      setIsAudioReady(false);
      return;
    }

    const controller = new SonificationPlaybackController();
    engineRef.current = controller;
    setAudioError(null);
    setIsAudioReady(false);

    const initialStates: Record<string, TrackPlaybackState> = {};
    for (const pair of synced) {
      initialStates[pair.primary.traitId] = { muted: false, solo: false };
      initialStates[pair.secondary.traitId] = { muted: false, solo: false };
    }
    setTrackStates(initialStates);

    const timer = window.setInterval(() => {
      const state = controller.getPlaybackState();
      setActiveRegionIndex(state.activeRegionIndex);
      setProgress(state.progress);
      setIsPlaying(state.isPlaying);
    }, 120);

    return () => {
      window.clearInterval(timer);
      controller.dispose();
      engineRef.current = null;
    };
  }, [synced]);

  async function handlePlay() {
    if (!engineRef.current || synced.length === 0) {
      return;
    }

    try {
      if (!isAudioReady) {
        await engineRef.current.initialize(synced);
        Object.entries(trackStates).forEach(([traitId, state]) => {
          engineRef.current?.setTrackState(traitId, state);
        });
        setIsAudioReady(true);
      }

      setAudioError(null);
      engineRef.current.play();
    } catch {
      setAudioError(
        "Audio playback is blocked until the browser allows sound for this page.",
      );
    }
  }

  function toggleMute(traitId: string) {
    setTrackStates((prev) => {
      const current = prev[traitId] ?? { muted: false, solo: false };
      const next = {
        ...prev,
        [traitId]: { ...current, muted: !current.muted },
      };
      engineRef.current?.setTrackState(traitId, next[traitId]);
      return next;
    });
  }

  function toggleSolo(traitId: string) {
    setTrackStates((prev) => {
      const current = prev[traitId] ?? { muted: false, solo: false };
      const next = { ...prev, [traitId]: { ...current, solo: !current.solo } };
      engineRef.current?.setTrackState(traitId, next[traitId]);
      return next;
    });
  }

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">Sonification Compare Mode</h3>
      <p className="text-xs text-slate-500">
        Backend-driven trait vectors, synchronized playback controls, and
        mirrored visual cues for accessibility.
      </p>

      {loadError ? (
        <p className="mt-3 text-xs text-rose-400">{loadError}</p>
      ) : null}
      {audioError ? (
        <p className="mt-2 text-xs text-amber-300">{audioError}</p>
      ) : null}

      <div className="mt-4 space-y-2 rounded border border-slate-700 p-3">
        <div className="flex items-center gap-2">
          <button
            className="rounded bg-slate-700 px-2 py-1 text-xs"
            onClick={() => void handlePlay()}
            type="button"
          >
            Play
          </button>
          <button
            className="rounded bg-slate-700 px-2 py-1 text-xs"
            onClick={() => engineRef.current?.pause()}
            type="button"
          >
            Pause
          </button>
          <span className="text-xs text-slate-400">
            {isPlaying ? "Playing" : "Paused"}
          </span>
          <span className="ml-auto text-xs text-cyan-300">
            Active region:{" "}
            {synced[activeRegionIndex]?.activeGenomeRegion ?? "n/a"}
          </span>
        </div>

        <label
          className="block text-xs text-slate-300"
          htmlFor="sonification-seek"
        >
          Timeline seek (visual + audio synced)
        </label>
        <input
          className="w-full"
          id="sonification-seek"
          max={100}
          min={0}
          onChange={(event) => {
            const nextProgress = Number(event.currentTarget.value) / 100;
            setProgress(nextProgress);
            engineRef.current?.seek(nextProgress);
          }}
          type="range"
          value={Math.round(progress * 100)}
        />

        <div
          aria-live="polite"
          className="rounded bg-slate-900 p-2 text-xs text-slate-300"
        >
          Visual parity cue: highlighted card and timeline position indicate the
          same active genomic region as audio playback.
        </div>
      </div>

      <ul className="mt-3 space-y-2 text-xs">
        {synced.map((pair, index) => {
          const isActive = index === activeRegionIndex;
          return (
            <li
              className={`rounded border p-2 ${isActive ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700"}`}
              key={`${pair.primary.traitId}-${pair.activeGenomeRegion}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{pair.activeGenomeRegion}</div>
                <span
                  className={`rounded px-2 py-0.5 ${isActive ? "bg-cyan-400/20 text-cyan-200" : "bg-slate-800 text-slate-400"}`}
                >
                  {isActive ? "Active" : "Queued"}
                </span>
              </div>
              <div className="mt-1">
                A: {pair.primary.instrument} {pair.primary.chord.join("-")}
              </div>
              <div>
                B: {pair.secondary.instrument} {pair.secondary.chord.join("-")}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[pair.primary, pair.secondary].map((track, trackIndex) => (
                  <div
                    className="flex items-center gap-1"
                    key={`${pair.activeGenomeRegion}-${track.traitId}-${trackIndex}`}
                  >
                    <span className="text-[11px] text-slate-300">
                      {track.traitId}
                    </span>
                    <button
                      className="rounded bg-slate-800 px-2 py-0.5"
                      onClick={() => toggleMute(track.traitId)}
                      type="button"
                    >
                      {trackStates[track.traitId]?.muted ? "Unmute" : "Mute"}
                    </button>
                    <button
                      className="rounded bg-slate-800 px-2 py-0.5"
                      onClick={() => toggleSolo(track.traitId)}
                      type="button"
                    >
                      {trackStates[track.traitId]?.solo ? "Unsolo" : "Solo"}
                    </button>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
