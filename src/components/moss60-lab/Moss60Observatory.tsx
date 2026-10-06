"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { decodeGenome } from "@/genome/decoder";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { copyActivePetDna } from "@/lib/moss60/lab/activePet";
import { ATLAS_STRANDS, inspectWindow, type Direction } from "@/lib/moss60/lab/atlas";
import {
  canonicalGenome, copyGenome, createExperiment, ENVIRONMENTS, exportExperiment,
  importExperiment, LAB_VERSION, LANES, MAX_IMPORT_BYTES, MAX_TICKS, normalizedTraits,
  PERSONALITY_AXES, runExperiment, windowResidues, type Environment, type Experiment,
} from "@/lib/moss60/lab/engine";
import geometry from "@/lib/moss60/lab/geometry.json";
import styles from "./observatory.module.css";

type Shape = keyof typeof geometry;
type Strand = "red" | "blue" | "black";
const SHAPE_NOTES: Record<Shape, string> = {
  ring: "60 positions on one strand. Select a locus to inspect its circular window.",
  icosa: "20 triangular faces × 3 corner slots = 60 loci. The solid has 12 vertices.",
  dodeca: "12 pentagonal faces × 5 corner slots = 60 loci. The solid has 20 vertices.",
};

function LocusView({ state, strand, shape, rotation, locus, width, direction, onSelect }: {
  state: Experiment; strand: Strand; shape: Shape; rotation: number; locus: number;
  width: number; direction: Direction; onSelect: (locus: number) => void;
}) {
  const lane = LANES.indexOf(`${strand}60`);
  const digits = state.genome[`${strand}60`].join("");
  const angle = rotation * Math.PI / 180;
  const nodes = geometry[shape].slots.map(([x, y, z], i) => {
    const X = x * Math.cos(angle) + z * Math.sin(angle);
    const Z = -x * Math.sin(angle) + z * Math.cos(angle);
    return { i, x: 250 + (shape === "ring" ? x : X) * 175,
      y: 230 + (shape === "ring" ? y : y * Math.cos(0.35) - Z * Math.sin(0.35)) * 175,
      z: shape === "ring" ? 0 : y * Math.sin(0.35) + Z * Math.cos(0.35) };
  });
  return <svg viewBox="0 0 500 470" className={styles.visual} role="group" aria-label={`${strand} DNA in a ${shape} view`}>
    <circle cx="250" cy="230" r="214" fill="none" stroke="#25333e" strokeDasharray="2 9" />
    {geometry[shape].edges.map(([a, b], index) => <line key={index} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#3a505b" strokeWidth="1" />)}
    {shape === "ring" ? <g textAnchor="middle"><text x="250" y="218" className={styles.centerTitle}>{strand.toUpperCase()} / 60</text><text x="250" y="245" className={styles.centerNote}>inherited code · expression</text><text x="250" y="280" className={styles.centerTick}>{state.tick.toLocaleString()} ticks</text></g> : null}
    {[...nodes].sort((a, b) => a.z - b.z).map(point => {
      const reading = inspectWindow(digits, point.i, width, direction);
      const selected = point.i === locus;
      const expression = state.expression[lane * 60 + point.i];
      return <g key={point.i} role="button" tabIndex={selected ? 0 : -1}
        aria-label={`Locus ${point.i}, digit ${digits[point.i]}`} aria-pressed={selected}
        className={styles.node} opacity={point.z < -0.1 && !selected ? 0.4 : 1}
        onClick={() => onSelect(point.i)} onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(point.i); }
        }}>
        <circle cx={point.x} cy={point.y} r="13" fill="transparent" />
        {selected ? <circle cx={point.x} cy={point.y} r="14" fill="none" stroke="#efd092" strokeWidth="1" /> : null}
        <circle cx={point.x} cy={point.y} r={selected ? 8 : 4 + expression * 4} fill={reading.hex}
          stroke={selected ? "#ffe3a5" : reading.palindrome ? "#72e0c4" : reading.primeStatus === "prime" || reading.primeStatus === "probable prime" ? "#d9b570" : "#768996"} strokeWidth={selected ? 2 : 1.5} />
        {shape === "ring" || selected || point.z > 0.25 ? <text x={point.x + (shape === "ring" ? (point.x - 250) / 10 : 0)}
          y={point.y + (shape === "ring" ? (point.y - 230) / 10 + 4 : -13)} textAnchor="middle" className={styles.digit}>{digits[point.i]}</text> : null}
      </g>;
    })}
  </svg>;
}

