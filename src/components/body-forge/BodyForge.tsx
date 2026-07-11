'use client';

import { useMemo, useState } from 'react';
import { BodyFeature, BodyPattern, BodyShape, DEFAULT_BODY_SPEC, FaceExpression, PetBodyRenderer, type BodySpec } from '@/components/body-forge/PetBodyRenderer';

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
  const [spec, setSpec] = useState<BodySpec>(DEFAULT_BODY_SPEC);
  const [animate, setAnimate] = useState(true);
  const [background, setBackground] = useState<'void' | 'light' | 'grid'>('void');
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(spec, null, 2), [spec]);
  const patch = <K extends keyof BodySpec>(key: K, value: BodySpec[K]) => setSpec((current) => ({ ...current, [key]: value }));
  const toggleFeature = (feature: BodyFeature) => patch('features', spec.features.includes(feature) ? spec.features.filter((item) => item !== feature) : [...spec.features, feature]);

  const randomize = () => {
    const colors = ['#1677ff', '#12b8a6', '#8528d8', '#d12f5b', '#e28723', '#151b2d'];
    const highlights = ['#f5c451', '#7ef9ff', '#ff82ce', '#d9ff75', '#ffffff'];
    patch('primaryColor', colors[Math.floor(Math.random() * colors.length)]);
    setSpec((current) => ({ ...current, shape: (['round', 'bean', 'cubic', 'crystal', 'toroid'] as BodyShape[])[Math.floor(Math.random() * 5)], pattern: (['solid', 'gradient', 'striped', 'spotted'] as BodyPattern[])[Math.floor(Math.random() * 4)], highlightColor: highlights[Math.floor(Math.random() * highlights.length)], bodyWidth: 82 + Math.round(Math.random() * 54), bodyHeight: 88 + Math.round(Math.random() * 56), eyeSpacing: 30 + Math.round(Math.random() * 30), eyeSize: 8 + Math.round(Math.random() * 8) }));
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.body.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#030610] text-white">
      <header className="border-b border-cyan-950/80 bg-slate-950/85 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">B$S creature workshop</p><h1 className="text-2xl font-black tracking-tight">BODY FORGE</h1></div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([name, value]) => <button key={name} onClick={() => setSpec(value)} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-400">{name}</button>)}
            <button onClick={randomize} className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold text-slate-950">Mutate body</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 lg:grid-cols-[320px_minmax(420px,1fr)_320px]">
        <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Structure</h2><button className="text-xs text-zinc-400 hover:text-white" onClick={() => setSpec(DEFAULT_BODY_SPEC)}>Reset</button></div>
          <label className="grid gap-1 text-xs text-zinc-300">Preset name<input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={spec.name} onChange={(event) => patch('name', event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3"><Select label="Shape" value={spec.shape} values={['round', 'bean', 'cubic', 'crystal', 'toroid']} onChange={(value) => patch('shape', value)} /><Select label="Pattern" value={spec.pattern} values={['solid', 'gradient', 'striped', 'spotted']} onChange={(value) => patch('pattern', value)} /></div>
          <Slider label="Body width" value={spec.bodyWidth} min={64} max={150} onChange={(value) => patch('bodyWidth', value)} />
          <Slider label="Body height" value={spec.bodyHeight} min={68} max={160} onChange={(value) => patch('bodyHeight', value)} />
          <Slider label="Body scale" value={spec.bodyScale} min={0.65} max={1.35} step={0.01} onChange={(value) => patch('bodyScale', value)} />
          <Slider label="Corner softness" value={spec.cornerRoundness} min={0} max={50} onChange={(value) => patch('cornerRoundness', value)} />
          <Slider label="Wing spread" value={spec.wingSpread} min={0.25} max={1.4} step={0.01} onChange={(value) => patch('wingSpread', value)} />
          <Slider label="Horn length" value={spec.hornLength} min={10} max={54} onChange={(value) => patch('hornLength', value)} />
          <div><p className="mb-2 text-xs text-zinc-400">Features</p><div className="flex flex-wrap gap-2">{(['wings', 'horns', 'crown', 'thirdEye', 'tailFlame'] as BodyFeature[]).map((feature) => <button key={feature} onClick={() => toggleFeature(feature)} className={`rounded-full border px-3 py-1 text-xs ${spec.features.includes(feature) ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-slate-700 text-zinc-400'}`}>{feature}</button>)}</div></div>
        </aside>

        <section className="min-h-[620px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-xs">
            <div className="flex gap-2">{(['void', 'light', 'grid'] as const).map((value) => <button key={value} onClick={() => setBackground(value)} className={`rounded-full px-3 py-1 ${background === value ? 'bg-white text-black' : 'bg-slate-800 text-zinc-300'}`}>{value}</button>)}</div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={animate} onChange={(event) => setAnimate(event.target.checked)} />Animate</label>
          </div>
          <div className={`relative flex min-h-[570px] items-center justify-center overflow-hidden ${background === 'light' ? 'bg-zinc-100' : background === 'grid' ? 'bg-[#08101d] bg-[linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] bg-[size:28px_28px]' : 'bg-[radial-gradient(circle_at_center,#132945_0%,#050814_58%,#010207_100%)]'}`}>
            <PetBodyRenderer spec={spec} animate={animate} className="h-auto w-full max-w-[720px]" />
            <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60">DNA disconnected · manual phenotype</div>
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
          <div className="grid grid-cols-2 gap-2"><button onClick={copyJson} className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:border-cyan-400">{copied ? 'Copied' : 'Copy JSON'}</button><button onClick={exportJson} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950">Export preset</button></div>
        </aside>
      </div>
    </main>
  );
}
