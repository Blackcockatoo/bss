import DocLayout from "@/components/layout/DocLayout";
import ZCEABadge from "@/components/layout/ZCEABadge";
import { getDoc } from "@/content/curriculum";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

const doc = getDoc("welcome")!;

export default function WelcomePage() {
  return (
    <DocLayout sections={doc.sections} sidebarTitle="On this page">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Doc 01</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{doc.readTime} min read</span>
            {doc.audience.map((a) => (
              <span key={a} className="capitalize bg-muted rounded-full px-2.5 py-0.5 text-xs">{a}</span>
            ))}
          </div>
          <h1 className="text-4xl font-bold text-primary">{doc.title}</h1>
          <p className="text-xl text-muted-foreground">{doc.subtitle}</p>
        </div>

        <ZCEABadge />

        {/* Content sections */}
        <section id="what-this-is" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">What this package is</h2>
          <p className="text-muted-foreground leading-relaxed">
            This is a <strong className="text-foreground">complete classroom implementation system</strong> for Jewble,
            the privacy-first Meta-Pet co-created with a KPPS student specifically for Kingsley Park's wellbeing and STEM programs.
          </p>
          <div className="space-y-2">
            {[
              "7 structured sessions (piloted, scripted, aligned to KPPS teaching model)",
              "Student reflection tools that work with your existing wellbeing language",
              "Parent communication ready to paste into Sentral",
              "Technical/privacy documentation for leadership sign-off",
              "Values integration maps showing how this fits your strategic plan",
            ].map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm italic border-l-4 border-primary/30 pl-4">
            This isn't a vendor pitch. It's a working prototype built for KPPS, offered as partnership rather than product.
          </p>
        </section>

        <section id="why-the-veil" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">Why "The Veil"?</h2>
          <p className="text-muted-foreground leading-relaxed">
            In systems thinking, <strong className="text-foreground">the veil</strong> is the interface between visible mechanics and invisible principles.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="font-semibold text-primary mb-2 text-sm">Students see:</p>
              <p className="text-sm text-muted-foreground">A companion with four vitals, 15 emotional states, daily care routines.</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-semibold text-primary mb-2 text-sm">Students learn:</p>
              <p className="text-sm text-muted-foreground">Cause → effect sequencing, emotional regulation, responsibility without punishment, homeostasis, genetic variation, system repair.</p>
            </div>
          </div>
        </section>

        <section id="the-kpps-way" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">How this fits "The Kingsley Way"</h2>
          <div className="space-y-3">
            {[
              { label: "Your mission", value: "Happy, safe, inspiring learning in an ever-changing world." },
              { label: "Your values", value: "Respect, Resilience, Excellence, Cooperation, Community." },
              { label: "Your teaching model", value: "Gradual Release (I do / We do / You do) + explicit instruction." },
              { label: "Jewble's design", value: "Offline-first privacy architecture + calm meditation mechanics + observable emotional systems + reflection-before-action loops." },
            ].map((row, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg border border-border">
                <span className="font-semibold text-primary text-sm w-36 flex-shrink-0">{row.label}</span>
                <span className="text-sm text-muted-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="pilot-proposal" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">The pilot proposal</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border space-y-2">
              <p className="font-semibold text-primary text-sm">Week 1 (Sessions 1–4)</p>
              <p className="text-sm text-muted-foreground">Onboarding → wellbeing routines → values language → reflection practice</p>
            </div>
            <div className="p-4 rounded-lg border border-border space-y-2">
              <p className="font-semibold text-primary text-sm">Week 2 (Sessions 5–7)</p>
              <p className="text-sm text-muted-foreground">STEM lens (homeostasis + data) → student showcase → teacher debrief</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Teacher load:</strong> ~20 minutes per session</p>
            <p><strong className="text-foreground">Accounts:</strong> None to manage</p>
            <p><strong className="text-foreground">Data:</strong> Nothing to export</p>
            <p><strong className="text-foreground">Parent opt-in:</strong> No complexity (offline-first = structurally safe)</p>
          </div>
        </section>

        <section id="who-this-is-for" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">Who this is for</h2>
          <div className="space-y-2">
            {[
              { audience: "Classroom Teachers", desc: "Prep–Year 6 range, optimised for Years 3–6" },
              { audience: "Principal & AP (Wellbeing)", desc: "Strategic alignment documentation" },
              { audience: "ICT Coordinator", desc: "Technical and compliance brief" },
              { audience: "School Council", desc: "Governance and privacy story" },
              { audience: "Parent Community", desc: "Digital safety, screen quality, STEM literacy" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border">
                <span className="font-semibold text-primary text-sm w-44 flex-shrink-0">{item.audience}</span>
                <span className="text-sm text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="what-next" className="space-y-4">
          <h2 className="text-2xl font-bold text-primary pb-2 border-b border-border">What happens next</h2>
          <div className="space-y-2">
            {[
              { label: "Read the Implementation Guide", href: "/implementation", desc: "7-session structure" },
              { label: "Review the Facilitation Scripts", href: "/scripts", desc: "Exact language for each session" },
              { label: "Check the Values Integration Map", href: "/values-map", desc: "For leadership conversations" },
              { label: "Send the Parent Communication", href: "/parent-kit", desc: "If you decide to pilot" },
            ].map((step, i) => (
              <Link key={i} href={step.href}>
                <div className="group flex gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <span className="font-medium text-primary group-hover:underline">{step.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">— {step.desc}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground italic mt-2">
            Or just start with Session 1 and see what happens. The system is designed to feel calm, not complicated.
          </p>
        </section>

        {/* Next doc CTA */}
        <div className="border-t border-border pt-8">
          <Link href="/implementation">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
              <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary">Next: Implementation Guide</p>
                <p className="text-sm text-muted-foreground">7-session teaching roadmap with I Do / We Do / You Do structure</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}
