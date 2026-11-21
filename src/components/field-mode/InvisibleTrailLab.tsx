"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Footprints,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const CHAPTERS = [
  { label: "Footprint Forest", detail: "What does a click leave behind?" },
  { label: "Permission Gates", detail: "Which access does a game need?" },
  { label: "Mirror Market", detail: "How do recommendations find you?" },
  { label: "Shadow Profile", detail: "Can clues reveal more than a name?" },
  { label: "Data Defender", detail: "Build a privacy-respecting pet." },
] as const;

const TRAILS = [
  { id: "shapes", label: "Play the shape puzzle", record: "Shape puzzle opened" },
  { id: "music", label: "Listen to the rhythm garden", record: "Rhythm garden played" },
  { id: "stars", label: "Explore the star map", record: "Star map explored" },
] as const;

const PERMISSIONS = [
  { id: "microphone", label: "Microphone", detail: "The shape puzzle doesn't listen to voices." },
  { id: "location", label: "Precise location", detail: "A shape puzzle doesn't need a real location." },
  { id: "contacts", label: "Contacts", detail: "The puzzle doesn't need anyone's address book." },
  { id: "local", label: "Optional local save", detail: "Saving progress on this device could be useful, if the player chooses." },
] as const;

const CLUES = [
  { id: "puzzles", label: "Frequently plays puzzles", guess: "They might enjoy problem-solving games." },
  { id: "rhythm", label: "Frequently chooses rhythm levels", guess: "They might be interested in music." },
  { id: "evening", label: "Usually plays at 6 pm", guess: "Someone might guess their daily routine." },
] as const;

const DESIGN = [
  { id: "local", label: "Keep play history on this device", safe: true },
  { id: "sell", label: "Send play history to advertisers", safe: false },
  { id: "delete", label: "Let players erase saved progress", safe: true },
  { id: "name", label: "Require a real name to play", safe: false },
] as const;

function toggle(items: string[], id: string): string[] {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function ToggleChoice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        "flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 " +
        (pressed
          ? "border-emerald-600 bg-emerald-100 text-emerald-950"
          : "border-slate-300 bg-white text-slate-800 hover:border-emerald-600")
      }
    >
      <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border " + (pressed ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-400 bg-white")} aria-hidden="true">
        {pressed ? <Check size={18} /> : null}
      </span>
      {children}
    </button>
  );
}