export default function Moss60Observatory() {
  const [state, setState] = useState<Experiment | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Preparing canonical DNA…");
  const [source, setSource] = useState("Canonical Moss60");
  const [seed, setSeed] = useState("MOSS60");
  const [strand, setStrand] = useState<Strand>("red");
  const [shape, setShape] = useState<Shape>("ring");
  const [environment, setEnvironment] = useState<Environment>("balanced");
  const [width, setWidth] = useState(7);
  const [direction, setDirection] = useState<Direction>(1);
  const [locus, setLocus] = useState(1);
  const [rotation, setRotation] = useState(24);
  const [atlasSource, setAtlasSource] = useState<"specimen" | "lukus">("specimen");
  const fileInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const operation = useRef(0);
  const hasActivePet = usePetRegistryStore(value => value.activeRecord !== null);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    createExperiment(canonicalGenome(), 10).then(initial => {
      if (!cancelled) { setState(initial); setBusy(false); setNotice("Canonical DNA ready. Choose an environment and run an experiment."); }
    }).catch(reason => { if (!cancelled) { setError(String(reason)); setBusy(false); } });
    return () => { cancelled = true; mounted.current = false; };
  }, []);

  async function replaceExperiment(work: () => Promise<Experiment>, name: string, message: string) {
    const request = ++operation.current;
    setBusy(true); setError("");
    try {
      const next = await work();
      if (mounted.current && request === operation.current) {
        setState(next); setSeed(next.seed); setSource(name); setNotice(message);
        setEnvironment(next.events.at(-1)?.environment ?? "balanced");
      }
    } catch (reason) {
      if (mounted.current && request === operation.current) setError(reason instanceof Error ? reason.message : "Could not load experiment");
    } finally {
      if (mounted.current && request === operation.current) setBusy(false);
    }
  }

  function step() {
    if (!state || busy) return;
    try {
      // Own the mutable simulation buffers; the DNA object remains frozen.
      const next = { ...state, amplitude: state.amplitude.slice(), phase: state.phase.slice(), expression: state.expression.slice(), delta: state.delta.slice(), events: state.events.map(event => ({ ...event })) };
      runExperiment(next, 600, environment);
      setState(next); setError(""); setNotice(`Ran 600 steps in ${ENVIRONMENTS[environment].label.toLowerCase()}. DNA fingerprint unchanged.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Experiment failed"); }
  }

  const genome = state?.genome;
  const radix = state?.radix;
  const analysis = useMemo(() => genome && radix ? {
    current: decodeGenome(copyGenome(genome, radix)),
    proposed: normalizedTraits(genome, radix),
    residues: windowResidues(genome, radix),
  } : null, [genome, radix]); // Derived DNA features do not change with simulation ticks.
  const digits = atlasSource === "lukus" ? ATLAS_STRANDS.lukus : state?.genome[`${strand}60`].join("") ?? ATLAS_STRANDS[strand];
  const inspected = inspectWindow(digits, locus % digits.length, Math.min(width, digits.length), direction);
  const activeLane = LANES.indexOf(`${strand}60`);
  const disabled = busy || !state;

  return <main className={styles.page}>
    <div className={styles.container}>
      <nav className={styles.nav}><Link href="/app/moss60">← MOSS60 Studio</Link><span>EXPERIMENTAL / V1</span></nav>
      <header className={styles.header}><p className={styles.eyebrow}>METAPET · MOSS60 OBSERVATORY</p><h1>DNA, in motion.</h1>
        <p>Explore the patterns inside your companion. Change its simulated environment, follow its expression, and replay every step.</p>
      </header>
      <div className={styles.stats} aria-label="Experiment summary">
        <div><strong>180</strong><span>inherited digits</span></div><div><strong>21,888</strong><span>canonical atlas windows</span></div>
        <div><strong data-testid="tick-count">{state?.tick.toLocaleString() ?? "0"}</strong><span>simulation ticks</span></div><div><strong>60 Hz</strong><span>fixed simulation clock</span></div>
      </div>
      <section className={styles.panel} aria-labelledby="expression-heading">
        <div className={styles.panelHeading}><div><p className={styles.eyebrow}>01 / EXPRESSION CHAMBER</p><h2 id="expression-heading">{source}</h2></div><span className={styles.badge}>DNA stays intact</span></div>
        <div className={styles.labGrid}>
          <div className={styles.view}>
            {state ? <LocusView state={state} strand={strand} shape={shape} rotation={rotation} locus={locus % 60} width={width} direction={direction} onSelect={setLocus} /> : <div className={styles.loading}>Preparing the observatory…</div>}
            <p className={styles.caption}>{SHAPE_NOTES[shape]}</p><p className={styles.legend}>Gold: prime window · Mint: palindrome · Size: expression</p>
            <div className={styles.reading}><span>LOCUS {locus % 60} · {strand.toUpperCase()}</span><strong data-testid="expression-reading">Expression {state ? (100 * state.expression[activeLane * 60 + locus % 60]).toFixed(1) : "50.0"}%</strong>
              <p>Resonance {state ? (100 * state.amplitude[activeLane * 60 + locus % 60]).toFixed(1) : "—"}% · phase {state ? state.phase[activeLane * 60 + locus % 60].toFixed(2) : "—"} rad</p></div>
          </div>
          <div className={styles.controls}>
            <label>Strand<select value={strand} onChange={event => setStrand(event.target.value as Strand)}><option value="red">Red / Fire</option><option value="blue">Blue / Water</option><option value="black">Black / Earth</option></select></label>
            <label>Spatial view<select value={shape} onChange={event => setShape(event.target.value as Shape)}><option value="ring">60-locus ring</option><option value="icosa">Icosahedron · 20 × 3</option><option value="dodeca">Dodecahedron · 12 × 5</option></select></label>
            <label>Environment<select value={environment} disabled={busy} onChange={event => setEnvironment(event.target.value as Environment)}>{Object.entries(ENVIRONMENTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
            <label htmlFor="lab-locus">Source locus <output>{locus}</output> / 59<input id="lab-locus" type="range" min="0" max="59" value={locus} onChange={event => setLocus(Number(event.target.value))} /></label>
            <label>Rotate view<input type="range" min="-180" max="180" value={rotation} onChange={event => setRotation(Number(event.target.value))} /></label>
            <label>Experiment seed<input value={seed} maxLength={128} disabled={busy} onChange={event => setSeed(event.target.value)} /><small>Applied when you reset or load DNA.</small></label>
            <button className={styles.primary} disabled={disabled || (state?.tick ?? 0) + 600 > MAX_TICKS} onClick={step}>Run 600 steps</button>
            <button disabled={disabled} onClick={() => state && void replaceExperiment(() => createExperiment(state.genome, state.radix, seed), source, "Expression reset. The same seed reproduces the same initial state.")}>Reset expression</button>
            <small>Each run advances 10 simulated seconds. Maximum 36,000 ticks per experiment.</small>
          </div>
        </div>
        <p className={styles.status} role="status" aria-label="Experiment status">{busy ? "Preparing experiment…" : notice}</p>
        {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      </section>
      <div className={styles.lowerGrid}>
        <section className={styles.panel} aria-labelledby="atlas-heading"><p className={styles.eyebrow}>02 / CIRCULAR ATLAS</p><h2 id="atlas-heading">Read the hidden windows.</h2>
          <div className={styles.inlineControls}><label>Atlas source<select value={atlasSource} onChange={event => setAtlasSource(event.target.value as "specimen" | "lukus")}><option value="specimen">Current strand</option><option value="lukus">Lukus · 213471897639</option></select></label>
            <label>Direction<select value={direction} onChange={event => setDirection(Number(event.target.value) as Direction)}><option value="1">Clockwise +1</option><option value="-1">Counter-clockwise −1</option></select></label></div>
          <label className={styles.rangeLabel} htmlFor="lab-window-width">Window width <output>{Math.min(width, digits.length)}</output><input id="lab-window-width" type="range" min="1" max={digits.length} value={Math.min(width, digits.length)} onChange={event => setWidth(Number(event.target.value))} /></label>
          <p className={styles.window} data-testid="window-digits">{inspected.digits}</p>
          <div className={styles.tags}><span>{inspected.primeStatus}</span><span>{inspected.palindrome ? "palindrome" : "no mirror"}</span>{inspected.symbolicGate ? <span>Moss symbolic gate</span> : null}</div>
          <p className={styles.caption}>Source locus {locus % digits.length} · quadrant {inspected.quadrant}{inspected.chamber !== null ? ` · chamber ${inspected.chamber}` : ""}. Addresses start at zero.</p>
          <div className={styles.swatch}><span style={{ backgroundColor: inspected.hex }} /><code>{inspected.hex}</code><small>seven-digit colour</small></div>
          <p className={styles.caption}>Canonical readings above 2⁶⁴ are labelled probable prime after 32 reproducible Miller–Rabin checks. Custom DNA is classified up to seven digits. One is a symbolic gate, never a mathematical prime.</p>
        </section>
        <section className={styles.panel} aria-labelledby="replay-heading"><p className={styles.eyebrow}>03 / EXPERIMENT RECORD</p><h2 id="replay-heading">Keep the path. Replay it.</h2>
          <p className={styles.caption}>Copy an active pet, or work with the canonical strands. Export saves DNA, the seed and environment history in an experimental JSON file.</p>
          <div className={styles.recordActions}>
            <button disabled={busy} onClick={() => void replaceExperiment(() => createExperiment(canonicalGenome(), 10, seed), "Canonical Moss60", "Loaded a fresh canonical DNA experiment.")}>Load canonical DNA</button>
            <button disabled={busy || !hasActivePet} onClick={() => void replaceExperiment(async () => {
              const record = usePetRegistryStore.getState().activeRecord;
              if (!record) throw new Error("Open a companion first, then return to copy its DNA.");
              const copy = await copyActivePetDna(record);
              return createExperiment(copy.genome, copy.radix, seed);
            }, "Active pet · DNA copy", "Copied active pet DNA. Experiments do not write to its saved record.")}>Copy active pet DNA</button>
            <button disabled={disabled} onClick={() => state && void replaceExperiment(() => importExperiment(exportExperiment(state)), source, "Replayed the complete environment history from the original DNA and seed.")}>Replay from start</button>
            <button disabled={disabled} onClick={() => {
              if (!state) return;
              const url = URL.createObjectURL(new Blob([exportExperiment(state)], { type: "application/json" }));
              const link = document.createElement("a"); link.href = url; link.download = "moss60-experiment.json"; link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}>Export experiment</button>
            <button disabled={busy} onClick={() => fileInput.current?.click()}>Import experiment</button>
            <input ref={fileInput} aria-label="Import experiment file" type="file" accept=".json,application/json" className={styles.fileInput} onChange={event => {
              const file = event.target.files?.[0]; event.target.value = "";
              if (!file) return;
              void replaceExperiment(async () => {
                if (file.size > MAX_IMPORT_BYTES) throw new Error("Experiment file is too large (250 KB maximum).");
                return importExperiment(await file.text());
              }, "Imported experiment", "Imported and replayed the experiment. Saved pets were not changed.");
            }} />
          </div>
          {!hasActivePet ? <p className={styles.caption}>Open your companion in the app first to enable copying its DNA.</p> : null}
          <p className={styles.fingerprint}>DNA fingerprint <code data-testid="dna-fingerprint">{state?.dnaHash ?? "Preparing…"}</code></p>
          <ol className={styles.history} aria-label="Environment history">{state?.events.length ? state.events.map((event, index) => <li key={index}>{ENVIRONMENTS[event.environment].label}<span>{event.steps.toLocaleString()} ticks</span></li>) : <li>No steps yet<span>ready</span></li>}</ol>
          <p className={styles.caption}>Experimental game rules. This file replays the lab; it is not a registered pet import or an identity attestation.</p>
        </section>
      </div>
      <section className={styles.panel} aria-labelledby="traits-heading"><p className={styles.eyebrow}>04 / DERIVED FEATURES</p><h2 id="traits-heading">One genome, two readings.</h2>
        <p className={styles.caption}>Compare the current trait decoder with experimental base-{state?.radix ?? 10} scaling. These previews do not change the companion’s traits.</p>
        <div className={styles.features}>
          <div className={styles.tableWrap}><table><thead><tr><th>Personality</th><th>Current</th><th>Experimental</th></tr></thead><tbody>{PERSONALITY_AXES.map(axis => <tr key={axis}><th>{axis}</th><td>{analysis?.current.personality[axis] ?? "—"}</td><td>{analysis?.proposed.personality[axis] ?? "—"}</td></tr>)}</tbody></table></div>
          <div><h3>Window residues</h3><p className={styles.caption}>Seven-digit readings modulo 60. {analysis?.residues.filter(count => count > 0).length ?? 0} of 60 bins occupied across 180 windows.</p>
            <div className={styles.residueGrid} aria-label="Window residue counts">{analysis?.residues.map((count, i) => <div key={i} title={`Residue ${i}: ${count} windows`} style={{ backgroundColor: `rgba(114,224,196,${0.05 + Math.min(count / 10, 1) * 0.45})` }}><span>{i}</span><strong>{count}</strong></div>)}</div>
            <p className={styles.caption}>This is a derived pattern, not an identity hash. Full inherited DNA remains the source of identity.</p>
          </div>
        </div>
      </section>
      <footer className={styles.footer}><span>{LAB_VERSION}</span><span>Local experiments · inherited DNA preserved</span></footer>
    </div>
  </main>;
}
