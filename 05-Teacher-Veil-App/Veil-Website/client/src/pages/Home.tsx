import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck,
  MessageSquare,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ZCEABadge from "@/components/layout/ZCEABadge";
import SessionCard from "@/components/layout/SessionCard";
import RoleCard from "@/components/layout/RoleCard";
import { CURRICULUM_DOCS, SESSION_DATA, type CurriculumDoc } from "@/content/curriculum";

const downloadPackage = () => {
  const link = document.createElement("a");
  link.href = "/KPPS_Teacher_Hub_Package.zip";
  link.download = "KPPS_Teacher_Hub_Package.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Home() {
  const docMap = Object.fromEntries(CURRICULUM_DOCS.map((doc) => [doc.id, doc])) as Record<string, CurriculumDoc>;

  const reviewPacks = [
    {
      id: "governance",
      title: "Governance Pack",
      description:
        "For principals, ICT leads, and privacy reviewers checking safety, boundaries, and pilot readiness.",
      icon: <ShieldCheck className="w-5 h-5" />,
      docs: [docMap["welcome"], docMap["values-map"], docMap["privacy-brief"]],
    },
    {
      id: "teacher-pack",
      title: "Teacher Pack",
      description:
        "For classroom staff planning lesson flow, facilitation language, and reflection activities.",
      icon: <BookOpen className="w-5 h-5" />,
      docs: [docMap["implementation"], docMap["scripts"], docMap["reflection-prompts"]],
    },
    {
      id: "pilot-pack",
      title: "Pilot Pack",
      description:
        "For first-school pilot conversations covering scope, family communication, and the review sequence.",
      icon: <ClipboardCheck className="w-5 h-5" />,
      docs: [docMap["welcome"], docMap["parent-kit"], docMap["privacy-brief"]],
    },
  ];

  const acceptanceChecks = [
    {
      title: "Browser and network review",
      detail:
        "Confirm routine classroom use matches the documented low-data posture and declared outbound behaviour.",
    },
    {
      title: "Teacher dry run",
      detail:
        "Verify setup, lesson flow, and reflection materials are practical in a real classroom block.",
    },
    {
      title: "ICT and privacy review",
      detail:
        "Check governance, privacy, and safety materials before any live pilot conversation.",
    },
    {
      title: "Parent readability review",
      detail:
        "Test whether the family note and privacy wording are understandable without translation by staff.",
    },
  ];

  const boundaryTags = [
    "Teacher-led",
    "Years 3-6",
    "No student accounts",
    "Alias-based classroom use",
    "Local classroom records",
    "No social features",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <section
        id="overview"
        className="py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-sm font-medium bg-primary-foreground/15 rounded-full px-4 py-1.5">
              <span>MetaPet Schools</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Teacher-led, low-data classroom pilot for Years 3-6.
            </h1>
            <p className="text-xl opacity-80 leading-relaxed">
              MetaPet Schools helps schools review a bounded classroom pilot for digital
              responsibility, systems thinking, and online safety habits without student accounts
              or social features.
            </p>
            <p className="text-base opacity-75 max-w-2xl">
              The public landing is for review first: governance, teacher materials, and pilot
              scope. Guided classroom delivery comes second.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {boundaryTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-foreground/12 px-3 py-1 text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <a href="/#governance">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Review Governance Pack
                </Button>
              </a>
              <a href="/#teacher-pack">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Review Teacher Pack
                </Button>
              </a>
              <a href="/#pilot-pack">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Review Pilot Pack
                </Button>
              </a>
            </div>
            <div className="pt-1">
              <Link href="/implementation">
                <span className="inline-flex items-center gap-2 text-sm opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
                  <FileCheck className="w-4 h-4" />
                  Secondary: preview the guided lesson sequence
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-background">
        <div className="container">
          <ZCEABadge />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Start by role</h2>
            <p className="text-muted-foreground text-lg">
              The first pass is a review conversation, not a product demo. Start with the pack
              that matches your role.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RoleCard
              role="Classroom Teacher"
              description="Lesson flow, facilitation scripts, and reflection materials for a short guided classroom sequence."
              href="/implementation"
              icon={<BookOpen className="w-5 h-5" />}
              tags={["7 sessions", "15-20 min", "Teacher-led"]}
            />
            <RoleCard
              role="School Leadership"
              description="Pilot scope, curriculum fit, and boundary statements for principal and leadership review."
              href="/welcome"
              icon={<Users className="w-5 h-5" />}
              tags={["Pilot scope", "Curriculum fit", "Boundaries"]}
            />
            <RoleCard
              role="ICT / Privacy Review"
              description="Governance, privacy, and safety materials for technical review before any pilot starts."
              href="/privacy-brief"
              icon={<Monitor className="w-5 h-5" />}
              tags={["Low-data", "No student accounts", "Review first"]}
            />
            <RoleCard
              role="Parent / Carer"
              description="Family-facing communication using plain language about classroom use, boundaries, and privacy."
              href="/parent-kit"
              icon={<MessageSquare className="w-5 h-5" />}
              tags={["Plain language", "Family note", "Pilot-ready"]}
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Acceptance Gate Before Any Pilot</h2>
            <p className="text-muted-foreground">
              These checks should pass before outreach moves from review to live classroom use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {acceptanceChecks.map((check) => (
              <div key={check.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-primary">{check.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{check.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
            Hard blockers: undeclared outbound calls, unclear family communication,
            school-versus-product confusion, or teacher setup that feels heavier than the landing
            promise.
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container space-y-12">
          {reviewPacks.map((pack) => (
            <div key={pack.id} id={pack.id} className="space-y-5">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {pack.icon}
                  <span>{pack.title}</span>
                </div>
                <h2 className="text-3xl font-bold text-primary">{pack.title}</h2>
                <p className="text-lg text-muted-foreground">{pack.description}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {pack.docs.map((doc) => (
                  <Link key={`${pack.id}-${doc.id}`} href={doc.href}>
                    <div className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {doc.num}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="font-semibold text-primary group-hover:underline">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.audience.map((audience) => (
                            <span
                              key={audience}
                              className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 capitalize"
                            >
                              {audience}
                            </span>
                          ))}
                          <span className="text-xs text-muted-foreground/70 ml-auto">
                            {doc.readTime} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Curriculum Fit At A Glance</h2>
            <p className="text-muted-foreground">
              The classroom offer stays deliberately narrow: short guided lessons, observable
              routines, and structured reflection.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                label: "Age band",
                value: "Years 3-6",
                detail: "Positioned for upper primary classroom use.",
              },
              {
                label: "Session model",
                value: "7 guided lessons",
                detail: "Short, teacher-led activities with a consistent structure.",
              },
              {
                label: "Teacher load",
                value: "15-20 minutes",
                detail: "Designed for classroom flow, not extra admin overhead.",
              },
              {
                label: "Evidence style",
                value: "Local reflection",
                detail: "Observation, prompts, and teacher review before any broader pilot step.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary/70">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mb-10 space-y-3">
            <h2 className="text-3xl font-bold text-primary">Guided Classroom Sequence</h2>
            <p className="text-muted-foreground">
              Classroom delivery stays secondary on the landing. When reviewers want to see the
              teaching flow, this is the bounded sequence they are reviewing.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {SESSION_DATA.map((session) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                focus={session.focus}
                compact
              />
            ))}
          </div>
          <div className="space-y-3 max-w-2xl">
            {SESSION_DATA.map((session) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                focus={session.focus}
              />
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/implementation">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Open Teacher Guide
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
              onClick={downloadPackage}
            >
              <Download className="w-4 h-4 mr-2" />
              Download review pack
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary/70">
              Provenance
            </p>
            <h2 className="text-2xl font-bold text-primary">
              Origin note, not primary positioning
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Early co-design work for this school-facing pack began with a KPPS student and
              family. This public landing is now framed for general school review, with the broader
              MetaPet product kept outside the school surface.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
