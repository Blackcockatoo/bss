import DocLayout from "@/components/layout/DocLayout";
import { getDoc } from "@/content/curriculum";
import { Printer } from "lucide-react";
import { useState } from "react";

const doc = getDoc("reflection-prompts")!;

type CardCategory = "observation" | "wellbeing" | "systems" | "data" | "metacognition" | "values";

interface ReflectionCard {
  num: number;
  title: string;
  category: CardCategory;
  prompts: string[];
  sessions: string;
}

const CATEGORY_META: Record<CardCategory, { label: string; color: string; bg: string; border: string; sessions: string }> = {
  observation: { label: "Observation", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", sessions: "Sessions 1–2" },
  wellbeing:   { label: "Wellbeing", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", sessions: "Sessions 3–4" },
  systems:     { label: "Systems Thinking", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", sessions: "Sessions 5–6" },
  data:        { label: "Data & Evidence", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", sessions: "Sessions 6–7" },
  metacognition: { label: "Metacognition", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", sessions: "Session 7+" },
  values:      { label: "KPPS Values", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", sessions: "Ongoing" },
};

const CARDS: ReflectionCard[] = [
  // Observation
  { num: 1, category: "observation", title: "State Check", sessions: "Sessions 1–2",
    prompts: ["My Meta-Pet's mood right now is ___.", "The vital that is lowest is ___.", "I predict this mood is happening because ___."] },
  { num: 2, category: "observation", title: "Cause + Effect", sessions: "Sessions 1–2",
    prompts: ["I chose to ___.", "The vital that changed was ___.", "The mood became ___.", "One thing I noticed: ___."] },
  { num: 3, category: "observation", title: "Four-Vital Scan", sessions: "Sessions 1–2",
    prompts: ["Nutrition: ___ (colour)", "Hydration: ___ (colour)", "Rest: ___ (colour)", "Stimulation: ___ (colour)", "The mood was ___. This tells me the system needs ___."] },
  { num: 4, category: "observation", title: "Pattern Spotting", sessions: "Sessions 1–2",
    prompts: ["I've noticed that when my Meta-Pet feels ___, it usually means ___ vital is low.", "I tested this by ___, and the result was ___."] },
  // Wellbeing
  { num: 5, category: "wellbeing", title: "Mood Mirror", sessions: "Sessions 3–4",
    prompts: ["My Meta-Pet feels ___ today.", "When I feel ___, I usually need ___.", "I wonder if the Meta-Pet system works the same way."] },
  { num: 6, category: "wellbeing", title: "Recovery Practice", sessions: "Sessions 3–4",
    prompts: ["My Meta-Pet's mood dropped to ___.", "I helped it recover by ___.", "The mood became ___.", "If I need to recover from a hard day, I could try ___."] },
  { num: 7, category: "wellbeing", title: "Care Sequence", sessions: "Sessions 3–4",
    prompts: ["To help my Meta-Pet feel Calm, I did these actions: 1. ___ 2. ___ 3. ___", "The order mattered because ___."] },
  { num: 8, category: "wellbeing", title: "Resilience Reflection", sessions: "Sessions 3–4",
    prompts: ["Something didn't go as planned today.", "What I learned: ___.", "What I'll try differently next time: ___."] },
  // Systems
  { num: 9, category: "systems", title: "Homeostasis Check", sessions: "Sessions 5–6",
    prompts: ["Homeostasis means a system staying balanced.", "My Meta-Pet's system is / isn't in homeostasis right now because ___.", "To restore balance, I need to ___."] },
  { num: 10, category: "systems", title: "Input → System → Output", sessions: "Sessions 5–6",
    prompts: ["Input (my action): ___", "System (what changed): ___", "Output (new mood): ___", "This shows that systems respond to ___."] },
  { num: 11, category: "systems", title: "Feedback Loop", sessions: "Sessions 5–6",
    prompts: ["I gave my Meta-Pet ___.", "The mood became ___.", "That mood is a feedback signal telling me ___.", "My next action will be ___ because of that signal."] },
  { num: 12, category: "systems", title: "Multi-Variable Thinking", sessions: "Sessions 5–6",
    prompts: ["To get my Meta-Pet to feel ___, I had to work on more than one vital.", "The vitals I focused on were ___ and ___.", "This shows that systems need ___, not just one fix."] },
  // Data
  { num: 13, category: "data", title: "Hypothesis Test", sessions: "Sessions 6–7",
    prompts: ["My hypothesis was: If I want my Meta-Pet to feel ___, I need to focus on ___ vital.", "I tested this by ___.", "My hypothesis was correct / incorrect because ___."] },
  { num: 14, category: "data", title: "Pattern Summary", sessions: "Sessions 6–7",
    prompts: ["My pet feels ___ when ___ vital is high.", "My pet feels ___ when ___ vital is low.", "My pet responds best to ___ actions.", "This pattern tells me ___."] },
  { num: 15, category: "data", title: "Genetic Variation", sessions: "Sessions 6–7",
    prompts: ["My Meta-Pet's system is similar to / different from my classmate's because ___.", "One pattern that is the same: ___.", "One pattern that is unique to mine: ___."] },
  { num: 16, category: "data", title: "Data Literacy", sessions: "Sessions 6–7",
    prompts: ["If I only observed my Meta-Pet once, I would think ___.", "But after observing multiple times, I now know ___.", "This shows why data over time is more reliable than one observation."] },
  // Metacognition
  { num: 17, category: "metacognition", title: "Systems Transfer", sessions: "Session 7+",
    prompts: ["I learned that systems need balance (homeostasis).", "One other system I know that works this way: ___", "How they're similar: ___."] },
  { num: 18, category: "metacognition", title: "Strategy Reflection", sessions: "Session 7+",
    prompts: ["One strategy that works well for caring for my Meta-Pet: ___.", "I could use this same strategy in my life when ___.", "Example: ___."] },
  { num: 19, category: "metacognition", title: "Growth Recognition", sessions: "Session 7+",
    prompts: ["At the start, I didn't understand ___.", "Now I understand ___.", "What helped me learn this: ___."] },
  { num: 20, category: "metacognition", title: "Future Application", sessions: "Session 7+",
    prompts: ["If I keep using the Meta-Pet, I want to get better at ___.", "To do that, I'll practise ___.", "I'll know I've improved when ___."] },
  // Values
  { num: 21, category: "values", title: "Respect", sessions: "Ongoing",
    prompts: ["I showed Respect today by observing carefully before acting.", "I didn't button-mash randomly.", "One way I can show Respect in my classroom: ___."] },
  { num: 22, category: "values", title: "Resilience", sessions: "Ongoing",
    prompts: ["My Meta-Pet's mood dropped to ___.", "Instead of giving up, I ___.", "This shows Resilience because ___.", "I can use this same skill when ___."] },
  { num: 23, category: "values", title: "Excellence", sessions: "Ongoing",
    prompts: ["Today I tried to ___.", "I achieved / didn't achieve this goal.", "What I'm proud of: ___.", "What I'll work on next: ___."] },
  { num: 24, category: "values", title: "Cooperation", sessions: "Ongoing",
    prompts: ["I worked with ___ to observe our Meta-Pets.", "Something they noticed that I didn't: ___.", "Something I noticed that helped them: ___.", "Cooperation makes us smarter together."] },
  { num: 25, category: "values", title: "Community", sessions: "Ongoing",
    prompts: ["One thing I learned about systems that I can share with my class: ___.", "One question I still have that someone else might help me answer: ___."] },
];

const categories: CardCategory[] = ["observation", "wellbeing", "systems", "data", "metacognition", "values"];

export default function ReflectionPage() {
  const [activeCategory, setActiveCategory] = useState<CardCategory | "all">("all");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const toggleFlip = (num: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const filtered = activeCategory === "all" ? CARDS : CARDS.filter((c) => c.category === activeCategory);

  return (
    <DocLayout sections={doc.sections} sidebarTitle="Categories">
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 04</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
              <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors text-sm font-medium text-foreground"
            >
              <Printer className="w-4 h-4" />
              Print All Cards
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="no-print flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`text-sm rounded-full px-3 py-1 font-medium border transition-colors ${activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            All 25 cards
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm rounded-full px-3 py-1 font-medium border transition-colors ${activeCategory === cat ? `${meta.bg} ${meta.color} ${meta.border}` : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {meta.label} ({meta.sessions})
              </button>
            );
          })}
        </div>

        {/* Cards grid */}
        <div className="print-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((card) => {
            const meta = CATEGORY_META[card.category];
            const isFlipped = flipped.has(card.num);
            return (
              <div
                key={card.num}
                className={`print-card rounded-xl border ${meta.border} ${meta.bg} p-4 space-y-3 cursor-pointer transition-all hover:shadow-sm`}
                onClick={() => toggleFlip(card.num)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-semibold ${meta.color} uppercase tracking-wide`}>
                      {meta.label}
                    </span>
                    <h3 className={`font-semibold ${meta.color} mt-0.5`}>
                      Card {card.num}: {card.title}
                    </h3>
                  </div>
                  <span className={`text-xs ${meta.color} opacity-60 flex-shrink-0`}>{card.sessions}</span>
                </div>
                <div className={`space-y-1.5 transition-all ${isFlipped ? "" : "line-clamp-3 sm:line-clamp-none"}`}>
                  {card.prompts.map((p, i) => (
                    <p key={i} className={`text-sm ${meta.color} opacity-80 leading-relaxed`}>{p}</p>
                  ))}
                </div>
                <div className={`text-xs ${meta.color} opacity-40 no-print`}>
                  {isFlipped ? "Click to collapse" : "Click to expand"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Teacher notes */}
        <div className="no-print border-t border-border pt-8 space-y-4">
          <h2 className="text-xl font-bold text-primary">Teacher Notes</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Simpler tasks", desc: "Cards 1–8 (observation + wellbeing)" },
              { label: "STEM extension", desc: "Cards 9–16 (systems + data)" },
              { label: "Advanced reflection", desc: "Cards 17–25 (metacognition + values)" },
            ].map((tier) => (
              <div key={tier.label} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-semibold text-foreground mb-1">{tier.label}</p>
                <p className="text-muted-foreground text-xs">{tier.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">No "correct" answers</strong> — these are thinking prompts, not quizzes.
            Affirm observations and reasoning, even if conclusions are still forming.
            Let students pick their own prompt to increase ownership.
          </p>
        </div>
      </div>
    </DocLayout>
  );
}
