"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePetRegistryStore } from "@/lib/registry";
import { drawSticker, EXPRESSIONS, FORMS, loadPortraits, type Expression, type Portraits } from "@/lib/expressions/studio";
import type { PetForm } from "@/lib/petForms";

const labels: Record<PetForm,string> = {auralia:"Auralia",evolved:"Evolved",geometry:"Geometry"};
const packs = ["All","Everyday","Feelings","Funny","Learning","Celebration","Cosmic"];
export default function ExpressionStudio() {
  const petId = usePetRegistryStore(s => s.activeRecord?.petId);
  const [form,setForm] = useState<PetForm>("auralia");
  const [pack,setPack] = useState("All");
  const [selected,setSelected] = useState<Expression>(EXPRESSIONS[4]);
  const [search,setSearch] = useState("");
  const [caption,setCaption] = useState(true);
  const [transparent,setTransparent] = useState(true);
  const [portraits,setPortraits] = useState<Portraits>({});
  const [error,setError] = useState("");
  const [ready,setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = petId ? loadPortraits(petId) : {};
      setPortraits(saved);
      setForm(FORMS.find(f => saved[f]) ?? "auralia");
    });
    return () => cancelAnimationFrame(frame);
  },[petId]);
  const png = portraits[form];
  useEffect(() => {
    let active = true;
    const target = canvas.current;
    const scratch = document.createElement("canvas");
    const frame = requestAnimationFrame(() => {
      setReady(false);setError("");
      target?.getContext("2d")?.clearRect(0,0,512,512);
      if (!png || !target) return;
      void drawSticker(scratch,png,selected,caption,transparent).then(() => {
        if (!active) return;
        target.getContext("2d")?.drawImage(scratch,0,0);
        setReady(true);
      }).catch(() => {if(active) setError("Could not render this sticker. Capture your pet again.");});
    });
    return () => {active=false;cancelAnimationFrame(frame);};
  },[png,selected,caption,transparent]);
  function download() {
    if (!ready || !canvas.current) return;
    canvas.current.toBlob(blob => {
      if (!blob) {setError("Could not export this sticker.");return;}
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href=url;link.download="metapet-"+form+"-"+selected[0]+".png";link.click();
      window.setTimeout(() => URL.revokeObjectURL(url),1000);
    },"image/png");
  }
  const visible = EXPRESSIONS.filter(e => (pack === "All" || e[2] === pack) && e[1].toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="min-h-screen bg-[#080e20] px-4 pb-28 pt-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#172441] to-[#080e20] p-6 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-amber-300">Blue $nake Studio · Creative tools</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">MetaPet Expressions</h1>
          <p className="mt-3 max-w-xl text-slate-300">Your actual creature. Three forms. A language of its own. Create a sticker locally, without uploading your pet.</p>
          <Link href="/pet" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-amber-300/40 px-4 text-amber-200">Capture a form from My Pet →</Link>
        </header>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-xl font-bold">Sticker Factory</h2>
            <div className="grid grid-cols-3 gap-2">
              {FORMS.map(f => <button key={f} type="button" aria-pressed={f===form} onClick={()=>{if(f!==form){setReady(false);setForm(f);}}} className={"min-h-12 rounded-xl border px-2 text-sm "+(f===form?"border-amber-300 bg-amber-300/10 text-amber-200":"border-slate-700")}>{labels[f]}<span className="block text-xs text-slate-400">{portraits[f]?"Captured":"Not captured"}</span></button>)}
            </div>
            <label className="block text-sm">Search expressions<input value={search} onChange={e=>setSearch(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3" placeholder="Try victory or love"/></label>
            <div className="flex flex-wrap gap-2">{packs.map(p=><button key={p} type="button" aria-pressed={p===pack} onClick={()=>setPack(p)} className={"min-h-11 rounded-full border px-3 text-sm "+(p===pack?"border-amber-300 text-amber-200":"border-slate-700")}>{p}</button>)}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visible.map(e=><button key={e[0]} type="button" aria-pressed={selected[0]===e[0]} onClick={()=>{if(e!==selected){setReady(false);setSelected(e);}}} className={"min-h-20 rounded-xl border p-2 text-sm "+(selected[0]===e[0]?"border-amber-300 bg-amber-300/10":"border-slate-700 bg-slate-950")}><span aria-hidden className="block text-2xl text-amber-200">{e[3]}</span>{e[1]}</button>)}</div>
            {visible.length===0 && <p className="text-sm text-slate-400">No matching expressions.</p>}
          </section>
          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-xl font-bold">Preview · {selected[1]}</h2>
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
              <canvas ref={canvas} width={512} height={512} role="img" aria-label={labels[form]+" "+selected[1]+" sticker"} className="aspect-square w-full"/>
              {!png && <div className="absolute inset-0 grid place-content-center p-6 text-center"><p>Capture your {labels[form]} pet to begin.</p><Link href="/pet" className="mt-3 min-h-11 text-amber-200 underline">Go to My Pet</Link></div>}
            </div>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={caption} onChange={e=>{setReady(false);setCaption(e.target.checked);}}/> Include caption</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={transparent} onChange={e=>{setReady(false);setTransparent(e.target.checked);}}/> Transparent background</label>
            <button type="button" onClick={download} disabled={!ready||!png} className="min-h-12 w-full rounded-xl bg-amber-300 px-4 font-bold text-slate-950 disabled:opacity-40">Download PNG · 512 × 512</button>
            {error && <p role="alert" className="text-rose-300">{error}</p>}
            <p className="text-xs text-slate-400">Portraits stay in this tab's session. Exports contain image pixels only. This first edition composes still portraits; live facial choreography and GIF export are not yet available.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
