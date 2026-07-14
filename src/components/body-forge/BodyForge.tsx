'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  DEFAULT_BODY_SPEC,
  PetBodyRenderer,
  type BodyFeature,
  type BodyPattern,
  type BodyShape,
  type BodySpec,
  type FaceExpression,
} from '@/components/body-forge/PetBodyRenderer';
import { useStore } from '@/lib/store';
import { getAvatarSizeError, useIdentityProfileStore } from '@/lib/identity/profile';
import { dataUrlByteLength, svgElementToPngDataUrl } from '@/lib/media/svgToPngDataUrl';
import { resolveVisualDNA } from '@/visual-dna';
import {
  applyEvolutionGrowth,
  applyLivePhenotype,
  clearForgedBody,
  createDNAReadyBodyPacket,
  createGenomeBodySpec,
  getGenomeVisualFingerprint,
  loadForgedBody,
  saveForgedBody,
} from '@/visual-dna/bodyForgeAdapter';

const ACTION_WINDOW_MS = 1_600;

const PRESETS: Record<string, BodySpec> = {
  Auralia: DEFAULT_BODY_SPEC,
  Omen: { ...DEFAULT_BODY_SPEC, name: 'Omen Form', shape: 'crystal', pattern: 'gradient', expression: 'focused', primaryColor: '#090d17', secondaryColor: '#02030a', highlightColor: '#d6a928', bodyWidth: 110, bodyHeight: 126, eyeSpacing: 36, glow: 0.7, features: ['wings', 'horns', 'thirdEye', 'crown'] },
  Bubble: { ...DEFAULT_BODY_SPEC, name: 'Bubble Form', shape: 'round', pattern: 'spotted', expression: 'smile', primaryColor: '#26d9d0', secondaryColor: '#18203a', highlightColor: '#ff7bbb', bodyWidth: 116, bodyHeight: 104, eyeSize: 14, eyeSpacing: 43, bob: 11, breathe: 0.07, features: ['wings', 'tailFlame'] },
};

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="grid grid-cols-[1fr_64px] gap-x-3 gap-y-1 text-xs text-zinc-300"><span>{label}</span><output className="text-right font-mono text-cyan-200">{Number(value.toFixed(2))}</output><input className="col-span-2 accent-cyan-400" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function Select<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: readonly T[]; onChange: (value: T) => void }) {
  return <label className="grid gap-1 text-xs text-zinc-300"><span>{label}</span><select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={value} onChange={(event) => onChange(event.target.value as T)}>{values.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

export function BodyForge() {
  const router = useRouter();
  const genome = useStore((state) => state.genome);
  const traits = useStore((state) => state.traits);
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  const setPetType = useStore((state) => state.setPetType);
  const identityProfile = useIdentityProfileStore((state) => state.profile);
  const saveIdentityProfile = useIdentityProfileStore((state) => state.saveProfile);
  const previewRef = useRef<HTMLDivElement>(null);
  const [spec, setSpec] = useState<BodySpec>(DEFAULT_BODY_SPEC);
  // Tracks which action timestamp has aged past the reaction window. Keeps
  // render pure (no Date.now during render): while an action is fresh the
  // memo is fed now=lastActionAt (full reaction), after the timer fires it is
  // fed a time past the window (pose settled).
  const [settledActionAt, setSettledActionAt] = useState<number | null>(null);
  const [animate, setAnimate] = useState(true);
  const [background, setBackground] = useState<'void' | 'light' | 'grid'>('void');
  const [copied, setCopied] = useState(false);
  const [hasSavedForge, setHasSavedForge] = useState(false);
  const [avatarExportStatus, setAvatarExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  useEffect(() => {
    // Deferred so the initial load happens outside the effect body, rather
    // than setting state synchronously during mount.
    const initialLoad = window.setTimeout(() => {
      const stored = loadForgedBody();
      if (stored) {
        setSpec(stored);
        setHasSavedForge(true);
      }
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    if (!lastAction || !lastActionAt) return;
    const remaining = ACTION_WINDOW_MS - (Date.now() - lastActionAt);
    const timeout = window.setTimeout(
      () => setSettledActionAt(lastActionAt),
      Math.max(0, remaining + 20),
    );
    return () => window.clearTimeout(timeout);
  }, [lastAction, lastActionAt]);

  const actionSettled = !lastActionAt || settledActionAt === lastActionAt;

  const phenotype = useMemo(() => {
    if (!traits) return null;
    return resolveVisualDNA({
      traits,
      vitals,
      evolution,
      lastAction,
      lastActionAt,
      now: actionSettled ? lastActionAt + ACTION_WINDOW_MS : lastActionAt,
    });
  }, [actionSettled, evolution, lastAction, lastActionAt, traits, vitals]);
  const dnaBody = useMemo(() => phenotype ? createGenomeBodySpec(phenotype, genome) : null, [genome, phenotype]);
  // Live preview mirrors the same pipeline VisualDNAPet uses: the edited
  // draft is the inherited base, evolution reveals earned features on top,
  // then current mood/hunger/dosha temporarily deform it for preview only.
  const previewSpec = useMemo(
    () => phenotype ? applyLivePhenotype(applyEvolutionGrowth(spec, phenotype), phenotype) : spec,
    [phenotype, spec],
  );
  const fingerprint = getGenomeVisualFingerprint(genome, phenotype?.identity.seed ?? 0);
  const json = useMemo(() => JSON.stringify(spec, null, 2), [spec]);
  const patch = <K extends keyof BodySpec>(key: K, value: BodySpec[K]) => setSpec((current) => ({ ...current, [key]: value }));
  const toggleFeature = (feature: BodyFeature) => patch('features', spec.features.includes(feature) ? spec.features.filter((item) => item !== feature) : [...spec.features, feature]);

  const randomize = () => {
    const colors = ['#1677ff', '#12b8a6', '#8528d8', '#d12f5b', '#e28723', '#151b2d'];
    const highlights = ['#f5c451', '#7ef9ff', '#ff82ce', '#d9ff75', '#ffffff'];
    const featurePool: BodyFeature[] = ['wings', 'horns', 'crown', 'thirdEye', 'tailFlame'];
    setSpec((current) => ({
      ...current,
      shape: (['round', 'bean', 'cubic', 'crystal', 'toroid'] as BodyShape[])[Math.floor(Math.random() * 5)],
      pattern: (['solid', 'gradient', 'striped', 'spotted'] as BodyPattern[])[Math.floor(Math.random() * 4)],
      primaryColor: colors[Math.floor(Math.random() * colors.length)],
      secondaryColor: colors[Math.floor(Math.random() * colors.length)],
      highlightColor: highlights[Math.floor(Math.random() * highlights.length)],
      bodyWidth: 72 + Math.random() * 74,
      bodyHeight: 78 + Math.random() * 80,
      bodyScale: 0.72 + Math.random() * 0.56,
      eyeSpacing: 22 + Math.random() * 48,
      eyeSize: 6.5 + Math.random() * 12.5,
      pupilSize: 2.5 + Math.random() * 7,
      wingSpread: 0.3 + Math.random() * 1.1,
      hornLength: 11 + Math.random() * 43,
      glow: 0.05 + Math.random() * 0.9,
      bob: 1 + Math.random() * 14,
      breathe: 0.012 + Math.random() * 0.083,
      animationSpeed: 0.45 + Math.random() * 1.8,
      features: featurePool.filter(() => Math.random() > 0.54),
    }));
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const exportJson = () => {
    const packet = JSON.stringify(createDNAReadyBodyPacket(spec, genome, phenotype?.identity.seed ?? 0), null, 2);
    const url = URL.createObjectURL(new Blob([packet], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.metapet-body.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsAvatar = async () => {
    const svg = previewRef.current?.querySelector('svg');
    if (!svg) {
      setAvatarExportStatus({ type: 'error', message: 'Could not find the body preview to export.' });
      return;
    }
    try {
      const dataUrl = await svgElementToPngDataUrl(svg);
      const sizeError = getAvatarSizeError(dataUrlByteLength(dataUrl));
      if (sizeError) {
        setAvatarExportStatus({ type: 'error', message: sizeError });
        return;
      }
      saveIdentityProfile({ ...identityProfile, avatarDataUrl: dataUrl });
      setAvatarExportStatus({ type: 'success', message: 'Saved as your owner avatar.' });
    } catch {
      setAvatarExportStatus({ type: 'error', message: 'Could not export this body as an avatar.' });
    }
  };

  const sendToMetaPet = () => {
    saveForgedBody(spec, genome, phenotype?.identity.seed ?? 0);
    setPetType('geometric');
    setHasSavedForge(true);
    router.push('/pet');
  };

  const clearForge = () => {
    clearForgedBody();
    setHasSavedForge(false);
    if (dnaBody) setSpec(dnaBody);
  };

  return (
    <main className="min-h-screen bg-[#030610] text-white">
      <header className="border-b border-cyan-950/80 bg-slate-950/85 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">B$S creature workshop</p><h1 className="text-2xl font-black tracking-tight">BODY FORGE</h1><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-200/65">180 digits → 30 visual genes · {fingerprint}</p></div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([name, value]) => <button key={name} onClick={() => setSpec(value)} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-400">{name}</button>)}
            {dnaBody && <button onClick={() => setSpec(dnaBody)} className="rounded-full border border-amber-400/60 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100" title="Reset the edit below to the pure genome-derived body">Load live DNA</button>}
            <button onClick={randomize} className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold text-slate-950">Mutate body</button>
            {hasSavedForge && <button onClick={clearForge} className="rounded-full border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-200" title="Delete the saved forged customisation; Meta-Pet reverts to the pure DNA body">Clear forged body</button>}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 lg:grid-cols-[320px_minmax(420px,1fr)_320px]">
        <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Structure</h2><button className="text-xs text-zinc-400 hover:text-white" onClick={() => setSpec(DEFAULT_BODY_SPEC)}>Reset</button></div>
          <p className="-mt-3 text-[11px] leading-4 text-zinc-500">
            Editing the <span className="text-amber-200">forged customisation</span>. It starts from a preset or the live DNA body; nothing here is saved until you press &ldquo;Set inherited body&rdquo;.
          </p>
          <label className="grid gap-1 text-xs text-zinc-300">Preset name<input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={spec.name} onChange={(event) => patch('name', event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3"><Select label="Shape" value={spec.shape} values={['round', 'bean', 'cubic', 'crystal', 'toroid']} onChange={(value) => patch('shape', value)} /><Select label="Pattern" value={spec.pattern} values={['solid', 'gradient', 'striped', 'spotted']} onChange={(value) => patch('pattern', value)} /></div>
          <Slider label="Body width" value={spec.bodyWidth} min={58} max={170} onChange={(value) => patch('bodyWidth', value)} />
          <Slider label="Body height" value={spec.bodyHeight} min={62} max={180} onChange={(value) => patch('bodyHeight', value)} />
          <Slider label="Body scale" value={spec.bodyScale} min={0.48} max={1.65} step={0.01} onChange={(value) => patch('bodyScale', value)} />
          <Slider label="Corner softness" value={spec.cornerRoundness} min={0} max={50} onChange={(value) => patch('cornerRoundness', value)} />
          <Slider label="Wing spread" value={spec.wingSpread} min={0.2} max={1.65} step={0.01} onChange={(value) => patch('wingSpread', value)} />
          <Slider label="Horn length" value={spec.hornLength} min={8} max={64} onChange={(value) => patch('hornLength', value)} />
          <div><p className="mb-2 text-xs text-zinc-400">Features</p><div className="flex flex-wrap gap-2">{(['wings', 'horns', 'crown', 'thirdEye', 'tailFlame'] as BodyFeature[]).map((feature) => <button key={feature} onClick={() => toggleFeature(feature)} className={`rounded-full border px-3 py-1 text-xs ${spec.features.includes(feature) ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-slate-700 text-zinc-400'}`}>{feature}</button>)}</div></div>
        </aside>

        <section className="min-h-[620px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-xs">
            <div className="flex gap-2">{(['void', 'light', 'grid'] as const).map((value) => <button key={value} onClick={() => setBackground(value)} className={`rounded-full px-3 py-1 ${background === value ? 'bg-white text-black' : 'bg-slate-800 text-zinc-300'}`}>{value}</button>)}</div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={animate} onChange={(event) => setAnimate(event.target.checked)} />Animate</label>
          </div>
          <div className={`relative flex min-h-[570px] items-center justify-center overflow-hidden ${background === 'light' ? 'bg-zinc-100' : background === 'grid' ? 'bg-[#08101d] bg-[linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] bg-[size:28px_28px]' : 'bg-[radial-gradient(circle_at_center,#132945_0%,#050814_58%,#010207_100%)]'}`}>
            <div ref={previewRef} className="contents">
              <PetBodyRenderer spec={previewSpec} animate={animate} className="h-auto w-full max-w-[720px]" />
            </div>
            <div className="absolute bottom-4 left-4 max-w-[80%] rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/65">
              Live preview · forged anatomy stays inherited; current mood, hunger, evolution and dosha only preview a temporary deformation here
            </div>
          </div>
        </section>

        <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
          <h2 className="font-semibold">Face & finish</h2>
          <Select label="Expression" value={spec.expression} values={['neutral', 'smile', 'frown', 'focused', 'sleepy']} onChange={(value: FaceExpression) => patch('expression', value)} />
          <Slider label="Eye size" value={spec.eyeSize} min={5} max={22} onChange={(value) => patch('eyeSize', value)} />
          <Slider label="Eye spacing" value={spec.eyeSpacing} min={20} max={72} onChange={(value) => patch('eyeSpacing', value)} />
          <Slider label="Eye height" value={spec.eyeHeight} min={82} max={125} onChange={(value) => patch('eyeHeight', value)} />
          <Slider label="Pupil size" value={spec.pupilSize} min={2} max={10} step={0.5} onChange={(value) => patch('pupilSize', value)} />
          <Slider label="Gaze X" value={spec.gazeX} min={-7} max={7} step={0.5} onChange={(value) => patch('gazeX', value)} />
          <Slider label="Gaze Y" value={spec.gazeY} min={-6} max={6} step={0.5} onChange={(value) => patch('gazeY', value)} />
          <Slider label="Mouth width" value={spec.mouthWidth} min={10} max={58} onChange={(value) => patch('mouthWidth', value)} />
          <Slider label="Mouth curve" value={spec.mouthHeight} min={2} max={24} onChange={(value) => patch('mouthHeight', value)} />
          <div className="grid grid-cols-3 gap-2">{(['primaryColor', 'secondaryColor', 'highlightColor'] as const).map((key) => <label key={key} className="grid gap-1 text-[10px] text-zinc-400">{key.replace('Color', '')}<input type="color" value={spec[key]} onChange={(event) => patch(key, event.target.value)} className="h-10 w-full rounded bg-transparent" /></label>)}</div>
          <Slider label="Outline" value={spec.outlineWidth} min={0} max={9} step={0.5} onChange={(value) => patch('outlineWidth', value)} />
          <Slider label="Glow" value={spec.glow} min={0} max={1} step={0.01} onChange={(value) => patch('glow', value)} />
          <Slider label="Tilt" value={spec.tilt} min={-18} max={18} step={0.5} onChange={(value) => patch('tilt', value)} />
          <Slider label="Bob" value={spec.bob} min={0} max={20} onChange={(value) => patch('bob', value)} />
          <Slider label="Breathing" value={spec.breathe} min={0} max={0.12} step={0.005} onChange={(value) => patch('breathe', value)} />
          <Slider label="Motion speed" value={spec.animationSpeed} min={0.25} max={2.5} step={0.05} onChange={(value) => patch('animationSpeed', value)} />
          <div className="grid grid-cols-2 gap-2"><button onClick={copyJson} className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:border-cyan-400">{copied ? 'Copied' : 'Copy JSON'}</button><button onClick={exportJson} className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-bold text-cyan-200">DNA packet</button><button onClick={exportAsAvatar} className="col-span-2 rounded-lg border border-amber-400/60 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">Save as avatar</button><button onClick={sendToMetaPet} className="col-span-2 rounded-lg bg-cyan-300 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950">Set inherited body</button></div>
          {avatarExportStatus && (
            <p className={`text-[10px] leading-4 ${avatarExportStatus.type === 'success' ? 'text-cyan-300' : 'text-rose-400'}`}>
              {avatarExportStatus.message}
              {avatarExportStatus.type === 'success' && <> · <Link href="/identity" className="underline">View in Identity</Link></>}
            </p>
          )}
          <p className="text-[10px] leading-4 text-zinc-500">Saves this customisation as the pet&rsquo;s inherited anatomy, selects the canonical DNA / Forge renderer, and returns to the single `/pet` runtime. Evolution can still add revealed features on top; hunger, mood, energy, sickness and actions only ever deform it temporarily.</p>
        </aside>
      </div>
    </main>
  );
}
