"use client";
import Link from "next/link";
import { ForgeResultDetails } from "@/components/ForgeResultDetails";
import { useEffect, useRef, useState } from "react";
import { usePetRegistryStore, getPetRepository } from "@/lib/registry";
import {
  exportForgePetBundle,
  importForgePetBundle,
  MAX_PET_BUNDLE_BYTES,
} from "@/lib/tools/petBundle";
import { FORGE_TOOLS, type ForgeToolId } from "@/lib/tools/registry";
import {
  DEFAULT_INPUT,
  runActivity,
  type ActivityInput,
  type Project,
  type Spark,
} from "@/lib/tools/activities";
import { useForgeLearningStore } from "@/lib/tools/learningStore";
import {
  exportForge,
  parseForge,
  MAX_FORGE_BACKUP_BYTES,
} from "@/lib/tools/forgePersistence";
import { parseNumberList } from "@/lib/tools/numberList";
import { useForgeAudio } from "@/lib/tools/useForgeAudio";
const control =
  "min-h-11 w-full rounded-lg border border-slate-500 bg-slate-950 p-3 text-white";
const button =
  "min-h-11 rounded-lg border border-teal-300 px-4 py-2 disabled:opacity-40";
function download(name: string, body: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ProjectForgeClient() {
  const petId = usePetRegistryStore((s) => s.activeRecord?.petId ?? null);
  // Remount editor per identity: no text or draft leaks when switching pets.
  return <ForgeEditor key={petId ?? "unregistered"} petId={petId} />;
}
function ForgeEditor({ petId }: { petId: string | null }) {
  const store = useForgeLearningStore();
  const editorGeneration = useRef(0);
  useEffect(
    () => () => {
      editorGeneration.current++;
    },
    [],
  );
  const record = usePetRegistryStore((s) => s.activeRecord);
  const hydrate = store.hydrate;
  const [toolId, setTool] = useState<ForgeToolId>("pattern-forge");
  const [input, setInput] = useState<ActivityInput>(() =>
    structuredClone(DEFAULT_INPUT),
  );
  const [sequenceText, setSequenceText] = useState(
    DEFAULT_INPUT.sequence.join(", "),
  );
  const [rhythmText, setRhythmText] = useState(
    (DEFAULT_INPUT.rhythm ?? [1]).join(", "),
  );
  const [spark, setSpark] = useState<Spark>({
    spot: "",
    prediction: "",
    reflection: "",
  });
  const [editing, setEditing] = useState<Project | null>(null);
  const [result, setResult] = useState<ReturnType<typeof runActivity> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const { playing, play, stop } = useForgeAudio();
  const [comparison, setComparison] = useState<string | null>(null);
  const tool = FORGE_TOOLS[toolId];
  const memory = store.memory?.petId === petId ? store.memory : null;
  const sequenceValid = parseNumberList(sequenceText, "sequence") !== null;
  const rhythmValid = parseNumberList(rhythmText, "rhythm") !== null;
  const draftValid =
    (toolId !== "pattern-forge" && toolId !== "sound-studio") ||
    (sequenceValid && (toolId !== "sound-studio" || rhythmValid));
  useEffect(() => {
    if (petId) void hydrate(petId);
  }, [petId, hydrate]);
  const change = (patch: Partial<ActivityInput>) => {
    if (patch.sequence) setSequenceText(patch.sequence.join(", "));
    if (patch.rhythm) setRhythmText(patch.rhythm.join(", "));
    setInput({ ...input, ...patch });
    setResult(null);
  };
  const select = (id: ForgeToolId) => {
    stop();
    editorGeneration.current++;
    setInput(structuredClone(DEFAULT_INPUT));
    setSequenceText(DEFAULT_INPUT.sequence.join(", "));
    setRhythmText((DEFAULT_INPUT.rhythm ?? [1]).join(", "));
    setSpark({ spot: "", prediction: "", reflection: "" });
    setTool(id);
    setEditing(null);
    setResult(null);
    setComparison(null);
    setMessage("");
  };
  const reopen = (p: Project) => {
    stop();
    editorGeneration.current++;
    setTool(p.toolId);
    setInput(structuredClone(p.input));
    setSequenceText(p.input.sequence.join(", "));
    setRhythmText((p.input.rhythm ?? [1]).join(", "));
    setSpark({ ...p.spark });
    setEditing(p);
    setResult(null);
    setComparison(null);
    setMessage(
      `Opened revision ${p.revision}. Change, test and save to revise.`,
    );
  };
  const save = async () => {
    if (!result || !draftValid) return;
    const token = editorGeneration.current;
    const now = Date.now();
    const project: Project = {
      version: 1,
      id: editing?.id ?? crypto.randomUUID(),
      toolId,
      title: input.title || tool.title,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      revision: (editing?.revision ?? 0) + 1,
      input: structuredClone(input),
      spark: { ...spark },
    };
    try {
      await store.saveProject(project);
      if (token !== editorGeneration.current) return;
      setEditing(project);
      setMessage(`Saved revision ${project.revision} on this device.`);
    } catch (e) {
      if (token === editorGeneration.current) setMessage(String(e));
    }
  };
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/pet" className={button}>
          ← Companion
        </Link>
        <header>
          <p className="text-teal-200">
            BLUE $NAKE STUDIO · EMPOWER. EDUCATE. CREATE.
          </p>
          <h1 className="my-3 text-4xl font-bold">Project Forge</h1>
          <p>
            Ask, try, discover and make something you can explain. Everything
            you save stays on this device. Reflections are optional: leave out
            personal details.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Activities work without a connection once this page is open.
            Starting or reloading offline is not yet guaranteed. Back up work
            before clearing browser data.
          </p>
        </header>
        <nav aria-label="Instruments" className="grid gap-3 sm:grid-cols-2">
          {Object.values(FORGE_TOOLS).map((t) => (
            <button
              key={t.id}
              className={`${button} text-left ${t.id === toolId ? "bg-teal-900" : ""}`}
              aria-pressed={t.id === toolId}
              onClick={() => select(t.id)}
            >
              <strong>{t.title}</strong>
              <span className="block text-sm">{t.learningOutcome}</span>
            </button>
          ))}
        </nav>
        <section
          className="space-y-4 rounded-xl border border-slate-600 p-4"
          aria-label={tool.title}
        >
          <h2 className="text-2xl font-bold">{tool.title}</h2>
          <p>
            SPARK · Spot → Predict → Act → Reflect → Keep. Explore freely;
            writing is optional.
          </p>
          <label className="block">
            Project title
            <input
              className={control}
              maxLength={100}
              value={input.title}
              onChange={(e) => change({ title: e.target.value })}
            />
          </label>
          {(["spot", "prediction"] as const).map((k) => (
            <label className="block" key={k}>
              {k === "spot"
                ? "Spot — what will you investigate?"
                : "Predict — what might happen? (optional)"}
              <textarea
                className={control}
                maxLength={500}
                value={spark[k]}
                onChange={(e) => setSpark({ ...spark, [k]: e.target.value })}
              />
            </label>
          ))}
          {(toolId === "pattern-forge" || toolId === "sound-studio") && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  className={button}
                  onClick={() => change({ sequence: [1, 3, 5, 7] })}
                >
                  Starter: add two
                </button>
                <button
                  className={button}
                  onClick={() =>
                    change({ sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21] })
                  }
                >
                  Stretch: Fibonacci
                </button>
                <button
                  className={button}
                  onClick={() =>
                    change({ sequence: [2, 1, 3, 4, 7, 1, 8, 9, 7, 6, 3, 9] })
                  }
                >
                  Explore MOSS60 seed digits
                </button>
              </div>
              <label className="block">
                Sequence (2–16 whole numbers, 0–24)
                <input
                  className={control}
                  value={sequenceText}
                  aria-invalid={!sequenceValid}
                  aria-describedby={
                    !sequenceValid ? "forge-sequence-error" : undefined
                  }
                  onChange={(e) => {
                    setSequenceText(e.target.value);
                    setResult(null);
                    const sequence = parseNumberList(
                      e.target.value,
                      "sequence",
                    );
                    if (sequence) setInput({ ...input, sequence });
                  }}
                />
              </label>
              {!sequenceValid && (
                <p id="forge-sequence-error" role="alert">
                  Use 2–16 whole numbers between 0 and 24. Correct the sequence
                  before running or playing it.
                </p>
              )}
              <p>
                Applied sequence: {input.sequence.join(", ")}. Valid edits apply
                immediately.
              </p>
              <div
                className="flex h-28 items-end gap-2"
                role="img"
                aria-label={`Pattern values ${input.sequence.join(", ")}`}
              >
                {input.sequence.map((n, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-teal-700 text-center"
                    style={{ height: 20 + n * 3 }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <label className="block">
                Tempo: {input.tempo} BPM
                <input
                  className="min-h-11 w-full"
                  type="range"
                  min="50"
                  max="160"
                  value={input.tempo}
                  onChange={(e) => change({ tempo: Number(e.target.value) })}
                />
              </label>
              {toolId === "sound-studio" && (
                <label className="block">
                  Rhythm: beat lengths (0.25, 0.5, 1 or 2; repeats across notes)
                  <input
                    className={control}
                    value={rhythmText}
                    aria-invalid={!rhythmValid}
                    aria-describedby={
                      !rhythmValid ? "forge-rhythm-error" : undefined
                    }
                    onChange={(e) => {
                      setRhythmText(e.target.value);
                      setResult(null);
                      const rhythm = parseNumberList(e.target.value, "rhythm");
                      if (rhythm) setInput({ ...input, rhythm });
                    }}
                  />
                </label>
              )}
              {toolId === "sound-studio" && !rhythmValid && (
                <p id="forge-rhythm-error" role="alert">
                  Use 1–16 beat lengths: 0.25, 0.5, 1 or 2.
                </p>
              )}
              <label className="block">
                Repetitions
                <select
                  className={control}
                  value={input.repeats}
                  onChange={(e) => change({ repeats: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button
                className={button}
                disabled={playing || !draftValid}
                onClick={async () => {
                  try {
                    await play(
                      input.sequence,
                      input.tempo,
                      input.repeats,
                      input.rhythm,
                    );
                  } catch (e) {
                    setMessage(String(e));
                  }
                }}
              >
                Hear sequence (optional)
              </button>
              {playing && (
                <button className={button} onClick={stop}>
                  Stop sound
                </button>
              )}
            </>
          )}
          {toolId === "discovery-lab" && (
            <>
              <p>
                Falling object model. Change one variable, predict, then compare
                two trials.
              </p>
              {(["height", "gravity"] as const).map((k) => (
                <label className="block" key={k}>
                  {k === "height"
                    ? "Height (metres)"
                    : "Gravity (metres per second squared)"}
                  <input
                    className={control}
                    type="number"
                    min={k === "height" ? 0.1 : 1}
                    max={k === "height" ? 10 : 20}
                    step="0.1"
                    value={input[k]}
                    onChange={(e) => change({ [k]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </>
          )}
          {toolId === "story-workshop" && (
            <>
              {input.paragraphs.map((p, i) => (
                <label className="block" key={i}>
                  {
                    [
                      "Opening — introduce someone and a problem",
                      "Ending A — one choice",
                      "Ending B — a different choice",
                    ][i]
                  }
                  <textarea
                    className={control}
                    rows={4}
                    maxLength={2000}
                    value={p}
                    onChange={(e) =>
                      change({
                        paragraphs: input.paragraphs.map((old, j) =>
                          j === i ? e.target.value : old,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <label className="block">
                Which ending follows your opening?
                <select
                  className={control}
                  value={input.choice}
                  onChange={(e) => change({ choice: Number(e.target.value) })}
                >
                  <option value={1}>A</option>
                  <option value={2}>B</option>
                </select>
              </label>
              <p className="whitespace-pre-wrap rounded border p-4">
                {input.paragraphs[0]}
                {"\n\n"}
                {input.paragraphs[input.choice]}
              </p>
              <button
                className={button}
                onClick={() =>
                  download(
                    "my-story.txt",
                    `${input.title}\n\n${input.paragraphs[0]}\n\n${input.paragraphs[input.choice]}`,
                    "text/plain",
                  )
                }
              >
                Export my writing
              </button>
            </>
          )}
          {toolId === "maker-bench" && (
            <>
              <p>
                Help a robot carry a supply from (0, 0) to (2, 2). It starts
                facing north. Assemble up to 30 instructions.
              </p>
              <div className="flex flex-wrap gap-2">
                {(["forward", "left", "right"] as const).map((step) => (
                  <button
                    key={step}
                    className={button}
                    disabled={input.steps.length >= 30}
                    onClick={() => change({ steps: [...input.steps, step] })}
                  >
                    {step}
                  </button>
                ))}
                <button
                  className={button}
                  onClick={() => change({ steps: input.steps.slice(0, -1) })}
                >
                  Undo instruction
                </button>
                <button
                  className={button}
                  onClick={() => change({ steps: [] })}
                >
                  Clear instructions
                </button>
              </div>
              <ol className="list-inside list-decimal">
                {input.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}
          {toolId === "life-compass" && (
            <>
              <p>
                Plan a small real-world project. Use task descriptions, never
                names, addresses or passwords.
              </p>
              {input.tasks.map((t, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <label>
                    Task {i + 1}
                    <input
                      className={control}
                      maxLength={100}
                      value={t.text}
                      onChange={(e) =>
                        change({
                          tasks: input.tasks.map((old, j) =>
                            i === j ? { ...old, text: e.target.value } : old,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Minutes
                    <input
                      className={control}
                      type="number"
                      min="1"
                      max="120"
                      value={t.minutes}
                      onChange={(e) =>
                        change({
                          tasks: input.tasks.map((old, j) =>
                            i === j
                              ? { ...old, minutes: Number(e.target.value) }
                              : old,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className={button}
                    onClick={() =>
                      change({ tasks: input.tasks.filter((_, j) => i !== j) })
                    }
                  >
                    Remove task {i + 1}
                  </button>
                </div>
              ))}
              <button
                className={button}
                disabled={input.tasks.length >= 20}
                onClick={() =>
                  change({ tasks: [...input.tasks, { text: "", minutes: 5 }] })
                }
              >
                Add task
              </button>
              <label className="block">
                How sure are you about the information you need?
                <select
                  className={control}
                  value={input.source}
                  onChange={(e) =>
                    change({
                      source: e.target.value as ActivityInput["source"],
                    })
                  }
                >
                  <option value="uncertain">Still need to check</option>
                  <option value="verified">I checked a reliable source</option>
                </select>
              </label>
            </>
          )}
          <button
            className={`${button} bg-teal-800`}
            disabled={!draftValid}
            onClick={() => {
              try {
                setResult(runActivity(toolId, input));
                setMessage(
                  "Experiment complete. Compare with your prediction.",
                );
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            Act — run this experiment
          </button>
          {result && (
            <div
              className="space-y-2 rounded border border-teal-400 p-4"
              role="status"
            >
              <p>{result.summary}</p>
              <p>{result.explanation}</p>
              <ForgeResultDetails result={result} />
              <p>
                Observed values:{" "}
                {result.values.map((v) => Number(v.toFixed(3))).join(", ")}
              </p>
              <button
                className={button}
                onClick={() => setComparison(result.summary)}
              >
                Keep trial for comparison
              </button>
            </div>
          )}
          {comparison && <p>Earlier trial: {comparison}</p>}
          <label className="block">
            Reflect — what changed and why? (optional)
            <textarea
              className={control}
              maxLength={500}
              value={spark.reflection}
              onChange={(e) =>
                setSpark({ ...spark, reflection: e.target.value })
              }
            />
          </label>
          <button
            className={button}
            disabled={!petId || !result || store.status !== "ready"}
            onClick={() => void save()}
          >
            Keep — {editing ? "save revision" : "save project"} locally
          </button>
          {!petId && (
            <p>
              Explore freely. Open your companion first to register its local
              identity before saving.
            </p>
          )}
          <p role="status">{message}</p>
          {store.error && (
            <p role="alert">
              Local storage: {store.error}{" "}
              <button
                className={button}
                onClick={() => petId && void store.hydrate(petId)}
              >
                Retry storage
              </button>
            </p>
          )}
        </section>
        <section className="space-y-3" aria-label="My projects">
          <h2 className="text-2xl font-bold">My projects</h2>
          {(memory?.projects ?? []).map((p) => (
            <article className="rounded border p-3" key={p.id}>
              <h3>
                {p.title} · {FORGE_TOOLS[p.toolId].title} · revision{" "}
                {p.revision}
              </h3>
              <div className="flex gap-2">
                <button className={button} onClick={() => reopen(p)}>
                  Reopen {p.title}
                </button>
                <button
                  className={button}
                  disabled={store.status !== "ready"}
                  onClick={() => {
                    const token = editorGeneration.current;
                    if (
                      confirm(`Delete ${p.title} and its companion influence?`)
                    )
                      void store
                        .deleteProject(p.id)
                        .then(() => {
                          if (
                            token === editorGeneration.current &&
                            editing?.id === p.id
                          )
                            setEditing(null);
                        })
                        .catch((e) => setMessage(String(e)));
                  }}
                >
                  Delete {p.title}
                </button>
              </div>
            </article>
          ))}
          {record && (
            <div className="space-y-2">
              <button
                className={button}
                onClick={() =>
                  void exportForgePetBundle(record)
                    .then((body) => download("metapet-with-forge.json", body))
                    .catch((e) => setMessage(String(e)))
                }
              >
                Export pet identity and Forge work
              </button>
              <label className="block">
                Restore pet + Forge bundle
                <input
                  className={control}
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > MAX_PET_BUNDLE_BYTES)
                        throw new Error("Bundle too large.");
                      if (
                        confirm(
                          "Restore pet and its Forge work? Existing Forge work for that identity will be replaced.",
                        )
                      ) {
                        const restored = await importForgePetBundle(
                          await file.text(),
                          getPetRepository(),
                        );
                        await getPetRepository().saveRecord(restored, {
                          activate: true,
                        });
                        // A fresh boot hydrates every companion renderer from the restored identity.
                        window.location.reload();
                        setMessage("Pet and Forge work restored locally.");
                      }
                    } catch (err) {
                      setMessage(String(err));
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          )}
          {memory && (
            <>
              <button
                className={button}
                onClick={() =>
                  download(
                    "metapet-forge.json",
                    exportForge({ ...memory, projects: memory.projects ?? [] }),
                  )
                }
              >
                Export all Forge work
              </button>
              <label className="block">
                Restore Forge backup for this pet (replaces current Forge work)
                <input
                  className={control}
                  type="file"
                  accept="application/json,.json"
                  disabled={store.status !== "ready"}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !petId) return;
                    try {
                      if (file.size > MAX_FORGE_BACKUP_BYTES)
                        throw new Error("Backup too large.");
                      const restored = parseForge(await file.text(), petId);
                      if (
                        confirm(
                          "Replace this pet’s Forge work with this backup?",
                        )
                      ) {
                        await store.replaceMemory(restored);
                        setEditing(null);
                        setMessage("Restored locally.");
                      }
                    } catch (err) {
                      setMessage(String(err));
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                className={button}
                disabled={store.status !== "ready"}
                onClick={() => {
                  if (
                    confirm(
                      "Delete all Forge projects and discoveries for this pet?",
                    )
                  )
                    void store
                      .clearDiscoveries()
                      .then(() => setEditing(null))
                      .catch((e) => setMessage(String(e)));
                }}
              >
                Delete all Forge work
              </button>
            </>
          )}
        </section>
        <details className="rounded border p-4">
          <summary className="min-h-11 cursor-pointer">
            Teacher guidance
          </summary>
          <p>
            Optional 15-minute activity: choose one question (2 min), predict (2
            min), change one input and run two trials (5 min), compare and
            explain verbally, in writing or with the visual (4 min), save or
            delete and close (2 min). Objective: explain cause and effect using
            evidence from a model or creation. Review only work the child
            chooses to show on this device. No automated assessment or classroom
            roster is accessed. These consumer instruments are not yet approved
            for Field Mode; the existing seven lessons remain separate.
          </p>
        </details>
      </div>
    </main>
  );
}
