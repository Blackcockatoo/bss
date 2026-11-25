"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PetForm } from "@/lib/petForms";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clearTake, saveTake, type PerformanceTake, type PerformanceCue } from "@/lib/expressions/take";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";
import {
  DEFAULT_SETTINGS, EXPRESSIONS, FORMS, PACKS, QUICK_STYLES, SETTINGS_LIMITS, getExpression, parseRecipe,
  type Expression, type Recipe, type Settings,
} from "@/lib/expressions/studio";
import {
  ASPECTS, BACKGROUNDS, DEFAULT_CAPTION, DEFAULT_SCENE, FORM_LABELS, PROPS,
  type Aspect, type Caption, type Scene,
} from "./ExpressionArt";
import { StickerCatalogue } from "./StickerCatalogue";
import { EXPORT_TIME_LIMIT_MS, ExportTimeoutError, MAX_PACK_STICKERS } from "@/lib/expressions/exportPlan";
import { clearThumbnailCache } from "./thumbnailCache";
import { ExpressionPreview } from "./ExpressionPreview";
import { downloadBlob, exportGif, exportPack, exportPng, exportSheet, exportWebp, type Artwork, type Progress } from "./export";
import { clearCreativeData, emptyCreativeData, loadCreativeData, MAX_CAPTION, newPanel, PANEL_COUNTS, saveCreativeData, type CreativeData, type Panel } from "./projects";

const button = "min-h-11 rounded-lg border border-[#536179] px-3 text-sm font-semibold hover:border-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-45";
const primary = button + " border-amber-300 bg-amber-300 text-[#0a1322]";
const input = "min-h-11 w-full min-w-0 rounded-lg border border-[#536179] bg-[#0a1323] px-3 text-sm text-slate-100";
const section = "min-w-0 space-y-4 rounded-xl border border-[#35435c] bg-[#101828] p-3 sm:p-4";
const modes = ["Stickers", "Animation Lab", "Meme Machine", "Comics", "Director", "Export Vault"] as const;
type Mode = typeof modes[number] | "Recording";

const starterTemplates = [
  ["Nobody:", "Absolutely nobody:"], ["Me when…", ""], ["That moment when…", ""],
  ["Expectation:", "Reality:"], ["Before:", "After:"], ["Processing…", ""],
  ["Task failed successfully.", ""], ["Meanwhile, in another dimension…", ""],
] as const;

function selectedStyle(isSelected: boolean) {
  return isSelected ? " border-amber-300 bg-amber-300/10 text-amber-200" : "";
}

function FormOptions() {
  return FORMS.map(form => <option key={form} value={form}>{FORM_LABELS[form]}</option>);
}

function BackgroundOptions() {
  return Object.entries(BACKGROUNDS).map(([value, label]) => <option key={value} value={value}>{label}</option>);
}

function Select({ label, children, value, onChange }: {
  label: string; children: ReactNode; value: string | number; onChange: (value: string) => void;
}) {
  const id = useId();
  return <div className="min-w-0 space-y-1 text-sm">
    <label htmlFor={id} className="block">{label}</label>
    <select id={id} className={input} value={value} onChange={event => onChange(event.target.value)}>{children}</select>
  </div>;
}

