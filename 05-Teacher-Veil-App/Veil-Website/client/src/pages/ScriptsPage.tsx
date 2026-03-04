import DocLayout from "@/components/layout/DocLayout";
import { getDoc } from "@/content/curriculum";
import { Link } from "wouter";
import { ArrowRight, Clock, Mic } from "lucide-react";
import { useState } from "react";

const doc = getDoc("scripts")!;

const SCRIPTS: { sessionId: number; title: string; script: string[] }[] = [
  {
    sessionId: 1,
    title: "Session 1 — Onboarding + Values Framing",
    script: [
      "Opening: 'Today we're meeting a new kind of digital companion — a Meta-Pet. Before we touch anything, let's just watch.'",
      "Observation: 'I'm going to check on my pet. First, I look at all four vitals: Nutrition, Hydration, Rest, Stimulation. Right now, my pet is feeling [state]. Can you see why?'",
      "Action model: 'I'm going to [feed/rest/hydrate] my pet. Watch what happens to the vital. Now watch the mood.'",
      "After action: 'Did you see that? [Vital] went up. The mood changed to [state]. That's cause and effect. That's a system responding.'",
      "Values link: 'We checked before we acted. That's Respect — gentle, thoughtful interaction with a living system, even a digital one.'",
      "For We Do: 'Now it's your turn. Before you do anything — just look. What's your pet's mood? Which vital looks lowest? Tell your partner.'",
      "Circulate prompt: 'What did you decide to do? Why did you choose that? What changed?'",
      "Wrap-up: 'Each of your pets has different DNA, so they might respond slightly differently. That's okay — that's what makes them individual.'",
    ],
  },
  {
    sessionId: 2,
    title: "Session 2 — First Full Care Loop",
    script: [
      "Opening: 'Yesterday we noticed patterns. Today we're going to observe more carefully — like scientists.'",
      "Systematic scan: 'I'm going to check every vital in order. Nutrition... Hydration... Rest... Stimulation. Now I understand the whole system before I act.'",
      "Interaction note: 'Notice I didn't just fix the lowest vital. I checked them all first. That's systematic thinking. That's Excellence.'",
      "Partner work: 'Work with your partner. One person cares for the pet. The other person is the recorder — write down what vital changed and what the mood did.'",
      "Class share prompt: 'Who noticed something unexpected? Who had a prediction that was right? Who had a prediction that was wrong — and what did that teach you?'",
      "Values debrief: 'This is Cooperation — your partner saw something you might have missed. Science works better with more than one observer.'",
      "Goal-setting: 'For the last five minutes — set yourself one goal. Either: keep the mood stable for five actions. Or: bring one vital back to green. Go.'",
    ],
  },
  {
    sessionId: 3,
    title: "Session 3 — Emotional State Awareness",
    script: [
      "Opening: 'Today we're going to look at something a bit different — the emotions inside the system.'",
      "Mood display: 'My pet is showing [mood]. I wonder what it needs. When I feel [mood], I usually need [rest/space/activity]. Let's see if the system works the same way.'",
      "Gentle invitation: 'I want to try something. When your pet shows Overwhelmed or Anxious — what do you reach for first? Don't overthink it. Just observe.'",
      "Class chart: 'Let's build a list together. What moods has anyone seen? Call them out. [Record on whiteboard.]'",
      "Values link: 'We're practising Resilience right now — noticing feelings and choosing how to respond. That's not easy. Your Meta-Pet is helping you practise.'",
      "Self-connection (gentle): 'Here's an optional prompt — you don't have to share this out loud. When my pet feels [mood], it helps to ___. When I feel [mood], it might help to ___ too.'",
      "Normalise no-response: 'Some of you might think 'that doesn't apply to me' — and that's completely fine. Just notice your pet. That's enough.'",
    ],
  },
  {
    sessionId: 4,
    title: "Session 4 — Responsibility + Repair",
    script: [
      "Opening: 'Something's happened to my pet. I didn't check it for a while. Rest has dropped to critical. Mood is Exhausted. Here's the thing — this isn't a disaster. It's data.'",
      "Reframe: 'In this system, there is no punishment. There is only cause and effect. My pet's vitals dropped because I didn't attend to them. Now I repair. That's the whole lesson.'",
      "Repair narration: 'I'm going to focus on Rest first. Watch. Now Hydration. Now watch the mood. See how the system responds? It doesn't hold a grudge.'",
      "Challenge setup: 'Your turn. Let one vital drop to orange or red — on purpose. Then repair it using the fewest actions you can. Tell your partner your strategy before you start.'",
      "Strategy share: 'Who did it in three actions? Four? What was your order? Why did you start with [vital] instead of [vital]?'",
      "Values debrief: 'You just practised Resilience — the ability to recover from difficulty without catastrophising. You also practised Respect — careful, sequenced repair.'",
      "Life link (optional): 'If it feels useful — what in your school life sometimes needs a repair sequence? You don't have to share that out loud.'",
    ],
  },
  {
    sessionId: 5,
    title: "Session 5 — STEM: Homeostasis",
    script: [
      "Opening: 'Today I'm going to introduce a word that scientists use. Homeostasis. [Write on board.] It means a system trying to stay balanced. Your body does it. The Meta-Pet does it. Most living systems do.'",
      "Framework: 'Here's the model. [Draw on board.] Input — that's your action. System — that's the vitals and mood. Output — that's the new state. Every time you interact with your pet, you're running this loop.'",
      "Feedback loop: 'And when the output tells you what to do next — that's a feedback signal. Your pet just gave you data. You respond to the data. That's a feedback loop.'",
      "Class data: 'Let's collect some class data. Call out: I did ___, vital ___ changed, mood became ___. [Record on whiteboard chart.]'",
      "Pattern observation: 'Look at our data. What patterns do we see? Multiple people noticed [pattern]. Why might that be?'",
      "Genetics note: 'Some of you might have different results. That's not a mistake — that's genetics. Each pet's DNA shapes how it responds. Your pet is genetically unique.'",
      "Hypothesis: 'Before we finish — write down your hypothesis. If I want my pet to feel [mood], I predict I need to focus on [vital]. We'll test that next session.'",
    ],
  },
  {
    sessionId: 6,
    title: "Session 6 — STEM: Data Literacy",
    script: [
      "Opening: 'Last session you made a hypothesis. Today we're testing it. That's science.'",
      "Data review: 'Look at your notes from the past five sessions. You have data. Real data. What patterns do you see across multiple observations?'",
      "Partner task: 'Tell your partner: one thing that worked consistently for your pet. Not just once — consistently. That's a trend.'",
      "Class synthesis: 'Who noticed that [pattern]? Who noticed something different? Why might that be different? [DNA, different care strategies, different starting states.]'",
      "Multi-variable moment: 'Here's something important. Sometimes one action isn't enough. Sometimes you need to address two or three vitals. That's called multi-variable thinking. Real systems are complex.'",
      "STEM label: 'What you just did is data literacy. You collected observations. You found patterns. You compared data across individuals. You explained variation. That is scientific thinking.'",
      "Showcase prep: 'Next session is your showcase. Start thinking: what's the most interesting thing you discovered about your pet's system? What surprised you?'",
    ],
  },
  {
    sessionId: 7,
    title: "Session 7 — Student Showcase + Metacognition",
    script: [
      "Opening: 'Today is about sharing what you know. Not what you memorised — what you actually discovered. These are different things.'",
      "Model showcase: 'I'll go first. My pet responds most reliably to [vital] + [vital]. I know this because I tested it across multiple sessions. What surprised me was [insight]. Here's what I'd do differently: [reflection].'",
      "Partner presentations: 'You have two minutes to explain your pet's system to your partner. They'll ask one question. Then swap. Go.'",
      "Whole-class share: 'Who wants to share one insight — one thing they genuinely discovered? Not what I told you. Something you found out yourself.'",
      "Metacognition: 'Here's my last question for you — and it's a hard one. What did you learn about how YOU learn? Did you learn faster alone or with a partner? Did you learn more from mistakes or from successes?'",
      "Systems transfer: 'The Meta-Pet is a simple system. But you've been learning how systems work. Those skills — observation, hypothesis, repair, data — they work on more complicated systems too. Your friendships. Your classroom. Your body.'",
      "Close: 'Thank you for being careful observers. That's the hardest and most important thing in science.'",
    ],
  },
];

