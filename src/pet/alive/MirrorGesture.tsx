"use client";

import { useState } from "react";
import type { Director } from "./director";
import { useFigureEight } from "./useFigureEight";

export function MirrorGesture({ director, controlClass }: { director: Director; controlClass: string }) {
  const [drawing, setDrawing] = useState(false);
  const [status, setStatus] = useState("");
  function mirror() {
    director.clearStageTaps();
    const played = director.play("mirror-eight", { source: "touch", intensity: .68 });
    setStatus(played ? "Your companion echoed the figure eight." : "Figure eight selected. Your companion is resting.");
  }

  const trace = useFigureEight(matched => {
    if (matched) mirror();
    else setStatus("Start in the centre and draw two sideways eights.");
  }, drawing);

  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <button type="button" className={controlClass} onClick={mirror}>Mirror figure eight</button>
      <button type="button" className={controlClass} aria-expanded={drawing} onClick={() => {
        setDrawing(!drawing);
        setStatus("");
      }}>{drawing ? "Close drawing pad" : "Draw a figure eight"}</button>
    </div>
    {drawing && <div className="touch-none select-none min-h-48 rounded-lg border border-slate-700 bg-slate-900 p-4 text-center text-slate-200"
      onPointerDown={event => { setStatus(""); trace.start(event, event.currentTarget); }}
      onPointerMove={trace.move}
      onPointerUp={trace.end}
      onPointerCancel={trace.cancel}
      onLostPointerCapture={trace.cancel}
    >Start in the centre and draw two sideways eights without lifting.</div>}
    <p role="status" className="text-sm text-slate-300">{status}</p>
  </div>;
}
