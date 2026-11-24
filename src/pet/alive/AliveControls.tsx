"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EXPRESSIONS } from "@/lib/expressions/studio";
import { readTake, saveTake, TAKE_LIMIT_MS } from "@/lib/expressions/take";
import { useForgeAudio } from "@/lib/tools/useForgeAudio";
import { useAlive, useAlivePaused } from "./AliveContext";
import { genomeMotif, playBeatPose } from "./music";
import { useLocalTrack } from "./useLocalTrack";
import type { AliveMode } from "./director";

const control = "min-h-11 min-w-11 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:border-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50";
const modes: AliveMode[] = ["playful", "calm", "dance"];

export function AliveControls({ petId }: { petId: string }) {
  const director = useAlive();
  const paused = useAlivePaused();
  const [mode, setMode] = useState<AliveMode>("playful");
  const [expression, setExpression] = useState("happy");
  const [intensity, setIntensity] = useState(1);
  const [ridiculousness, setRidiculousness] = useState(.8);
  const [musicOn, setMusicOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hasTake, setHasTake] = useState(() => Boolean(readTake(petId)));
  const [notice, setNotice] = useState("");
  const recordTimeout = useRef(0);
  const audio = useForgeAudio();
  const track = useLocalTrack();
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => () => clearTimeout(recordTimeout.current), []);

  if (!director) return null;
  const performer = director;
  function tune(nextMode: AliveMode, nextIntensity: number, nextExaggeration: number) {
    setMode(nextMode);
    setIntensity(nextIntensity);
    setRidiculousness(nextExaggeration);
    performer.tune(nextMode, nextIntensity, nextExaggeration);
  }
  function direct(id: string) {
    const accepted = performer.play(id, { source: "directed" });
    setNotice(accepted ? "" : "Your companion is settling. Try in a moment.");
  }
  function finish() {
    clearTimeout(recordTimeout.current);
    setRecording(false);
    const take = performer.finishTake();
    if (!take) { setNotice("Record a touch or expression to make a take."); return; }
    try {
      saveTake(petId, take);
      setHasTake(true);
      setNotice("Performance saved on this device.");
    } catch { setNotice("This browser could not save the performance."); }
  }
  function toggleRecording() {
    if (recording) { finish(); return; }
    performer.startTake();
    setRecording(true);
    setNotice("Recording reactions for up to 12 seconds.");
    recordTimeout.current = window.setTimeout(finish, TAKE_LIMIT_MS);
  }
  function playMusic() {
    if (audio.playing) { audio.stop(); return; }
    track.stop();
    const motif = genomeMotif(performer.seed, performer.personality.energy);
    void audio.play(motif.sequence, motif.tempo, 2, motif.rhythm, beat => playBeatPose(performer, beat))
      .catch(() => setNotice("Audio could not start on this device."));
  }
  return (
    <details className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-amber-100">Creature performance</summary>
      <div className="space-y-3 pb-2 pt-1">
        <div role="group" aria-label="Performance mode" className="flex flex-wrap gap-2">
          {modes.map(item => <button key={item} type="button" aria-pressed={item === mode}
            className={control + (item === mode ? " border-amber-300 bg-amber-300/10" : "")}
            onClick={() => {
              tune(item, intensity, ridiculousness);
              if (!paused) direct(item === "dance" ? "dance" : item === "calm" ? "peace" : "cheeky");
            }}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-0 flex-1 gap-1 text-sm">Expression
            <select className={control + " w-full bg-slate-900"} value={expression} onChange={event => setExpression(event.target.value)}>
              {EXPRESSIONS.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
          <button className={control} type="button" disabled={paused} onClick={() => direct(expression)}>Perform</button>
          <button className={control} type="button" disabled={paused} onClick={() => {
            if (!performer.replay()) setNotice("There is no reaction ready to replay.");
          }}>Replay last reaction</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid text-sm">Animation intensity <span className="sr-only">{intensity}</span>
            <input className="h-11 w-full accent-amber-300" type="range" min=".45" max="1.45" step=".05" value={intensity}
              onChange={event => tune(mode, Number(event.target.value), ridiculousness)} />
          </label>
          <label className="grid text-sm">Ridiculousness <span className="sr-only">{ridiculousness}</span>
            <input className="h-11 w-full accent-amber-300" type="range" min="0" max="1.7" step=".05" value={ridiculousness}
              onChange={event => tune(mode, intensity, Number(event.target.value))} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={control} type="button" aria-pressed={paused} onClick={() => {
            if (!paused) { audio.stop(); track.stop(); }
            performer.setPaused(!paused);
          }}>{paused ? "Resume motion" : "Pause motion"}</button>
          <label className="flex min-h-11 items-center gap-2 px-2 text-sm">
            <input className="size-5 accent-cyan-300" type="checkbox" checked={musicOn} onChange={event => {
              setMusicOn(event.target.checked);
              if (!event.target.checked) { audio.stop(); track.stop(); }
            }} /> Music interaction
          </label>
          {musicOn && <button className={control} type="button" disabled={paused} onClick={playMusic}>
            {audio.playing ? "Stop genome rhythm" : "Play genome rhythm"}
          </button>}
          {musicOn && <label className="grid min-w-0 max-w-full gap-1 text-sm">Local music file
            <input className={control + " max-w-full"} type="file" accept="audio/*" onChange={event => {
              track.stop();
              setFile(event.target.files?.[0] ?? null);
            }} />
          </label>}
          {musicOn && file && <button type="button" className={control} disabled={paused} onClick={() => {
            if (track.playing) { track.stop(); return; }
            audio.stop();
            void track.play(file, beat => playBeatPose(performer, beat)).catch(error => {
              setNotice(error instanceof Error ? error.message : "Audio could not start on this device.");
            });
          }}>{track.playing ? "Stop local track" : "Dance to local track"}</button>}
          <button className={control} type="button" aria-pressed={recording} onClick={toggleRecording}>
            {recording ? "Stop and save recording" : "Record performance"}
          </button>
          <Link className={control} href={hasTake ? "/expressions?take=latest" : "/expressions"}>
            {hasTake ? "Open recorded performance" : "Open Expression Studio"}
          </Link>
        </div>
        {notice && <p role="status" className="text-sm text-slate-300">{notice}</p>}
      </div>
    </details>
  );
}