export default function ScriptsPage() {
  const [activeSession, setActiveSession] = useState<number | null>(null);

  return (
    <DocLayout sections={doc.sections} sidebarTitle="Scripts">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 03</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        {/* How to use */}
        <section id="how-to-use" className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-primary">How to use these scripts</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>→ These are <strong className="text-foreground">starting points</strong>, not scripts to read verbatim. Adapt to your voice.</li>
            <li>→ Text in <strong className="text-foreground">[brackets]</strong> is an instruction or fill-in, not teacher speech.</li>
            <li>→ Values language (Respect, Resilience etc.) is intentional — use KPPS vocabulary exactly.</li>
            <li>→ Each session assumes students have used the app before — no need to re-explain basics.</li>
          </ul>
        </section>

        {/* Session scripts */}
        <div className="space-y-4">
          {SCRIPTS.map((s) => (
            <div key={s.sessionId} id={`session-${s.sessionId}-script`} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveSession(activeSession === s.sessionId ? null : s.sessionId)}
                className="w-full flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {s.sessionId}
                </div>
                <span className="font-semibold text-primary flex-1">{s.title}</span>
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>

              {activeSession === s.sessionId && (
                <div className="border-t border-border p-4 space-y-3 bg-background">
                  {s.script.map((line, i) => {
                    const isInstruction = line.match(/^\[/) || line.includes('[') || line.startsWith('Circulate') || line.startsWith('Opening:') || line.startsWith('After') || line.startsWith('Values') || line.startsWith('For We') || line.startsWith('Wrap-up') || line.startsWith('Challenge') || line.startsWith('Partner') || line.startsWith('Class') || line.startsWith('Strategy') || line.startsWith('Goal') || line.startsWith('Feedback') || line.startsWith('Reframe') || line.startsWith('Repair') || line.startsWith('Framework') || line.startsWith('Genetics') || line.startsWith('Hypothesis') || line.startsWith('Data') || line.startsWith('STEM') || line.startsWith('Showcase') || line.startsWith('Metacognition') || line.startsWith('Systems') || line.startsWith('Close') || line.startsWith('Life link') || line.startsWith('Systematic') || line.startsWith('Interaction') || line.startsWith('Pattern') || line.startsWith('Multi') || line.startsWith('Gentle') || line.startsWith('Self') || line.startsWith('Normalise') || line.startsWith('Mood') || line.startsWith('Whole') || line.startsWith('Observation') || line.startsWith('Action') || line.startsWith('Repair nar');

                    const parts = line.split(/^([^:]+: )/);
                    const label = parts.length > 1 ? line.split(': ')[0] : null;
                    const text = label ? line.slice(label.length + 2) : line;

                    return (
                      <div key={i} className="space-y-0.5">
                        {label && (
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                        )}
                        <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3 italic">
                          "{text}"
                        </p>
                      </div>
                    );
                  })}
                  <div className="pt-2">
                    <Link href={`/sessions/${s.sessionId}`}>
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        Full session plan <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DocLayout>
  );
}