export function InvisibleTrailLab() {
  const [chapter, setChapter] = useState(0);
  const [trail, setTrail] = useState<string[]>([]);
  const [goggles, setGoggles] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [interest, setInterest] = useState("shapes");
  const [sharing, setSharing] = useState(false);
  const [clues, setClues] = useState<string[]>([]);
  const [design, setDesign] = useState<string[]>(["local", "delete"]);

  const changeChapter = (next: number) => {
    setChapter(Math.max(0, Math.min(CHAPTERS.length - 1, next)));
  };
  const reset = () => {
    setChapter(0);
    setTrail([]);
    setGoggles(false);
    setPermissions([]);
    setInterest("shapes");
    setSharing(false);
    setClues([]);
    setDesign(["local", "delete"]);
  };

  const predictions: Record<string, string> = {
    shapes: "Maybe this player likes puzzles.",
    music: "Maybe this player likes music.",
    stars: "Maybe this player likes astronomy.",
  };
  const designGood = DESIGN.every((item) => design.includes(item.id) === item.safe);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            MetaPet School · Bonus digital-independence lab
          </p>
          <div className="mt-5 grid items-center gap-6 sm:grid-cols-[1fr_180px]">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                THE INVISIBLE TRAIL
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
                Every digital footprint tells a story. Discover who can read it,
                why it matters and how to make your own choices.
              </p>
            </div>
            <svg aria-label="Friendly blue geometric MetaPet" role="img" viewBox="0 0 180 180" className="mx-auto h-40 w-40">
              <defs>
                <linearGradient id="trail-pet" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <polygon points="90,8 157,45 157,124 90,166 23,124 23,45" fill="#0f2c43" stroke="#67e8f9" strokeWidth="4" />
              <polygon points="90,20 143,55 143,114 90,149 37,114 37,55" fill="url(#trail-pet)" opacity=".85" />
              <polygon points="90,20 90,149 37,114 37,55" fill="#1d4ed8" opacity=".22" />
              <circle cx="68" cy="80" r="7" fill="#061a2a" />
              <circle cx="112" cy="80" r="7" fill="#061a2a" />
              <path d="M72 106 Q90 122 108 106" fill="none" stroke="#061a2a" strokeWidth="5" strokeLinecap="round" />
              <path d="M12 151 L24 139 M156 139 L168 151" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-2">Years 3–6</span>
            <span className="rounded-full bg-white/10 px-3 py-2">15 min play + 15 min discussion</span>
            <span className="rounded-full bg-white/10 px-3 py-2">No accounts</span>
            <span className="rounded-full bg-white/10 px-3 py-2">Pretend data only</span>
          </div>
        </header>

        <section aria-label="Activity chapters" className="mt-7">
          <div className="grid grid-cols-5 gap-2">
            {CHAPTERS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => changeChapter(index)}
                aria-label={"Open chapter " + (index + 1) + ": " + item.label}
                aria-current={chapter === index ? "step" : undefined}
                className={
                  "min-h-12 rounded-xl border-2 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 " +
                  (chapter === index
                    ? "border-emerald-800 bg-emerald-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-emerald-700")
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="mission-heading" className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
            Mission {chapter + 1} of {CHAPTERS.length}
          </p>
          <h2 id="mission-heading" className="mt-2 text-3xl font-bold tracking-tight">
            {CHAPTERS[chapter].label}
          </h2>
          <p className="mt-2 text-base text-slate-600">{CHAPTERS[chapter].detail}</p>

          {chapter === 0 ? (
            <div className="mt-6 space-y-5">
              <p className="leading-7 text-slate-700">Choose a few activities for your imaginary pet. Now put on the Privacy Goggles to see what a pretend service could record.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {TRAILS.map((item) => (
                  <ToggleChoice key={item.id} pressed={trail.includes(item.id)} onClick={() => setTrail((old) => toggle(old, item.id))}>
                    {item.label}
                  </ToggleChoice>
                ))}
              </div>
              <button type="button" aria-pressed={goggles} onClick={() => setGoggles((old) => !old)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
                {goggles ? <EyeOff size={19} /> : <Eye size={19} />}
                {goggles ? "Hide the trail" : "Put on Privacy Goggles"}
              </button>
              {goggles ? (
                <div className="rounded-2xl border border-cyan-300 bg-cyan-50 p-5" aria-live="polite">
                  <h3 className="flex items-center gap-2 font-bold"><Footprints size={20} /> Pretend activity log</h3>
                  {trail.length ? (
                    <ul className="mt-3 list-inside list-disc space-y-1 text-slate-800">
                      {TRAILS.filter((item) => trail.includes(item.id)).map((item) => <li key={item.id}>{item.record}</li>)}
                    </ul>
                  ) : <p className="mt-2">Nothing selected yet. Try an activity.</p>}
                  <p className="mt-4 text-sm leading-6">A real app might also record technical connection details. This lesson does not send your selections to an activity server.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {chapter === 1 ? (
            <div className="mt-6 space-y-5">
              <p className="leading-7 text-slate-700">A new shape puzzle asks for access. Tap each thing you would allow. Which requests are unnecessary, and which could be an optional convenience?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PERMISSIONS.map((item) => (
                  <ToggleChoice key={item.id} pressed={permissions.includes(item.id)} onClick={() => setPermissions((old) => toggle(old, item.id))}>
                    {item.label}
                  </ToggleChoice>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-bold">Talk it through</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6">
                  {PERMISSIONS.map((item) => (
                    <li key={item.id}><strong>{item.label}:</strong> {item.detail}</li>
                  ))}
                </ul>
                <p className="mt-4 font-semibold text-amber-950">
                  {permissions.some((id) => id !== "local") ? "Could you play without granting those extra permissions?" : "You can enjoy the puzzle without giving it access to your private information."}
                </p>
              </div>
            </div>
          ) : null}

          {chapter === 2 ? (
            <div className="mt-6 space-y-5">
              <p className="leading-7 text-slate-700">Choose what the pretend pet plays most. See how an advertising system might make a guess, even without a real name.</p>
              <fieldset className="space-y-3">
                <legend className="font-semibold">Pretend favourite activity</legend>
                {[
                  { id: "shapes", label: "Shape puzzles" },
                  { id: "music", label: "Rhythm garden" },
                  { id: "stars", label: "Star maps" },
                ].map((item) => (
                  <label key={item.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <input type="radio" name="imaginary-interest" value={item.id} checked={interest === item.id} onChange={() => setInterest(item.id)} className="h-5 w-5 accent-emerald-700" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </fieldset>
              <ToggleChoice pressed={sharing} onClick={() => setSharing((old) => !old)}>
                Let the pretend game share this activity with an imaginary advertiser
              </ToggleChoice>
              <div className="rounded-2xl bg-slate-900 p-5 text-white" aria-live="polite">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Imaginary recommendation engine</p>
                <p className="mt-3 text-xl font-semibold">{predictions[interest]}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {sharing ? "An imaginary advertiser could receive the activity clue and use this guess to choose an ad." : "The imaginary advertiser receives nothing in this example because sharing is switched off."}
                </p>
                <p className="mt-2 text-sm text-cyan-100">A prediction is only a guess. It can be wrong.</p>
              </div>
            </div>
          ) : null}

          {chapter === 3 ? (
            <div className="mt-6 space-y-5">
              <p className="leading-7 text-slate-700">No real name is needed for clues to suggest a pattern. Reveal the guesses one clue at a time.</p>
              <div className="grid gap-3">
                {CLUES.map((item) => (
                  <ToggleChoice key={item.id} pressed={clues.includes(item.id)} onClick={() => setClues((old) => toggle(old, item.id))}>
                    {item.label}
                  </ToggleChoice>
                ))}
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5" aria-live="polite">
                <h3 className="font-bold">Possible guesses from these clues</h3>
                {clues.length ? (
                  <ul className="mt-3 list-inside list-disc space-y-2">
                    {CLUES.filter((item) => clues.includes(item.id)).map((item) => <li key={item.id}>{item.guess}</li>)}
                  </ul>
                ) : <p className="mt-2">Choose a pretend clue to see a possible guess.</p>}
                <p className="mt-4 text-sm leading-6">Real profiling systems can combine many signals, but guesses are not facts. People should be able to challenge misleading profiles.</p>
              </div>
            </div>
          ) : null}

          {chapter === 4 ? (
            <div className="mt-6 space-y-5">
              <p className="leading-7 text-slate-700">You are the designer now. Select the features your imaginary MetaPet app should have. Can you make it useful without collecting unnecessary information?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DESIGN.map((item) => (
                  <ToggleChoice key={item.id} pressed={design.includes(item.id)} onClick={() => setDesign((old) => toggle(old, item.id))}>
                    {item.label}
                  </ToggleChoice>
                ))}
              </div>
              <div className={"rounded-2xl border p-5 " + (designGood ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50")} aria-live="polite">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  {designGood ? <ShieldCheck size={22} /> : <LockKeyhole size={22} />}
                  {designGood ? "Privacy-first design!" : "Keep investigating"}
                </h3>
                <p className="mt-2 leading-7">
                  {designGood
                    ? "Your pretend pet learns without selling play history, and the player can erase their records. Nice work."
                    : "Think about whether a real name or advertiser sharing helps this pet learn. Can the player erase anything saved?"}
                </p>
                <p className="mt-3 text-sm">A safe service must also protect any data it genuinely needs to use. This is a design exercise, not a security certification.</p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button type="button" disabled={chapter === 0} onClick={() => changeChapter(chapter - 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40">
              <ArrowLeft size={18} /> Previous
            </button>
            {chapter < CHAPTERS.length - 1 ? (
              <button type="button" onClick={() => changeChapter(chapter + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
                Next mission <ArrowRight size={18} />
              </button>
            ) : (
              <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
                <RotateCcw size={18} /> Play again
              </button>
            )}
          </div>
        </section>

        <aside className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8" aria-label="Teacher discussion guide">
          <h2 className="text-2xl font-bold">Teacher guide · Take it offline</h2>
          <p className="leading-7 text-slate-700">
            After 15 minutes of play, ask pairs to draw a fictional data trail on paper.
            Give them a fictional puzzle-app card and three choices: a helpful local record,
            an unnecessary permission, and a third-party data transfer.
          </p>
          <ol className="list-inside list-decimal space-y-2 text-slate-700">
            <li>What information did the pretend app actually need?</li>
            <li>Who could see it if the app shared it with another company?</li>
            <li>Could someone infer something inaccurate from the trail?</li>
            <li>How would you redesign the app to give the child more control?</li>
          </ol>
          <p className="text-sm leading-6 text-slate-600">
            Facilitation note: do not ask students to reveal their actual apps, locations,
            health information, personal experiences or family accounts. Use invented
            examples. No student names, responses or choices are saved by this activity.
            The website host still processes ordinary page requests.
          </p>
          <p className="border-l-4 border-emerald-700 pl-4 font-bold text-emerald-950">
            A clever machine knows what you like. A wiser child knows how it found out.
          </p>
        </aside>
        <nav className="mt-7 flex flex-wrap gap-4 text-sm font-semibold">
          <a href="/schools/field/play" className="text-emerald-800 underline underline-offset-4">Back to student activities</a>
          <a href="/schools/field/lessons" className="text-emerald-800 underline underline-offset-4">Explore the seven lessons</a>
          <a href="/schools/field/safety" className="text-emerald-800 underline underline-offset-4">Safety and privacy</a>
        </nav>
      </div>
    </main>
  );
}
