import DocLayout from "@/components/layout/DocLayout";
import { getSessionData } from "@/content/curriculum";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";

const SESSION_DETAILS: Record<number, {
  learningIntention: string;
  materials: string[];
  phases: { phase: string; time: string; steps: string[]; valuesLink: string }[];
  teacherNotes: string[];
  reflectionCards: number[];
  assessmentFocus: string;
}> = {
  1: {
    learningIntention: "Students understand the Meta-Pet as a 'living system' and connect care routines to KPPS values.",
    materials: ["Individual devices or class display", "Reflection prompt cards 1–4", "Whiteboard for class recording"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Display Meta-Pet on screen (or individual devices)",
          "Narrate one complete care loop, naming all four vitals: Nutrition, Hydration, Rest, Stimulation",
          "Say: 'My pet's mood is Calm because all vitals are balanced. That's homeostasis.'",
          "Demonstrate ONE action and narrate the change: 'Watch what happens to Nutrition... and watch the mood.'",
        ],
        valuesLink: "Respect — gentle, thoughtful interaction. Not random button-mashing.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Students open their Meta-Pet (individual devices or pairs)",
          "Circulate and prompt: 'What's your pet's current mood? Which vital is lowest? What action makes sense?'",
          "Whole-class check-in: 'Hands up if your pet's mood changed after one action. What did you notice?'",
          "Record observations on whiteboard",
        ],
        valuesLink: "Responsibility — observing before acting.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Students complete ONE care cycle independently",
          "Quick written prompt: 'My pet's mood was ___. I chose to ___. The mood became ___.'",
          "Exit ticket: 'One thing I noticed about cause and effect.'",
        ],
        valuesLink: "Independence — applying observation without prompting.",
      },
    ],
    teacherNotes: [
      "Don't explain the full genome system yet — keep it observable, not abstract",
      "If students ask 'what's the best action?', redirect: 'What does your pet's state tell you?'",
      "Mood changes should feel logical, not random — flag any confusion for developer feedback",
      "Pace is forgiving — 20 minutes is enough to run one full cycle with observation time",
    ],
    reflectionCards: [1, 2, 3, 4],
    assessmentFocus: "Can the student name the four vitals? Can they describe one cause-effect relationship?",
  },
  2: {
    learningIntention: "Students learn the four-vital framework and begin pattern recognition.",
    materials: ["Individual devices or pairs setup", "Reflection prompt cards 1–4", "Recording sheet for vital observations"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Model complete vital scan: 'I'm going to check all four vitals systematically: Nutrition first, then Hydration, Rest, Stimulation.'",
          "Show how vitals interact: 'If Rest is low, the pet might not respond well to high Stimulation. Systems balance.'",
          "Demonstrate systematic checking vs random action",
        ],
        valuesLink: "Excellence — not rushing, being thorough.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Students work in pairs: one operates, one records observations",
          "Task: 'Complete three care actions. Record which vital changed and what happened to mood.'",
          "Model observation language: 'I fed it twice. Nutrition went up, but mood stayed Anxious. Why? Let's check Rest...'",
          "Class share-out of patterns noticed",
        ],
        valuesLink: "Cooperation — helping each other see what we might miss alone.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Each student sets a small goal: 'Keep mood stable' OR 'Bring one vital back to green'",
          "Record outcome: 'I achieved / didn't achieve my goal because ___.'",
        ],
        valuesLink: "Responsibility — setting and evaluating your own target.",
      },
    ],
    teacherNotes: [
      "Introduce the idea that 'optimal care' isn't just maxing all vitals — it's reading the system",
      "Celebrate students who notice patterns ('I saw that Anxious means it needs Rest more than Food')",
      "If students get frustrated with 'wrong' actions, reframe: 'That's data. What did you learn?'",
    ],
    reflectionCards: [1, 2, 3, 4],
    assessmentFocus: "Can the student describe a pattern they noticed? Can they adjust their action based on observation?",
  },
  3: {
    learningIntention: "Students connect pet emotions to their own self-regulation strategies.",
    materials: ["Individual devices", "Reflection prompt cards 5–8", "Class emotion chart (whiteboard)"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Display pet in specific mood (e.g., Overwhelmed, Content, Restless)",
          "Think-aloud: 'My pet is Overwhelmed. In my life, when I feel overwhelmed, I need... Rest? Space?'",
          "Demonstrate reflection prompt: 'What helps when you feel ___?'",
          "Make the system-self link visible: 'Let's see if the pet system works the same way.'",
        ],
        valuesLink: "Resilience — recognising feelings and choosing recovery strategies.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Create class chart: 'What moods has your Meta-Pet shown?'",
          "Students call out states, teacher records on whiteboard",
          "Pair-share: 'Pick one mood. What action helped your pet move out of that state?'",
          "Optional bridge: 'Does the same thing work for you when you feel that way?'",
        ],
        valuesLink: "Community — we learn from each other's observations.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Written prompt: 'When my pet feels ___, I try ___. When I feel ___, I could try ___.'",
          "Optional share-out (no pressure)",
        ],
        valuesLink: "Resilience — applying what you notice to your own strategies.",
      },
    ],
    teacherNotes: [
      "Keep language gentle — this isn't therapy, it's systems observation",
      "Some students will resist the self-reflection link; that's fine, keep it optional",
      "If a student shares something concerning, follow usual wellbeing protocols (don't spotlight in class)",
    ],
    reflectionCards: [5, 6, 7, 8],
    assessmentFocus: "Can the student name a pet mood and describe what helped? Can they make a personal connection (even tentatively)?",
  },
  4: {
    learningIntention: "Students practice 'consequence without punishment' — if vitals drop, recovery is a skill, not a failure.",
    materials: ["Individual devices", "Reflection prompt cards 7–9", "Timer for repair challenge"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Deliberately let one vital drop to red: 'I've been busy with other things and forgot to check my pet. Now Rest is critical and mood is Exhausted.'",
          "Narrate recovery: 'This isn't punishment. It's cause and effect. I'll focus on Rest first, then rebalance the others.'",
          "Watch mood shift as system stabilises",
        ],
        valuesLink: "Respect + Resilience — repair without blame.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Students intentionally let one vital drop (controlled scenario — teacher guides which one)",
          "Task: 'Bring your pet back to Calm or Content using the fewest actions possible.'",
          "Class discussion: 'What order did you do actions in? Why?'",
          "Record repair sequences for comparison",
        ],
        valuesLink: "Cooperation — troubleshooting together.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Prompt: 'If something goes wrong with my Meta-Pet, I can ___.'",
          "Connect to real life (optional): 'If I make a mistake at school, I can ___.'",
        ],
        valuesLink: "Resilience — bounce-back as a learnable skill.",
      },
    ],
    teacherNotes: [
      "Frame 'letting vitals drop' as a learning experiment, not neglect",
      "Emphasise sequencing: 'If everything is low, what order helps most?'",
      "Some students will find this stressful — offer choice to observe instead of participate",
    ],
    reflectionCards: [7, 8, 9],
    assessmentFocus: "Can the student describe a repair sequence? Can they explain why the order of actions matters?",
  },
  5: {
    learningIntention: "Students identify the Meta-Pet as a self-regulating system and use STEM vocabulary (homeostasis, inputs, outputs, feedback loops).",
    materials: ["Individual devices", "Reflection prompt cards 9–13", "Class data chart", "STEM vocabulary list"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "'The Meta-Pet is like your body — it tries to stay balanced. That's called homeostasis.'",
          "Show diagram: Input (action) → System (vitals + mood) → Output (behaviour/state)",
          "Model one feedback loop: 'I gave Stimulation. The pet became Joyful. That 'told' me it needed more play. That's a feedback signal.'",
          "Explicitly name: 'This is systems thinking. You're doing STEM right now.'",
        ],
        valuesLink: "Excellence — applying academic vocabulary to real observation.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Create class data chart: students call out cause-effect relationships",
          "Teacher records patterns: 'So multiple people noticed that Rest + Hydration → Calm. Why might that be?'",
          "Introduce genetics briefly: 'Each pet's DNA is slightly different, so patterns won't be identical.'",
        ],
        valuesLink: "Community — class data is more reliable than individual observation.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Prompt: 'If I want my pet to feel ___, I predict I need to focus on ___ vital(s).'",
          "Record hypothesis — test it in Session 6",
        ],
        valuesLink: "Excellence — forming and recording a testable prediction.",
      },
    ],
    teacherNotes: [
      "This is where STEM vocabulary becomes explicit — use it confidently, it's accurate",
      "Don't over-explain genetics yet; just acknowledge variation exists",
      "Frame this as 'science in action' — observation, prediction, testing",
    ],
    reflectionCards: [9, 10, 11, 12, 13],
    assessmentFocus: "Can the student use the word 'homeostasis' accurately? Can they describe a feedback loop?",
  },
  6: {
    learningIntention: "Students analyse their own interaction data and identify patterns in system behaviour.",
    materials: ["Individual devices", "Reflection notes from Sessions 1–5", "Reflection prompt cards 13–16", "Partner discussion structure"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Review class chart from Session 5",
          "Highlight multi-variable patterns: 'We saw that Nutrition alone doesn't fix Melancholy — it needs Rest too. That's multi-variable thinking.'",
          "Introduce data language: 'If we track actions over time, we see trends, not just random events.'",
        ],
        valuesLink: "Excellence — drawing conclusions from evidence.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Students review their own reflection notes from Sessions 1–5",
          "Pair task: 'Find one pattern in your care actions. What worked consistently?'",
          "Class share: 'What patterns did you notice in your Meta-Pet's system?'",
          "Label this explicitly: 'This is data literacy — making predictions from evidence.'",
        ],
        valuesLink: "Cooperation — comparing data to find shared patterns.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Prompt: 'My Meta-Pet's system works like this: ___.'",
          "Optional: students draw their own Input → System → Output diagram",
        ],
        valuesLink: "Independence — synthesising your own learning.",
      },
    ],
    teacherNotes: [
      "Celebrate students who notice genetic variation: 'My friend's pet responds differently — that's DNA.'",
      "This session sets up the showcase (Session 7) — students should start thinking about what they'll explain",
      "Keep data language simple: trends, patterns, cause-effect, not statistical complexity",
    ],
    reflectionCards: [13, 14, 15, 16],
    assessmentFocus: "Can the student identify a reliable pattern from multiple observations? Can they explain why individual variation exists?",
  },
  7: {
    learningIntention: "Students articulate what they learned about systems, wellbeing, and their own thinking.",
    materials: ["Individual devices (optional)", "All previous reflection notes", "Reflection prompt cards 17–25", "Presentation time per student/pair"],
    phases: [
      {
        phase: "I Do", time: "5 min",
        steps: [
          "Model a showcase explanation: 'My Meta-Pet responds to Hydration + Rest most reliably. I learned this by testing my hypothesis over three sessions.'",
          "Show metacognition: 'What surprised me was that it didn't respond to Nutrition the way I expected. That changed how I think about system balance.'",
        ],
        valuesLink: "Excellence — presenting learning with evidence and honesty.",
      },
      {
        phase: "We Do", time: "10 min",
        steps: [
          "Students present their pet's system to a partner (2 min each)",
          "Partners ask one clarifying question",
          "Metacognition prompt: 'What surprised you about how you learned this?'",
          "Optional whole-class share: two or three students share one insight",
        ],
        valuesLink: "Community — sharing learning makes the class smarter.",
      },
      {
        phase: "You Do", time: "5 min",
        steps: [
          "Written reflection: 'One thing I now understand about systems that I didn't at the start: ___.'",
          "Students choose their best reflection card from the past 7 sessions — share one insight with the class (optional)",
        ],
        valuesLink: "Resilience + Community — owning your growth and sharing it.",
      },
    ],
    teacherNotes: [
      "Celebrate effort and observation quality, not 'correct' answers",
      "Some students may want to continue the pilot — note this as engagement evidence",
      "Teacher debrief (after class): what worked, what needs adjustment, what evidence did you collect?",
      "Document: student engagement, wellbeing language used, any parent feedback",
    ],
    reflectionCards: [17, 18, 19, 20, 21, 22, 23, 24, 25],
    assessmentFocus: "Can the student explain a systems concept in their own words? Can they identify one thing they learned about themselves?",
  },
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "1", 10);
  const sessionData = getSessionData(sessionId);
  const detail = SESSION_DETAILS[sessionId];

  if (!sessionData || !detail) {
    return (
      <DocLayout>
        <div className="max-w-xl">
          <p className="text-muted-foreground">Session {id} not found.</p>
          <Link href="/implementation">
            <button className="mt-4 text-primary hover:underline flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Implementation Guide
            </button>
          </Link>
        </div>
      </DocLayout>
    );
  }

  const prevSession = sessionId > 1 ? sessionId - 1 : null;
  const nextSession = sessionId < 7 ? sessionId + 1 : null;

  return (
    <DocLayout
      sections={[
        { id: "intention", label: "Learning Intention" },
        { id: "materials", label: "Materials" },
        { id: "ido", label: "I Do (5 min)" },
        { id: "wedo", label: "We Do (10 min)" },
        { id: "youdo", label: "You Do (5 min)" },
        { id: "notes", label: "Teacher Notes" },
        { id: "assessment", label: "Assessment" },
      ]}
      sidebarTitle="This session"
    >
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/implementation">
            <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Implementation Guide
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {sessionId}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session {sessionId} of 7</p>
              <h1 className="text-3xl font-bold text-primary">{sessionData.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-sm bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
              {sessionData.values} focus
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 20 minutes total
            </span>
          </div>
        </div>

        {/* Learning intention */}
        <section id="intention" className="p-5 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-2">Learning Intention</p>
          <p className="text-lg text-foreground font-medium leading-relaxed">{detail.learningIntention}</p>
        </section>

        {/* Materials */}
        <section id="materials" className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Materials</h2>
          <ul className="space-y-1.5">
            {detail.materials.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                {m}
              </li>
            ))}
          </ul>
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Reflection cards for this session:</strong>{" "}
            {detail.reflectionCards.map((n) => `Card ${n}`).join(", ")}
            {" — "}
            <Link href="/reflection-prompts">
              <span className="text-primary hover:underline cursor-pointer">View all reflection prompts</span>
            </Link>
          </div>
        </section>

        {/* Phases */}
        {detail.phases.map((phase) => (
          <section
            key={phase.phase}
            id={phase.phase === "I Do" ? "ido" : phase.phase === "We Do" ? "wedo" : "youdo"}
            className="space-y-3"
          >
            <h2 className="text-xl font-bold text-primary flex items-center gap-3">
              {phase.phase}
              <span className="text-sm font-normal text-muted-foreground">({phase.time})</span>
            </h2>
            <ol className="space-y-2">
              {phase.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2 items-start p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <span className="font-semibold text-amber-800 flex-shrink-0">Values link:</span>
              <span className="text-amber-700">{phase.valuesLink}</span>
            </div>
          </section>
        ))}

        {/* Teacher notes */}
        <section id="notes" className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Teacher Notes</h2>
          <ul className="space-y-2">
            {detail.teacherNotes.map((note, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 text-primary mt-0.5">→</span>
                <span className="text-muted-foreground">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Assessment */}
        <section id="assessment" className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="font-semibold text-primary text-sm">Assessment focus</p>
          </div>
          <p className="text-sm text-muted-foreground">{detail.assessmentFocus}</p>
        </section>

        {/* Session navigation */}
        <div className="flex gap-3 border-t border-border pt-6">
          {prevSession && (
            <Link href={`/sessions/${prevSession}`}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" />
                Session {prevSession}
              </div>
            </Link>
          )}
          <div className="flex-1" />
          {nextSession && (
            <Link href={`/sessions/${nextSession}`}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer text-sm text-muted-foreground hover:text-primary">
                Session {nextSession}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </DocLayout>
  );
}
