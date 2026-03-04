import DocLayout from "@/components/layout/DocLayout";
import { getDoc } from "@/content/curriculum";
import { Clock } from "lucide-react";

const doc = getDoc("values-map")!;

const VALUES = [
  {
    id: "respect",
    name: "Respect",
    color: "border-blue-300 bg-blue-50",
    accent: "text-blue-700",
    schoolDef: "Gentle, considerate treatment of people, property, and community.",
    appConnection: "Students observe their pet's state before acting. No button-mashing. No random inputs. The system rewards thoughtful interaction and punishes impulsive behaviour by dropping vitals.",
    classroomLanguage: [
      '"We check before we act — just like with our Meta-Pets."',
      '"What does your pet\'s state tell you about what it needs right now?"',
      '"Respect for a system means understanding it before you change it."',
    ],
    evidence: ["Students pausing before actions", "Students narrating their observations", "Verbal references to 'checking first'"],
  },
  {
    id: "resilience",
    name: "Resilience",
    color: "border-green-300 bg-green-50",
    accent: "text-green-700",
    schoolDef: "The ability to recover from difficulty, adapt to change, and keep trying.",
    appConnection: "When vitals drop (from neglect, distraction, or deliberate experiment), the recovery pathway is always available. There is no permanent failure state. Repair is a skill practised through careful re-sequencing of care actions.",
    classroomLanguage: [
      '"Your pet\'s vitals dropped. That\'s not failure — that\'s data. What\'s your repair sequence?"',
      '"Resilience in systems: when something breaks, you fix it. You don\'t delete it."',
      '"How did you bring your pet back to Calm? What did you try first?"',
    ],
    evidence: ["Students describing repair strategies", "Students reframing 'failure' as learning data", "Students choosing recovery over avoidance"],
  },
  {
    id: "excellence",
    name: "Excellence",
    color: "border-yellow-300 bg-yellow-50",
    accent: "text-yellow-700",
    schoolDef: "Striving for personal best, engaging with rigour, taking pride in quality work.",
    appConnection: "The STEM scaffolding rewards systematic observation over random action. Students who check all four vitals before acting, who form and test hypotheses, who use precise vocabulary (homeostasis, feedback loop, input/output) are demonstrating excellence in systems thinking.",
    classroomLanguage: [
      '"Excellence here isn\'t the highest score — it\'s the most careful observation."',
      '"Can you name all four vitals and explain what each one measures? That\'s STEM excellence."',
      '"A good scientist checks every variable, not just the one they expect to matter."',
    ],
    evidence: ["Use of STEM vocabulary unprompted", "Students forming testable hypotheses", "Detailed reflection prompts with specific observations"],
  },
  {
    id: "cooperation",
    name: "Cooperation",
    color: "border-orange-300 bg-orange-50",
    accent: "text-orange-700",
    schoolDef: "Working together toward shared goals, supporting others, valuing collective intelligence.",
    appConnection: "Sessions 2 and 6 are explicitly pair-based. Class data collection (Session 5) produces more reliable insights than any individual observation. Genetic variation between pets makes peer comparison genuinely informative — 'Why does your pet respond differently to the same input? Let\'s find out together.'",
    classroomLanguage: [
      '"Your partner noticed something about your pet you might have missed. That\'s cooperation making you smarter."',
      '"Our class data map has more patterns than any one of us could have found alone."',
      '"When your pet behaves differently from your partner\'s, that\'s not a problem — that\'s genetic variation. Let\'s investigate."',
    ],
    evidence: ["Students explaining to partners without being prompted", "Class data sessions with substantive contributions", "Students asking 'why does yours do that?' with genuine curiosity"],
  },
  {
    id: "community",
    name: "Community",
    color: "border-purple-300 bg-purple-50",
    accent: "text-purple-700",
    schoolDef: "Belonging, contributing to shared culture, caring about collective wellbeing.",
    appConnection: "The Jewble Meta-Pet system was designed by a KPPS parent and built with a KPPS student for the KPPS community. The educational package is offered without cost or ongoing vendor relationship. The student showcase (Session 7) is an act of community knowledge-sharing. The entire privacy architecture (no accounts, no data, offline-first) is a statement about whose interests the tool serves.",
    classroomLanguage: [
      '"This tool was built by someone in our school community, for our school community."',
      '"When you share what you discovered about your pet, you\'re contributing to our class knowledge."',
      '"Privacy as community care: no one outside this classroom can see your pet\'s data."',
    ],
    evidence: ["Student-led knowledge sharing in Session 7", "Students connecting pet care to real community responsibility", "Parent communications citing the community origin of the project"],
  },
];

export default function ValuesPage() {
  return (
    <DocLayout sections={doc.sections} sidebarTitle="KPPS Values">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 05</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">Leadership</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">Teacher</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        {/* Intro */}
        <section id="overview" className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
          <h2 className="font-semibold text-primary">For leadership conversations</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This document maps each of KPPS's five values to specific Meta-Pet mechanics, classroom language,
            and observable evidence. Use this when presenting to the Principal, AP, or School Council —
            it shows the program is designed <em>from</em> your values, not imposed on top of them.
          </p>
        </section>

        {/* Values */}
        {VALUES.map((v) => (
          <section key={v.id} id={v.id} className={`rounded-xl border-2 ${v.color} p-6 space-y-4`}>
            <h2 className={`text-2xl font-bold ${v.accent}`}>{v.name}</h2>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">School definition</p>
              <p className="text-sm text-muted-foreground italic">{v.schoolDef}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How Meta-Pet connects</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.appConnection}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classroom language</p>
              <ul className="space-y-1.5">
                {v.classroomLanguage.map((line, i) => (
                  <li key={i} className={`text-sm ${v.accent} italic bg-white/60 rounded-lg px-3 py-2`}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observable evidence</p>
              <ul className="space-y-1">
                {v.evidence.map((e, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${v.accent.replace('text-', 'bg-')} mt-2`} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </DocLayout>
  );
}
