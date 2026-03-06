import DocLayout from "@/components/layout/DocLayout";
import { getDoc } from "@/content/curriculum";
import { Clock, Copy, Check } from "lucide-react";
import { useState } from "react";

const doc = getDoc("parent-kit")!;

interface Template {
  id: string;
  timing: string;
  subject: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: "message-1",
    timing: "Before Session 1 (at least 3 days notice)",
    subject: "New Wellbeing & STEM Pilot in [Teacher Name]'s Class",
    body: `Dear [Class Name] Families,

We're excited to share that [Teacher Name]'s class will be piloting a new wellbeing and STEM tool over the next two weeks, starting [Date].

What it is:
A privacy-first "Meta-Pet" system designed by a KPPS parent in collaboration with their child (one of our students). Students care for a digital companion that responds to their actions using systems science principles — the same ones they'll learn in biology, ecology, and human health.

Why we're trying it:
This tool aligns with our KPPS values (Respect, Resilience, Excellence, Cooperation, Community) and supports our wellbeing curriculum. It's also a hands-on way to teach homeostasis, feedback loops, and data literacy — core STEM concepts.

What makes it different:
Unlike most classroom apps, this one is offline-first with no accounts required and no student data transmission. Your child's Meta-Pet lives entirely on their device. We never see it, track it, or store any information about it. There are no timers, no notifications, and no addictive mechanics — just calm, thoughtful interaction.

What students will do:
Seven 20-minute sessions exploring care routines, emotional awareness, systems thinking, and data patterns. Students will reflect on what they observe and connect it to real-life self-regulation strategies.

How you can support:
If your child mentions their Meta-Pet at home, ask them: "What did you notice today?" or "What pattern are you seeing?" We'll share a summary at the end of the two weeks.

Questions or concerns?
Please reach out to [Teacher Name] or [Wellbeing Coordinator]. We're happy to discuss any aspect of this pilot.

This is a trial, not a commitment. We'll evaluate whether it serves our students and decide together as a school community.

Thank you for your partnership,
[Principal Name]
Kingsley Park Primary School`,
  },
  {
    id: "message-2",
    timing: "After Session 3 or 4",
    subject: "Meta-Pet Pilot Update — What We're Seeing",
    body: `Dear [Class Name] Families,

We're halfway through our Meta-Pet pilot, and we wanted to share what we're noticing.

What students are learning:
Students are practising observation skills, connecting cause and effect, and using wellbeing language like "My pet feels Anxious, so I'm focusing on Rest first." They're also applying STEM concepts like homeostasis and feedback loops in real time.

What teachers are noticing:
[Teacher Name] reports that students are engaged without needing timers or reward systems. The offline-first design means no login issues, no forgotten passwords, and no "it won't load" frustrations. Students can close the app without anxiety because there are no streaks or countdowns.

What you might hear at home:
Your child might talk about their Meta-Pet's "mood" or mention trying different strategies to help it feel balanced. This is intentional — we're teaching systems thinking through a relatable, low-stakes simulation.

Privacy reminder:
Your child's Meta-Pet data never leaves their device. No accounts, no tracking, no uploads. This is structurally safe by design.

Next week:
We'll shift into the STEM lens — students will analyse patterns, test hypotheses, and present their learning. We'll share a summary when the pilot concludes.

Warm regards,
[Teacher Name]`,
  },
  {
    id: "message-3",
    timing: "After Session 7",
    subject: "Meta-Pet Pilot Complete — Here's What We Learned",
    body: `Dear [Class Name] Families,

Our two-week Meta-Pet pilot has concluded, and we want to share what we discovered.

What students learned:
Through caring for a digital companion, students practised:
• Wellbeing skills: recognising emotional states, choosing recovery strategies, bouncing back from challenges
• STEM thinking: homeostasis, feedback loops, genetic variation, data literacy
• KPPS values: Respect, Resilience, Excellence, Cooperation, Community

Teacher feedback:
[Teacher Name] noted that the tool reduced classroom management friction (no login issues, no forgotten passwords). Students engaged deeply without needing external rewards. The session scripts made preparation straightforward.

What's next:
[Option A: We'll continue using this tool in [next term/subject].]
[Option B: We've completed the pilot and will be evaluating whether to extend the program.]

Thank you for your support during this trial. Your child was part of something genuinely innovative — a privacy-first educational tool built within their own school community.

As always, please reach out with questions.

Warm regards,
[Teacher Name] and [Principal Name]
Kingsley Park Primary School`,
  },
  {
    id: "message-4",
    timing: "In response to parent privacy questions",
    subject: "Re: Privacy Questions About the Meta-Pet Tool",
    body: `Dear [Parent Name],

Thank you for your question about the Meta-Pet tool — these are exactly the right things to ask.

Here's what we can confirm:

No accounts: Students do not create accounts or provide any personal information to use this tool. There is no registration, no login, and no profile.

No data transmission: Your child's Meta-Pet data is stored only on the device they use at school. Nothing is sent to any server, cloud service, or third party.

No tracking: There are no analytics, no usage statistics, and no behaviour data collected about your child. The tool has no network connectivity requirement.

No vendor relationship: The tool was built by a KPPS parent and offered to our school as a community contribution, not a commercial product. There is no ongoing subscription, no data sharing agreement, and no commercial interest in your child's engagement.

The technical name for this design is "offline-first architecture" — it means the tool is structurally incapable of collecting or transmitting student data, not just a matter of policy.

If you'd like the full technical brief (written for ICT coordinators), I'm happy to share it.

Thank you again for taking digital safety seriously. It's exactly this kind of engagement that helps us make good decisions as a school.

Warm regards,
[Teacher Name]`,
  },
  {
    id: "message-5",
    timing: "For newsletter or parent information night",
    subject: "Understanding the Meta-Pet: A Parent's Guide",
    body: `What is the Meta-Pet?

A digital companion your child cares for at school. The pet has four "vitals" (like Nutrition, Rest, Hydration, and Stimulation) and up to 15 emotional states. Students choose actions to help their pet stay balanced — and learn systems thinking in the process.

What your child is learning:
• Observation: checking the whole system before acting
• Cause and effect: why does my action produce this result?
• Emotional awareness: connecting the pet's mood to real feelings and strategies
• STEM: homeostasis, feedback loops, data literacy
• KPPS values: each session explicitly connects to Respect, Resilience, Excellence, Cooperation, or Community

Is it safe?
Yes. This is one of the most privacy-protective classroom tools we've used:
• No accounts or personal information required
• No internet connection needed
• No data leaves the device — ever
• No addictive mechanics (no streaks, no timers, no notifications)
• No commercial model (built as a community gift to KPPS)

How to support at home:
Ask: "What did you notice about your pet today?"
Ask: "What pattern have you figured out?"
Ask: "What did your pet teach you about yourself?"

These questions reinforce the reflection skills students are practising in class.

Questions? Contact [Teacher Name] or visit the Teacher Hub online.`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy to clipboard"}
    </button>
  );
}

