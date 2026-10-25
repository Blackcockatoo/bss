"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDnaImprint } from "@/lib/dnaImprint";
import { usePetRegistryStore } from "@/lib/registry";
import { getForgeTool, type ForgeToolId } from "@/lib/tools/registry";
import { companionMotif, type ForgeDiscovery } from "@/lib/tools/learningMemory";
import { useForgeLearningStore } from "@/lib/tools/learningStore";

async function playSequence(sequence: readonly number[], tempo: number): Promise<void> {
  const context = new AudioContext();
  try {
    if (context.state === "suspended") await context.resume();
    const noteLength = 60 / tempo;
    const start = context.currentTime + 0.05;
    sequence.forEach((value, index) => {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = "sine";
      tone.frequency.value = 220 * Math.pow(2, (value - 1) / 12);
      const time = start + noteLength * index;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLength * 0.8);
      tone.connect(gain).connect(context.destination);
      tone.start(time);
      tone.stop(time + noteLength * 0.82);
    });
    // Closing is only for audio resources, never a tracking/engagement timer.
    await new Promise<void>((resolve) => setTimeout(resolve, sequence.length * noteLength * 1000 + 200));
  } finally {
    await context.close();
  }
}

export function ProjectForgeClient() {
  const activePet = usePetRegistryStore((state) => state.activeRecord);
  const dnaImprint = useDnaImprint();
  const petId = activePet?.petId ?? null;
  const { memory, status, error, hydrate, saveDiscovery, clearDiscoveries } = useForgeLearningStore();
  const [toolId, setToolId] = useState<ForgeToolId>("pattern-forge");
  const [sequence, setSequence] = useState<[number, number, number, number]>([1, 3, 5, 2]);
  const [tempo, setTempo] = useState(90);
  const [prediction, setPrediction] = useState("");
  const [reflection, setReflection] = useState("");
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const tool = getForgeTool(toolId)!;

  useEffect(() => {
    if (petId) void hydrate(petId);
  }, [petId, hydrate]);

  const motif = companionMotif(dnaImprint?.liveMutationSeed ?? petId ?? "anonymous",
    sequence, tempo);
  const last = memory?.discoveries.at(-1) ?? null;
  const canSave = Boolean(petId && memory?.petId === petId && status === "ready" && reflection.trim());

  const updateStep = (index: number, value: number) => {
    const next = [...sequence] as [number, number, number, number];
    next[index] = value;
    setSequence(next);
    setMessage("");
  };

  const save = async () => {
    if (!canSave) return;
    const discovery: ForgeDiscovery = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID() : `discovery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      toolId,
      createdAt: Date.now(),
      sequence,
      tempo,
      prediction: prediction.trim().slice(0, 160),
      reflection: reflection.trim().slice(0, 160),
      motif,
    };
    try {
      await saveDiscovery(discovery);
      setMessage(`Saved on this device. Your companion learned an ${motif} motif.`);
      setReflection("");
    } catch {
      setMessage("The experiment could not be saved. Nothing was sent online.");
    }
  };

  const clear = async () => {
    if (!window.confirm("Delete this pet's saved Project Forge discoveries on this device?")) return;
    try {
      await clearDiscoveries();
      setMessage("Project Forge discoveries deleted from this device.");
    } catch {
      setMessage("Deletion failed. Please try again or use browser storage controls.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/pet" className="inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm underline-offset-4 hover:underline">
          ← Back to your companion
        </Link>
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">Blue $nake Studio · MetaPet</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Project Forge</h1>
          <p className="max-w-2xl text-slate-300">
            Experiment with patterns and sound. Make a prediction, change something, and explain
            what happened. Your discovery can become a gentle memory for your digital companion.
          </p>
          <p className="text-sm text-teal-200">The instrument runs without Grok, accounts or advertising. Offline route availability still needs testing.</p>
        </header>
        <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose a learning tool">
          {(["pattern-forge", "sound-studio"] as const).map((id) => (
            <button key={id} type="button" onClick={() => setToolId(id)}
              aria-pressed={toolId === id}
              className={`rounded-xl border p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${toolId === id ? "border-teal-300 bg-teal-900/40" : "border-slate-700 bg-slate-900"}`}>
              <strong>{getForgeTool(id)!.title}</strong>
              <span className="mt-1 block text-sm text-slate-300">{getForgeTool(id)!.learningOutcome}</span>
            </button>
          ))}
        </div>
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5" aria-labelledby="forge-experiment">
          <h2 id="forge-experiment" className="text-xl font-bold">{tool.title} experiment</h2>
          <p className="mt-1 text-sm text-slate-300">SPARK: Spot · Predict · Act · Reflect · Keep</p>
          <div className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="font-semibold">Spot &amp; Predict — what do you think your changes will do?</span>
              <input value={prediction} onChange={(event) => setPrediction(event.target.value)} maxLength={160}
                placeholder="I think the pattern will..." className="w-full rounded-lg border border-slate-500 bg-slate-950 p-3 text-white" />
            </label>
            <div>
              <h3 className="font-semibold">Act — experiment with four numbers</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {sequence.map((value, index) => (
                  <label key={index} className="rounded-lg border border-slate-600 bg-slate-950 p-3 text-center">
                    <span className="mb-2 block text-sm">Step {index + 1}: {value}</span>
                    <input type="range" min={1} max={7} step={1} value={value}
                      aria-label={`Pattern step ${index + 1}`}
                      onChange={(event) => updateStep(index, Number(event.target.value))}
                      className="w-full accent-teal-300" />
                  </label>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-2 block font-semibold">Tempo: {tempo} beats per minute</span>
              <input type="range" min={50} max={160} step={10} value={tempo}
                aria-label="Sound tempo" onChange={(event) => setTempo(Number(event.target.value))}
                className="w-full accent-teal-300" />
            </label>
            <figure className="rounded-xl border border-teal-400/30 bg-slate-950 p-4 text-center">
              <svg className="mx-auto h-36 w-full max-w-lg" viewBox="0 0 400 125" role="img"
                aria-label={`Four-step pattern: ${sequence.join(", ")}. Companion response: ${motif}.`}>
                {sequence.map((value, index) => (
                  <g key={index}>
                    <circle cx={50 + index * 100} cy={62} r={value * 5 + 6}
                      stroke="#67e8f9" strokeWidth={2} fill="none" />
                    <circle cx={50 + index * 100} cy={62} r={5} fill="#5eead4" />
                    <text x={50 + index * 100} y={120} fill="white" textAnchor="middle" fontSize="15">{value}</text>
                  </g>
                ))}
              </svg>
              <figcaption className="mt-2 text-sm text-slate-300">Change a number to change the shape; the notes use the same sequence.</figcaption>
            </figure>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={playing} onClick={async () => {
                setPlaying(true);
                try {
                  await playSequence(sequence, tempo);
                } catch {
                  setMessage("Audio isn't available here. The visual pattern still works.");
                } finally { setPlaying(false); }
              }} className="rounded-lg bg-teal-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">
                {playing ? "Playing…" : "Hear your pattern"}
              </button>
              <p className="self-center text-sm text-slate-300" aria-live="polite">
                Companion response: <strong>{motif}</strong> (deterministic, from saved local inputs)
              </p>
            </div>
            <label className="block space-y-2">
              <span className="font-semibold">Reflect — what did you discover?</span>
              <input value={reflection} onChange={(event) => setReflection(event.target.value)}
                maxLength={160} placeholder="When I changed step 2..." className="w-full rounded-lg border border-slate-500 bg-slate-950 p-3 text-white" />
            </label>
            <button type="button" disabled={!canSave} onClick={() => void save()}
              className="rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
              Keep this discovery locally
            </button>
            {!petId && <p className="text-sm text-amber-200">
              Open your <Link className="underline" href="/pet">companion</Link> first to register a local pet before saving.
            </p>}
            {error && <p role="alert" className="text-sm text-amber-200">Local save issue: {error}</p>}
            <p aria-live="polite" className="text-sm text-teal-200">{message}</p>
          </div>
        </section>
        <section className="rounded-xl border border-slate-700 p-5" aria-label="Saved local discoveries">
          <h2 className="text-xl font-bold">Keep — your companion's memory</h2>
          <p className="mt-2 text-sm text-slate-300">
            Discoveries are stored separately from pet identity and vitals, on this device only.
            No attendance or streak penalties. Clearing browser data can erase them.
          </p>
          {last ? (
            <div className="mt-3 rounded-lg bg-teal-950/40 p-4">
              <p><strong>{last.motif}</strong> motif · {getForgeTool(last.toolId)?.title}</p>
              <p className="mt-1 text-sm text-slate-200">You discovered: {last.reflection}</p>
              <p className="mt-1 text-xs text-slate-400">Saved discoveries: {memory?.discoveries.length ?? 0}</p>
            </div>
          ) : <p className="mt-3 text-sm text-slate-400">Nothing saved yet. Make something you want to remember.</p>}
          {petId && memory && memory.discoveries.length > 0 && (
            <button type="button" onClick={() => void clear()}
              className="mt-4 rounded-lg border border-rose-400 px-3 py-2 text-sm text-rose-200">
              Delete Project Forge discoveries
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
