import { Button } from "@/components/ui/button";
import { Download, BookOpen, Users, Monitor, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ZCEABadge from "@/components/layout/ZCEABadge";
import SessionCard from "@/components/layout/SessionCard";
import RoleCard from "@/components/layout/RoleCard";
import { SESSION_DATA, CURRICULUM_DOCS } from "@/content/curriculum";

const downloadPackage = () => {
  const link = document.createElement("a");
  link.href = "/KPPS_Teacher_Hub_Package.zip";
  link.download = "KPPS_Teacher_Hub_Package.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
          backgroundSize: "24px 24px",
        }} />
        <div className="container relative z-10">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 text-sm font-medium bg-primary-foreground/15 rounded-full px-4 py-1.5">
              <span>Kingsley Park Primary School</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Seven sessions. No accounts. No data.
              <span className="block opacity-70 text-4xl md:text-5xl mt-2">Just learning.</span>
            </h1>
            <p className="text-xl opacity-80 leading-relaxed">
              Meta-Pet & The Veil — a privacy-first educational ecosystem built with a KPPS student,
              designed for your classroom.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/implementation">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Implementation Guide
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
                onClick={downloadPackage}
              >
                <Download className="w-4 h-4 mr-2" />
                Download ZIP Package
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ZCEA Panel */}
      <section className="py-10 bg-background">
        <div className="container">
          <ZCEABadge />
        </div>
      </section>

      {/* Role-based entry */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Where do you start?</h2>
            <p className="text-muted-foreground text-lg">
              Different stakeholders need different things. Jump to what's relevant for you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RoleCard
              role="Classroom Teacher"
              description="Everything you need to run 7 sessions confidently — scripts, guides, reflection tools."
              href="/implementation"
              icon={<BookOpen className="w-5 h-5" />}
              tags={["7 sessions", "20 min each", "Scripted"]}
            />
            <RoleCard
              role="School Leadership"
              description="Strategic alignment with KPPS values and mission. Privacy documentation for governance."
              href="/values-map"
              icon={<Users className="w-5 h-5" />}
              tags={["Values alignment", "Governance", "Compliance"]}
            />
            <RoleCard
              role="ICT Coordinator"
              description="Full technical brief: offline architecture, zero-account model, data residency, compliance."
              href="/privacy-brief"
              icon={<Monitor className="w-5 h-5" />}
              tags={["Offline-first", "No data", "COPC 2025"]}
            />
            <RoleCard
              role="Parent Community"
              description="Copy-paste Sentral templates explaining the program simply, honestly, and reassuringly."
              href="/parent-kit"
              icon={<MessageSquare className="w-5 h-5" />}
              tags={["Templates ready", "Plain language", "Privacy-first"]}
            />
          </div>
        </div>
      </section>

      {/* 7-session timeline */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">7-Session Pilot</h2>
            <p className="text-muted-foreground">
              Two weeks. 20 minutes per session. Gradual Release model (I Do / We Do / You Do).
              Click any session for the full session plan.
            </p>
          </div>

          {/* Horizontal scroll for compact session timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {SESSION_DATA.map((s) => (
              <SessionCard
                key={s.id}
                id={s.id}
                title={s.title}
                focus={s.focus}
                compact
              />
            ))}
          </div>

          {/* Expanded list */}
          <div className="space-y-3 max-w-2xl">
            {SESSION_DATA.map((s) => (
              <SessionCard
                key={s.id}
                id={s.id}
                title={s.title}
                focus={s.focus}
              />
            ))}
          </div>

          <div className="mt-8">
            <Link href="/implementation">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Full Implementation Guide →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Curriculum docs grid */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Complete Curriculum Package</h2>
            <p className="text-muted-foreground">
              7 comprehensive documents — all readable in the browser, no ZIP required.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            {CURRICULUM_DOCS.map((doc) => (
              <Link key={doc.id} href={doc.href}>
                <div className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {doc.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary mb-0.5 group-hover:underline">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
                    <div className="flex gap-1.5 mt-2">
                      {doc.audience.map((a) => (
                        <span key={a} className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 capitalize">
                          {a}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground/60 ml-auto">{doc.readTime} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
              onClick={downloadPackage}
            >
              <Download className="w-4 h-4 mr-2" />
              Download ZIP (all docs)
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container max-w-2xl text-center space-y-4">
          <h2 className="text-3xl font-bold">No licensing fees. No vendor lock-in. No hidden agenda.</h2>
          <p className="opacity-80">
            This package is a gift to Kingsley Park Primary School. Built with a KPPS kid.
            Designed for the KPPS way.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/implementation">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Get Started — Session 1
              </Button>
            </Link>
            <a
              href="https://bluesnakestudios.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                Launch the MetaPet App ↗
              </Button>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
