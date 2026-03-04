import DocLayout from "@/components/layout/DocLayout";
import { getDoc, SESSION_DATA } from "@/content/curriculum";
import { Link } from "wouter";
import { ArrowRight, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const doc = getDoc("implementation")!;

interface SessionPanelProps {
  sessionId: number;
  title: string;
  focus: string;
  values: string;
}

function SessionPanel({ sessionId, title, focus, values }: SessionPanelProps) {
  const [open, setOpen] = useState(false);

  const sessionContent: Record<number, { ido: string; wedo: string; youdo: string; note: string }> = {
    1: {
      ido: "Display Meta-Pet on screen. Narrate one complete care loop: 'I'm checking the four vitals — Nutrition, Hydration, Rest, Stimulation. My pet's mood is Calm because all vitals are balanced. That's homeostasis.' Demonstrate ONE action. Values link: Respect — gentle, thoughtful interaction.",
      wedo: "Students open their Meta-Pet (individual devices or pairs). Teacher circulates: 'What's your pet's current mood? Which vital is lowest? What action makes sense?' Whole-class check-in on mood changes. Values link: Responsibility — observing before acting.",
      youdo: "Students complete ONE care cycle independently. Quick written prompt: 'My pet's mood was ___. I chose to ___. The mood became ___.' Exit ticket: one thing noticed about cause and effect.",
      note: "Don't explain the full genome system yet — keep it observable, not abstract. If students ask 'what's the best action?', redirect: 'What does your pet's state tell you?'"
    },
    2: {
      ido: "Model complete vital scan: 'I'm going to check all four vitals systematically.' Show how vitals interact: 'If Rest is low, the pet might not respond well to high Stimulation. Systems balance.' Values link: Excellence — not rushing, being thorough.",
      wedo: "Students work in pairs: one operates, one records. Task: complete three care actions, record which vital changed and what happened to mood. Teacher models observation language. Values link: Cooperation — helping each other see what we might miss alone.",
      youdo: "Each student sets a small goal: 'Keep mood stable' OR 'Bring one vital back to green'. Record outcome: 'I achieved / didn't achieve my goal because ___.'",
      note: "Introduce the idea that 'optimal care' isn't just maxing all vitals — it's reading the system. Celebrate students who notice patterns."
    },
    3: {
      ido: "Display pet in specific mood (e.g., Overwhelmed, Content, Restless). Think-aloud: 'My pet is Overwhelmed. In my life, when I feel overwhelmed, I need... Rest? Space? Let's see if the pet system works the same way.' Values link: Resilience — recognising feelings and choosing recovery strategies.",
      wedo: "Create class chart: 'What moods has your Meta-Pet shown?' Students call out states, teacher records. Pair-share: 'Pick one mood. What action helped your pet move out of that state?' Values link: Community — we learn from each other's observations.",
      youdo: "Written prompt: 'When my pet feels ___, I try ___. When I feel ___, I could try ___.' Optional share-out (no pressure).",
      note: "Keep language gentle — this isn't therapy, it's systems observation. Some students will resist the self-reflection link; that's fine. If a student shares something concerning, follow usual wellbeing protocols."
    },
    4: {
      ido: "Deliberately let one vital drop to red: 'I've been busy and forgot to check my pet. Now Rest is critical.' Narrate recovery: 'This isn't punishment. It's cause and effect. I'll focus on Rest first, then rebalance.' Values link: Respect + Resilience — repair without blame.",
      wedo: "Students intentionally let one vital drop (controlled scenario). Task: 'Bring your pet back to Calm using the fewest actions possible.' Class discussion: 'What order did you do actions in? Why?' Values link: Cooperation — troubleshooting together.",
      youdo: "Prompt: 'If something goes wrong with my Meta-Pet, I can ___.' Connect to real life (optional): 'If I make a mistake at school, I can ___.'",
      note: "Frame 'letting vitals drop' as a learning experiment, not neglect. Emphasise sequencing. Some students will find this stressful — offer choice to observe instead."
    },
    5: {
      ido: "Introduce homeostasis: 'The Meta-Pet is like your body — it tries to stay balanced. That's called homeostasis.' Show diagram: Input (action) → System (vitals + mood) → Output (behaviour/state). Model one feedback loop. STEM link: explicitly name this as systems thinking.",
      wedo: "Create class data chart. Students call out: 'I did ___ → vital ___ changed → mood became ___.' Teacher records patterns. Introduce genetics briefly: 'Each pet's DNA is slightly different, so patterns won't be identical.'",
      youdo: "Prompt: 'If I want my pet to feel ___, I predict I need to focus on ___ vital(s).' Test it next session — record whether hypothesis was accurate.",
      note: "This is where STEM vocabulary becomes explicit — use it confidently. Don't over-explain genetics yet. Frame this as 'science in action' — observation, prediction, testing."
    },
    6: {
      ido: "Review class chart from Session 5. Highlight patterns: 'We saw that Nutrition alone doesn't fix Melancholy — it needs Rest too. That's multi-variable thinking.' Introduce simple data language: 'If we track actions over time, we see trends, not just random events.'",
      wedo: "Students review their own reflection notes from Sessions 1–5. Pair task: 'Find one pattern in your care actions. What worked consistently?' Class share. STEM link: 'This is data literacy — making predictions from evidence.'",
      youdo: "Prompt: 'My Meta-Pet's system works like this: ___.' Optional diagram: students draw their own Input → System → Output map.",
      note: "Celebrate students who notice genetic variation. This session sets up the showcase — students should start thinking about what they'll explain."
    },
    7: {
      ido: "Model a showcase explanation: 'My Meta-Pet responds to Hydration + Rest most reliably. I learned this by testing my hypothesis over three sessions. The pattern held even when other vitals changed.'",
      wedo: "Students present their pet's system to a partner: 'My pet usually feels ___ when ___. I learned that ___.' Partners ask one clarifying question. Metacognition prompt: 'What surprised you about how you learned this?'",
      youdo: "Written reflection: 'One thing I now understand about systems that I didn't at the start: ___.' Students choose their best reflection card from the past 7 sessions — share one insight with the class.",
      note: "Celebrate effort and observation quality, not 'correct' answers. Some students may want to continue the pilot — note this as engagement evidence. Teacher debrief: what worked, what needs adjustment."
    },
  };

  const content = sessionContent[sessionId];

  return (
    <div id={`session-${sessionId}`} className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          {sessionId}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{focus}</p>
        </div>
        <div className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium mr-2 hidden sm:block">
          {values} focus
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && content && (
        <div className="border-t border-border p-5 space-y-4 bg-background">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { phase: "I Do", time: "5 min", color: "bg-primary/5 border-primary/20", text: content.ido },
              { phase: "We Do", time: "10 min", color: "bg-accent/5 border-accent/20", text: content.wedo },
              { phase: "You Do", time: "5 min", color: "bg-amber-50 border-amber-200", text: content.youdo },
            ].map((phase) => (
              <div key={phase.phase} className={`p-4 rounded-lg border ${phase.color} space-y-2`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{phase.phase}</span>
                  <span className="text-xs text-muted-foreground">({phase.time})</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{phase.text}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Teacher Notes</p>
            <p className="text-sm text-muted-foreground">{content.note}</p>
          </div>

          <div className="flex gap-2">
            <Link href={`/sessions/${sessionId}`}>
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                Full session detail <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
            <Link href="/scripts">
              <button className="text-xs text-primary hover:underline flex items-center gap-1 ml-4">
                Facilitation script <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImplementationPage() {
  return (
    <DocLayout sections={doc.sections} sidebarTitle="Sessions">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 02</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
          {[
            { label: "Duration", value: "2 weeks" },
            { label: "Sessions", value: "7 × 20 minutes" },
            { label: "Model", value: "I Do / We Do / You Do" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sessions */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">Session Plans</h2>
          <p className="text-muted-foreground text-sm">
            Click any session to expand the full I Do / We Do / You Do breakdown.
            Values language is highlighted in each phase.
          </p>
          {SESSION_DATA.map((s) => (
            <SessionPanel
              key={s.id}
              sessionId={s.id}
              title={s.title}
              focus={s.focus}
              values={s.values}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 border-t border-border pt-6">
          <Link href="/scripts">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-sm font-medium text-primary">
              <ArrowRight className="w-4 h-4" />
              Facilitation Scripts (exact teacher dialogue)
            </div>
          </Link>
          <Link href="/reflection-prompts">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowRight className="w-4 h-4" />
              Reflection Prompts (25 student cards)
            </div>
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}