export default function ParentKitPage() {
  return (
    <DocLayout sections={doc.sections} sidebarTitle="Templates">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 06</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">Teacher</span>
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs">Parent</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        {/* Usage note */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-primary">How to use these templates</p>
          <p>Click "Copy to clipboard" on any message, then paste directly into Sentral, your newsletter, or email. Text in <strong className="text-foreground">[brackets]</strong> is a fill-in.</p>
        </div>

        {/* When to send */}
        <section id="when-to-use" className="space-y-3">
          <h2 className="text-xl font-bold text-primary">When to send each message</h2>
          <div className="space-y-2">
            {TEMPLATES.map((t, i) => (
              <div key={t.id} className="flex gap-3 text-sm p-3 rounded-lg border border-border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div>
                  <span className="font-medium text-foreground">{t.subject}</span>
                  <span className="text-muted-foreground ml-2">— {t.timing}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        {TEMPLATES.map((t, i) => (
          <section key={t.id} id={t.id} className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message {i + 1}</span>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{t.timing}</span>
                </div>
                <h2 className="text-lg font-bold text-primary">Subject: {t.subject}</h2>
              </div>
              <CopyButton text={`Subject: ${t.subject}\n\n${t.body}`} />
            </div>

            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-muted/80 to-transparent rounded-t-lg z-10 pointer-events-none" />
              <div className="bg-card border border-border rounded-xl p-5 pt-6 pb-5 font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {t.body}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/80 to-transparent rounded-b-lg z-10 pointer-events-none" />
            </div>

            <div className="flex justify-end">
              <CopyButton text={`Subject: ${t.subject}\n\n${t.body}`} />
            </div>
          </section>
        ))}
      </div>
    </DocLayout>
  );
}