function Slider({ label, value, min, max, step = .05, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  return <label className="grid min-h-11 gap-1 text-sm">
    <span className="flex justify-between gap-2">{label}<span className="text-amber-200 tabular-nums">{value === -1 ? "Auto" : Number(value.toFixed(2))}</span></span>
    <input type="range" className="h-7 w-full accent-amber-300"
      value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

function Toggle({ children, checked, onChange }: { children: ReactNode; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex min-h-11 items-center gap-2 text-sm">
    <input type="checkbox" className="size-5 accent-amber-300" checked={checked} onChange={event => onChange(event.target.checked)} />{children}
  </label>;
}

const advancedSettings: [keyof typeof SETTINGS_LIMITS, string][] = [
  ["rotation", "Rotation"], ["translation", "Translation"], ["scale", "Scale"], ["frequency", "Secondary movement frequency"], ["squash", "Squash and stretch"],
  ["phase", "Phase offset"], ["duration", "Duration multiplier"], ["density", "Particle density"],
  ["velocity", "Particle velocity"], ["capture", "PNG capture position"],
];

export function ExpressionStudio({ id, pet, initialForm, initialTake = null }: {
  id: string; pet: CreatureSnapshot; initialForm: PetForm; initialTake?: PerformanceTake | null;
}) {
  const [creative, setCreative] = useState(() => loadCreativeData(id));
  const [mode, setMode] = useState<Mode>(initialTake ? "Recording" : "Stickers");
  const [take, setTake] = useState(initialTake);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState<Expression>(getExpression("happy")!);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [advanced, setAdvanced] = useState(false);
  const [captionOn, setCaptionOn] = useState(false);
  const [thumbEpoch, setThumbEpoch] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubAt, setScrubAt] = useState(.5);
  const [meme, setMeme] = useState<Caption>(creative.meme ?? DEFAULT_CAPTION);
  const [aspect, setAspect] = useState<Aspect>("square");
  const [scene, setScene] = useState<Scene>(DEFAULT_SCENE);
  const [panels, setPanels] = useState<Panel[]>(() => creative.comic.length ? creative.comic :
    [newPanel(initialForm, "hello"), newPanel(initialForm, "happy")]);
  const [activePanel, setActivePanel] = useState(0);
  const [pack, setPack] = useState("All");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(true);
  const [still, setStill] = useState(false);
  const [replay, setReplay] = useState(0);
  const [size, setSize] = useState(512);
  const [packChoice, setPackChoice] = useState<string>(PACKS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [canWebp, setCanWebp] = useState(false);
  const [printUrl, setPrintUrl] = useState<string>();
  const job = useRef<AbortController | null>(null);
  const lastExport = useRef<(() => Promise<void>) | null>(null);
  const preferencesReduce = useReducedMotion();
  const reducedMotion = preferencesReduce || pet.auralia.reduceMotion;
  const panel = panels[activePanel];
  const inRecording = mode === "Recording";
  const inComic = mode === "Comics";
  const inMeme = mode === "Meme Machine";
  const previewExpression = inRecording && take ? getExpression(take.cues[0].expressionId)! : inComic ? getExpression(panel.expressionId)! : selected;
  const previewForm = inComic ? panel.form : form;
  const artwork: Artwork = {
    pet, form: previewForm, expression: previewExpression, settings: inComic ? DEFAULT_SETTINGS : settings,
    scene: inComic ? { ...DEFAULT_SCENE, background: panel.background } : scene,
    caption: inComic ? { ...DEFAULT_CAPTION, bubble: panel.bubble, style: panel.style } :
      inMeme ? meme : { ...DEFAULT_CAPTION, bottom: captionOn ? previewExpression.caption : "" },
    aspect: inMeme ? aspect : "square",
    reducedMotion,
    take: inRecording ? take ?? undefined : undefined,
  };
  const visible = EXPRESSIONS.filter(expression => {
    const term = search.trim().toLowerCase();
    const match = pack === "All" || (pack === "Favourites" ? creative.favorites.includes(expression.id) :
      pack === "Recent" ? creative.recent.includes(expression.id) : expression.category === pack);
    return match && [expression.label, ...expression.tags].join(" ").toLowerCase().includes(term);
  }).sort((a, b) => pack === "Recent" ? creative.recent.indexOf(a.id) - creative.recent.indexOf(b.id) : 0);

  useEffect(() => () => job.current?.abort(), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCanShare(typeof navigator.share === "function" && typeof navigator.canShare === "function");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      setCanWebp(canvas.toDataURL("image/webp").startsWith("data:image/webp;"));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => () => { if (printUrl) URL.revokeObjectURL(printUrl); }, [printUrl]);

  function persist(next: CreativeData) {
    setCreative(next);
    try { saveCreativeData(id, next); }
    catch { setError("This browser could not save the workspace. You can still export your work."); }
  }
  function replayNow() {
    setStill(false);
    setPlaying(true);
    setReplay(value => value + 1);
  }
  function selectExpression(expression: Expression) {
    setSelected(expression);
    if (expression.id !== selected.id && settings.timings) setSettings(old => ({ ...old, timings: undefined }));
    persist({ ...creative, recent: [expression.id, ...creative.recent.filter(item => item !== expression.id)].slice(0, 8) });
    replayNow();
  }
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(old => ({ ...old, [key]: value }));
  }
  function editKeyframe(index: number, value: number) {
    const timings = [...(settings.timings ?? selected.keyframes.map(keyframe => keyframe[0]))];
    timings[index] = value;
    updateSetting("timings", timings);
    setStill(false);
  }
  function changePanel(update: Partial<Panel>) {
    setPanels(panels.map((item, index) => index === activePanel ? { ...item, ...update } : item));
  }
  function movePanel(direction: number) {
    const next = activePanel + direction;
    if (next < 0 || next >= panels.length) return;
    const items = [...panels];
    [items[activePanel], items[next]] = [items[next], items[activePanel]];
    setPanels(items);
    setActivePanel(next);
  }
  function changePanelCount(count: number) {
    setPanels(Array.from({ length: count }, (_, index) => panels[index] ?? newPanel(form, selected.id)));
    setActivePanel(Math.min(activePanel, count - 1));
  }
  const recipe: Recipe = { version: 1, expressionId: selected.id, settings };
  function openRecipe(value: Recipe) {
    setSelected(getExpression(value.expressionId)!);
    setSettings(value.settings);
    setMessage("Recipe opened.");
    replayNow();
  }
  async function importRecipe(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      if (file.size > 4096) throw new Error("Recipe files must be under 4 KB.");
      openRecipe(parseRecipe(await file.text()));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not open this recipe."); }
  }

  function makePack() {
    const ids = packChoice === "Favourites" ? creative.favorites.slice(0, MAX_PACK_STICKERS) :
      EXPRESSIONS.filter(expression => expression.category === packChoice).map(expression => expression.id);
    return ids.flatMap(expressionId => {
      const expression = getExpression(expressionId);
      return expression ? [{ ...artwork, expression, aspect: "square" as const, caption: {
        ...DEFAULT_CAPTION, bottom: captionOn ? expression.caption : "",
      } }] : [];
    });
  }
  function makeComic(): Artwork[] {
    return panels.map(item => ({ ...artwork, aspect: "square", form: item.form, expression: getExpression(item.expressionId)!,
      settings: DEFAULT_SETTINGS, scene: { ...DEFAULT_SCENE, background: item.background },
      caption: { ...DEFAULT_CAPTION, bubble: item.bubble, style: item.style },
    }));
  }
  async function runExport(
    filename: string,
    generate: (signal: AbortSignal, update: Progress) => Promise<Blob>,
    output?: (blob: Blob) => void | Promise<void>,
  ) {
    if (job.current) return;
    const controller = new AbortController();
    job.current = controller;
    lastExport.current = () => runExport(filename, generate, output);
    const limit = window.setTimeout(() => controller.abort(new ExportTimeoutError()), EXPORT_TIME_LIMIT_MS);
    setBusy(true);
    setPrintUrl(undefined);
    setError("");
    setMessage("Preparing export…");
    setProgress({ done: 0, total: 0 });
    try {
      const blob = await generate(controller.signal, (done, total) => setProgress({ done, total }));
      controller.signal.throwIfAborted();
      if (output) await output(blob);
      else downloadBlob(blob, filename);
      setMessage(output ? "Export ready." : "Download ready.");
      lastExport.current = null;
    } catch (failure) {
      const reason = controller.signal.aborted ? controller.signal.reason : failure;
      if (reason instanceof ExportTimeoutError) {
        setMessage("");
        setError(reason.message);
      } else if (controller.signal.aborted || (failure instanceof DOMException && failure.name === "AbortError")) {
        setMessage("Export cancelled.");
        lastExport.current = null;
      } else {
        setMessage("");
        setError(failure instanceof Error ? failure.message : "Could not export. Try again.");
      }
    } finally {
      window.clearTimeout(limit);
      job.current = null;
      setProgress({ done: 0, total: 0 });
      setBusy(false);
    }
  }
  const baseName = `metapet-${previewForm}-${inRecording ? "performance" : previewExpression.id}`;
  const pngName = `${baseName}-${size}.png`;
  const png = (signal: AbortSignal) => exportPng(artwork, size, signal);
  const sharing = (blob: Blob) => {
    const file = new File([blob], pngName, { type: "image/png" });
    if (!navigator.canShare({ files: [file] })) throw new Error("File sharing is unavailable here. Download the PNG instead.");
    return navigator.share({ files: [file] });
  };
  const print = (blob: Blob) => setPrintUrl(URL.createObjectURL(blob));
  const range = (key: keyof typeof SETTINGS_LIMITS, label: string) => (
    <Slider key={key} label={label} value={settings[key]} min={SETTINGS_LIMITS[key][0]} max={SETTINGS_LIMITS[key][1]}
      onChange={value => updateSetting(key, value)} />
  );

  return (
    <>
      <style>{`@media print {
        body:has(> #expressions-print) > :not(#expressions-print) { display:none !important }
        #expressions-print { display:block; margin:0 auto; width:auto; height:auto; max-width:100%; max-height:265mm; object-fit:contain }
        @page { size: A4 portrait; margin: 12mm }
      }`}</style>
      {printUrl && createPortal(
        <img id="expressions-print" className="hidden" src={printUrl} alt="Printable MetaPet artwork" />,
        document.body,
      )}
      <nav aria-label="Creative tools" className="mb-5 flex flex-wrap gap-2">
        {([...(take ? ["Recording" as const] : []), ...modes]).map(item => <button key={item} type="button" className={button + selectedStyle(mode === item)}
          aria-pressed={mode === item} onClick={() => setMode(item)}>{item}</button>)}
      </nav>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="expression-preview" className={section + " lg:sticky lg:top-20"}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="expression-preview" className="text-xl font-bold text-[#fff3d1]">{inRecording ? "Recorded performance" : previewExpression.label}</h2>
            {!inComic && (
              <div aria-label="Creature form" role="group" className="flex flex-wrap gap-1.5">
                {FORMS.map(item => <button type="button" key={item} className={button + selectedStyle(item === form)}
                  aria-pressed={item === form} onClick={() => { setForm(item); replayNow(); }}>{FORM_LABELS[item]}</button>)}
              </div>
            )}
          </div>
          <div className="mx-auto w-full max-w-[450px] overflow-hidden rounded-lg border border-[#43546d] bg-[#0b1424]">
            <ExpressionPreview art={artwork} playing={playing && !busy} replay={replay} still={still || inComic}
              scrub={mode === "Animation Lab" && scrubbing && !reducedMotion ? scrubAt : undefined} feedback={mode === "Animation Lab"} />
          </div>
          {!inComic && (
            <div className="flex flex-wrap gap-2">
              {!reducedMotion && <button className={button} disabled={still} type="button"
                onClick={() => setPlaying(value => !value)}>{playing ? "Pause" : "Play"}</button>}
              {!reducedMotion && <button className={button} type="button" onClick={replayNow}>Replay</button>}
              <button className={button + selectedStyle(still)} type="button" aria-pressed={still} onClick={() => setStill(value => !value)}>PNG pose</button>
              {!inMeme && <Toggle checked={captionOn} onChange={setCaptionOn}>Caption</Toggle>}
            </div>
          )}
          {mode !== "Director" && !inComic && <Select label="Background" value={scene.background}
            onChange={value => setScene({ ...scene, background: value as Scene["background"] })}><BackgroundOptions /></Select>}
          <div className="flex flex-wrap items-end gap-2">
            {!inComic && <>
              <Select label={inMeme ? "PNG short edge" : "PNG size"} value={size} onChange={value => setSize(Number(value))}>
                {[256, 512, 1024].map(value => <option key={value}>{value}</option>)}
              </Select>
              <button type="button" className={primary} disabled={busy} onClick={() => void runExport(pngName, png)}>Download PNG</button>
              {!reducedMotion && <button type="button" className={button} disabled={busy}
                onClick={() => void runExport(baseName + ".gif", (signal, update) => exportGif(artwork, signal, update))}>Download GIF</button>}
              {canWebp && !reducedMotion && (mode === "Export Vault" || inRecording) && <button type="button" className={button} disabled={busy}
                onClick={() => void runExport(baseName + ".webp", (signal, update) => exportWebp(artwork, signal, update))}>Download WebP</button>}
              {canShare && <button type="button" className={button} disabled={busy}
                onClick={() => void runExport(pngName, png, sharing)}>Share PNG</button>}
            </>}
            {busy && <button type="button" className={button} onClick={() => job.current?.abort()}>Cancel export</button>}
          </div>
          {busy && progress.total > 0 && <progress aria-label="Export progress" className="w-full" value={progress.done} max={progress.total} />}
          <p role="status" className="text-sm text-slate-300">{message}{busy && progress.total > 0 && ` ${progress.done}/${progress.total}`}</p>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {error && !busy && lastExport.current && <button type="button" className={button}
            onClick={() => { const retry = lastExport.current; setError(""); void retry?.(); }}>Try export again</button>}
          {printUrl && <button className={button} type="button" onClick={() => window.print()}>Print prepared page</button>}
        </section>
        <section className={section} aria-label={mode}>
          <h2 className="text-xl font-bold text-[#fff3d1]">{mode === "Stickers" ? "Sticker Factory" : mode}</h2>
          {inRecording && take && <>
            <p className="text-sm text-slate-300">Change a cue or its timing, then replay the take or export it from the preview.</p>
            <ol className="space-y-2">
              {take.cues.map((cue, index) => {
                function update(change: Partial<PerformanceCue>) {
                  if (!take) return;
                  setTake({ ...take, cues: take.cues.map((item, i) => i === index ? { ...item, ...change } : item) });
                }
                const min = take.cues[index - 1]?.at ?? 0;
                const max = take.cues[index + 1]?.at ?? 12_000;
                return <li key={index} className="grid gap-2 rounded-lg border border-slate-700 p-2 sm:grid-cols-[2fr_1fr_auto]">
                  <Select label={`Cue ${index + 1}`} value={cue.expressionId} onChange={expressionId => update({ expressionId })}>
                    {EXPRESSIONS.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
                  </Select>
                  <label className="grid gap-1 text-sm">Start (ms)
                    <input className={input} type="number" min={min} max={max} step="1" value={cue.at}
                      onChange={event => update({ at: Math.min(max, Math.max(min, Number(event.target.value || "0"))) })} />
                  </label>
                  <button type="button" className={button + " self-end"} disabled={take.cues.length === 1} aria-label={`Remove cue ${index + 1}`}
                    onClick={() => setTake({ ...take, cues: take.cues.filter((_, i) => i !== index) })}>Remove</button>
                </li>;
              })}
            </ol>
            <button type="button" className={button} onClick={() => {
              try { saveTake(id, { ...take, form }); setMessage("Performance edits saved on this device."); }
              catch { setError("This browser could not save the performance."); }
            }}>Save performance edits</button>
          </>}
          {mode === "Stickers" && <>
            <label className="block space-y-1 text-sm">Search expressions
              <input className={input} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try laugh, victory or sleepy" />
            </label>
            <Select label="Browse pack" value={pack} onChange={setPack}>
              {["All", "Favourites", "Recent", ...PACKS].map(item => <option key={item}>{item}</option>)}
            </Select>
            <button type="button" className={button + selectedStyle(creative.favorites.includes(selected.id))}
              aria-pressed={creative.favorites.includes(selected.id)}
              onClick={() => persist({ ...creative, favorites: creative.favorites.includes(selected.id) ?
                creative.favorites.filter(item => item !== selected.id) : [...creative.favorites, selected.id] })}>
              {creative.favorites.includes(selected.id) ? "Remove favourite" : "Favourite this expression"}
            </button>
            <StickerCatalogue key={form} form={form} pet={pet} visible={visible} selected={selected.id}
              buttonClass={button} onSelect={selectExpression} busy={busy} epoch={thumbEpoch} />
            {visible.length === 0 && <p className="text-sm text-slate-300">No matching expressions.</p>}
            <button type="button" className={button} disabled={busy} onClick={() => void clearThumbnailCache().then(ok => {
              setThumbEpoch(value => value + 1);
              if (ok) setMessage("Thumbnail cache cleared. Thumbnails will redraw from your creature.");
              else setError("This browser could not clear the thumbnail cache.");
            })}>Clear thumbnail cache</button>
          </>}
          {(mode === "Animation Lab" || inMeme || mode === "Director") &&
            <Select label="Expression" value={selected.id} onChange={value => selectExpression(getExpression(value)!)}>
              {EXPRESSIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>}
          {mode === "Animation Lab" && <>
            <div role="group" aria-label="Quick styles" className="flex flex-wrap gap-2">
              {Object.entries(QUICK_STYLES).map(([name, preset]) => <button key={name} type="button" className={button}
                onClick={() => { setSettings({ ...DEFAULT_SETTINGS, variation: settings.variation, ...preset }); replayNow(); setMessage(`${name} style applied.`); }}>{name}</button>)}
              <button type="button" className={button} onClick={() => { setSettings({ ...DEFAULT_SETTINGS }); replayNow(); setMessage("Controls reset."); }}>Reset controls</button>
            </div>
            {!reducedMotion && <div className="grid gap-2">
              <Toggle checked={scrubbing} onChange={value => { setScrubbing(value); if (!value) replayNow(); }}>Scrub timeline</Toggle>
              {scrubbing && <Slider label="Playhead" value={scrubAt} min={0} max={1} step={.01} onChange={setScrubAt} />}
            </div>}
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-sm">Variation
                <input className={input + " w-28"} type="number" inputMode="numeric" min={0} max={999} step={1} value={settings.variation}
                  onChange={event => {
                    const value = Math.round(Number(event.target.value));
                    if (Number.isFinite(value)) updateSetting("variation", Math.min(999, Math.max(0, value)));
                  }} />
              </label>
              <button type="button" className={button} disabled={settings.variation <= 0}
                onClick={() => updateSetting("variation", settings.variation - 1)}>Previous variation</button>
              <button type="button" className={button} disabled={settings.variation >= 999}
                onClick={() => updateSetting("variation", settings.variation + 1)}>Next variation</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {range("speed", "Speed")}{range("energy", "Energy")}{range("amplitude", "Movement intensity")}{range("aura", "Aura strength")}{range("ridiculousness", "Ridiculousness")}
            </div>
            <button type="button" className={button} aria-expanded={advanced} onClick={() => setAdvanced(value => !value)}>Advanced controls</button>
            {advanced && <div className="grid gap-3 sm:grid-cols-2">
              {advancedSettings.map(([key, label]) => range(key, label))}
              <Select label="Easing" value={settings.easing} onChange={value => updateSetting("easing", value as Settings["easing"])}>
                <option value="smooth">Smooth</option><option value="linear">Linear</option><option value="spring">Spring</option>
              </Select>
              <Toggle checked={settings.loop} onChange={value => updateSetting("loop", value)}>Loop</Toggle>
              <details className="space-y-3 sm:col-span-2">
                <summary className="min-h-11 cursor-pointer py-2">Keyframe timing</summary>
                {selected.keyframes.slice(1, -1).map((_, i) => {
                  const at = (index: number) => settings.timings?.[index] ?? selected.keyframes[index][0];
                  const index = i + 1;
                  return <Slider key={index} label={`Keyframe ${index}`} value={at(index)}
                    min={Number((at(index - 1) + .04).toFixed(2))} max={Number((at(index + 1) - .04).toFixed(2))}
                    step={.01} onChange={value => editKeyframe(index, value)} />;
                })}
                <button type="button" className={button} onClick={() => updateSetting("timings", undefined)}>Reset keyframes</button>
              </details>
            </div>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => { persist({ ...creative, recipe }); setMessage("Recipe saved on this device."); }}>Save recipe</button>
              <button type="button" className={button} disabled={!creative.recipe} onClick={() => { if (creative.recipe) openRecipe(creative.recipe); }}>Open saved recipe</button>
              <button type="button" className={button} onClick={() => downloadBlob(new Blob([JSON.stringify(recipe)], { type: "application/json" }), "metapet-recipe.json")}>Export recipe</button>
              <label className="block w-full text-sm">Import recipe<input className={input + " py-2"} type="file" accept=".json,application/json" onChange={event => void importRecipe(event)} /></label>
            </div>
          </>}
          {inMeme && <>
            <Select label="Template" value="" onChange={value => {
              if (!value) return;
              const [top, bottom] = starterTemplates[Number(value)];
              setMeme({ ...meme, top, bottom });
            }}>
              <option value="">Choose a starter</option>
              {starterTemplates.map(([top], index) => <option value={index} key={top}>{top}</option>)}
            </Select>
            <Select label="Aspect ratio" value={aspect} onChange={value => setAspect(value as Aspect)}>
              {Object.keys(ASPECTS).map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
            </Select>
            {(["top", "bottom", "bubble"] as const).map(key => (
              <label key={key} className="block space-y-1 text-sm">{key === "bubble" ? "Bubble text" : key === "top" ? "Top caption" : "Bottom caption"}
                <input className={input} maxLength={MAX_CAPTION} value={meme[key]} onChange={event => setMeme({ ...meme, [key]: event.target.value })} />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Select label="Alignment" value={meme.align} onChange={value => setMeme({ ...meme, align: value as Caption["align"] })}>
                <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
              </Select>
              <Select label="Bubble style" value={meme.style} onChange={value => setMeme({ ...meme, style: value as Caption["style"] })}><BubbleOptions /></Select>
            </div>
            <Slider label="Font size" value={meme.size} min={18} max={42} step={1} onChange={value => setMeme({ ...meme, size: value })} />
            <Toggle checked={meme.outline} onChange={value => setMeme({ ...meme, outline: value })}>Text outline</Toggle>
            <button type="button" className={button} onClick={() => { persist({ ...creative, meme }); setMessage("Meme template saved on this device."); }}>Save template</button>
          </>}
          {mode === "Director" && <>
            <Select label="Environment" value={scene.background} onChange={value => setScene({ ...scene, background: value as Scene["background"] })}><BackgroundOptions /></Select>
            <Select label="Scene prop" value={scene.prop} onChange={value => setScene({ ...scene, prop: value as Scene["prop"] })}>
              {Object.entries(PROPS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            {scene.prop !== "none" && <Slider label="Prop position" value={scene.propX} min={-55} max={55} step={1}
              onChange={propX => setScene({ ...scene, propX })} />}
            <Slider label="Stage light" value={scene.light} min={0} max={1} onChange={light => setScene({ ...scene, light })} />
            {range("aura", "Atmosphere")}{range("density", "Particle density")}
          </>}
          {inComic && <>
            <Select label="Number of panels" value={panels.length} onChange={value => changePanelCount(Number(value))}>
              {PANEL_COUNTS.map(count => <option key={count}>{count}</option>)}
            </Select>
            <div className="flex flex-wrap gap-2" aria-label="Comic panels" role="group">
              {panels.map((_, index) => (
                <button type="button" className={button + selectedStyle(activePanel === index)} key={index}
                  aria-pressed={activePanel === index} onClick={() => setActivePanel(index)}>Panel {index + 1}</button>
              ))}
            </div>
            <Select label="Panel form" value={panel.form} onChange={value => changePanel({ form: value as PetForm })}><FormOptions /></Select>
            <Select label="Panel expression" value={panel.expressionId} onChange={value => changePanel({ expressionId: value })}>
              {EXPRESSIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
            <Select label="Panel background" value={panel.background} onChange={value => changePanel({ background: value as Scene["background"] })}><BackgroundOptions /></Select>
            <label className="block space-y-1 text-sm">Panel text<input className={input} maxLength={MAX_CAPTION} value={panel.bubble}
              onChange={event => changePanel({ bubble: event.target.value })} /></label>
            <Select label="Panel text style" value={panel.style} onChange={value => changePanel({ style: value as Caption["style"] })}><BubbleOptions /></Select>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={activePanel === 0} onClick={() => movePanel(-1)}>Move earlier</button>
              <button type="button" className={button} disabled={activePanel === panels.length - 1} onClick={() => movePanel(1)}>Move later</button>
              <button type="button" className={button} onClick={() => { persist({ ...creative, comic: panels }); setMessage("Comic saved on this device."); }}>Save comic</button>
              <button type="button" className={button} disabled={!creative.comic.length} onClick={() => { setPanels(creative.comic); setActivePanel(0); setMessage("Comic opened."); }}>Open saved comic</button>
              <button type="button" className={primary} disabled={busy}
                onClick={() => void runExport("metapet-comic.png", (signal, update) => exportSheet(makeComic(), signal, update, "comic"))}>Download comic</button>
              <button type="button" className={button} disabled={busy}
                onClick={() => void runExport("metapet-comic.png", (signal, update) => exportSheet(makeComic(), signal, update, "comic"), print)}>Prepare print layout</button>
            </div>
          </>}
          {mode === "Export Vault" && <>
            <Select label="Sticker pack" value={packChoice} onChange={setPackChoice}>
              {[...PACKS, "Favourites"].map(item => <option key={item}>{item}</option>)}
            </Select>
            {packChoice === "Favourites" && creative.favorites.length > MAX_PACK_STICKERS &&
              <p className="text-sm text-slate-300">Packs hold up to {MAX_PACK_STICKERS} stickers, so this pack uses your first {MAX_PACK_STICKERS} favourites.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primary} disabled={busy || makePack().length === 0}
                onClick={() => void runExport("metapet-stickers.zip", (signal, update) => exportPack(makePack(), signal, update))}>Download ZIP</button>
              <button type="button" className={button} disabled={busy || makePack().length === 0}
                onClick={() => void runExport("metapet-sticker-sheet.png", (signal, update) => exportSheet(makePack(), signal, update, "stickers"), print)}>Prepare sticker sheet</button>
            </div>
            <button type="button" className={button} disabled={busy} onClick={() => {
              try {
                clearCreativeData(id);
                clearTake(id);
                setTake(null);
                void clearThumbnailCache().then(() => setThumbEpoch(value => value + 1));
                setCreative(emptyCreativeData());
                setPanels([newPanel(form, "hello"), newPanel(form, "happy")]);
                setActivePanel(0);
                setMeme(DEFAULT_CAPTION);
                setPrintUrl(undefined);
                setMessage("Local creative saves cleared.");
              } catch { setError("This browser could not clear the creative saves."); }
            }}>Clear local creative saves</button>
          </>}
        </section>
      </div>
    </>
  );
}

function BubbleOptions() {
  return <><option value="speech">Speech</option><option value="thought">Thought</option><option value="narration">Narration</option></>;
}
