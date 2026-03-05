"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./landing.css";

type NavId =
  | "parents"
  | "schools"
  | "veil"
  | "schoolDocs"
  | "investors"
  | "strategy"
  | "ads";
type AccentTone = "gold" | "teal" | "violet" | "coral";

type FeatureCard = {
  icon: string;
  title: string;
  body: string;
  accent: AccentTone;
};

type StrategyCard = {
  title: string;
  body: string;
  accent: AccentTone;
  technique: string;
  techniqueTone: "gold" | "teal";
};

type AdCard = {
  id: string;
  platform: string;
  headline: string;
  body: string;
  cta: string;
};

type AdGroup = {
  id: string;
  label: string;
  tone: "teal" | "gold" | "violet";
  cards: AdCard[];
};

type LabyrinthNode = {
  id: NavId;
  chamber: string;
  title: string;
  body: string;
  accent: AccentTone;
};

type SchoolDoc = {
  href: string;
  tag: string;
  title: string;
  description: string;
};

const navLinks: Array<{ id: NavId; label: string; audience: string }> = [
  { id: "parents", label: "Parents", audience: "parents" },
  { id: "schools", label: "Schools", audience: "schools" },
  { id: "veil", label: "Teacher Delivery", audience: "teachers" },
  { id: "schoolDocs", label: "School Docs", audience: "schools" },
  { id: "investors", label: "Government", audience: "schools" },
  { id: "strategy", label: "Assurance", audience: "" },
  { id: "ads", label: "Communication", audience: "" },
];

const labyrinthNodes: LabyrinthNode[] = [
  {
    id: "parents",
    chamber: "Chamber 01",
    title: "Parent confidence",
    body: "Begin with what families need first: calm learning, clear safety, and no hidden data practices.",
    accent: "teal",
  },
  {
    id: "schools",
    chamber: "Chamber 02",
    title: "School implementation",
    body: "Show how the pilot fits normal teaching practice with low setup overhead and curriculum alignment.",
    accent: "gold",
  },
  {
    id: "veil",
    chamber: "Chamber 03",
    title: "Teacher delivery",
    body: "Open the direct teacher workflow so staff can run sessions confidently inside regular class windows.",
    accent: "coral",
  },
  {
    id: "schoolDocs",
    chamber: "Chamber 04",
    title: "School documentation",
    body: "Surface implementation documents directly on-page so teachers and leadership can verify delivery details quickly.",
    accent: "teal",
  },
  {
    id: "investors",
    chamber: "Chamber 05",
    title: "Government readiness",
    body: "Present policy-fit controls, technical safeguards, and practical risk reduction for public education settings.",
    accent: "violet",
  },
  {
    id: "strategy",
    chamber: "Chamber 06",
    title: "Assurance framework",
    body: "Translate the model into clear approval criteria for leadership, ICT, and policy reviewers.",
    accent: "coral",
  },
  {
    id: "ads",
    chamber: "Chamber 07",
    title: "Stakeholder communication",
    body: "Finish with copy-ready templates for parent notices, leadership briefings, and government review notes.",
    accent: "gold",
  },
];

const schoolDocs: SchoolDoc[] = [
  {
    href: "/docs/kpps/00_Package_Index.md",
    tag: "Index",
    title: "Implementation package index",
    description:
      "Master list of pilot materials so leadership and ICT reviewers can locate every supporting document quickly.",
  },
  {
    href: "/docs/kpps/04_Privacy_and_Safety_Brief.md",
    tag: "Safety",
    title: "Privacy and safety brief",
    description:
      "Plain-language controls summary covering data minimization, duty-of-care expectations, and verification notes.",
  },
  {
    href: "/docs/kpps/06_Implementation_Runbook.md",
    tag: "Runbook",
    title: "Teacher implementation runbook",
    description:
      "Operational steps for sessions, facilitation handover, and post-pilot review so delivery stays consistent.",
  },
];

const parentCards: FeatureCard[] = [
  {
    icon: "DNA",
    title: "Genuinely Unique",
    body: "Every Jewble is born from a 180-digit base-7 genome. Not a skin. Not a color swap. A mathematically unrepeatable organism with its own personality trajectory.",
    accent: "teal",
  },
  {
    icon: "LOCK",
    title: "Privacy by Architecture",
    body: "Offline-first. No accounts to create. No data leaves the device. No tracking. No ads. Your child's companion exists only on their device.",
    accent: "teal",
  },
  {
    icon: "BRAIN",
    title: "Screen Time That Teaches",
    body: "15 emotional states. 4 vitals. Cause and effect. Homeostasis. Genetic inheritance. Kids learn systems thinking while caring for something that cares back.",
    accent: "teal",
  },
  {
    icon: "SHIELD",
    title: "Anti-Addiction by Design",
    body: "Daily bonuses reward 24hr+ breaks. Vitals pause when backgrounded. No timers, no FOMO, no countdown manipulation. Engagement without exploitation.",
    accent: "teal",
  },
];

const schoolCards: FeatureCard[] = [
  {
    icon: "BOOK",
    title: "Complete Implementation Package",
    body: "7 structured sessions, facilitation scripts, reflection prompts, values integration maps, parent communication templates, and privacy documentation.",
    accent: "gold",
  },
  {
    icon: "TARGET",
    title: "Curriculum Alignment",
    body: "Maps to Digital Technologies, Health and PE (Personal/Social), and Science (Biological Systems). Fits explicit instruction and gradual release models.",
    accent: "gold",
  },
  {
    icon: "SPARK",
    title: "Zero Teacher Overhead",
    body: "No accounts to manage. No data to export. No parent opt-in paperwork for logins. Offline-first delivery supports Australian privacy and school safety expectations.",
    accent: "gold",
  },
  {
    icon: "CHART",
    title: "Measurable Outcomes",
    body: "Engagement data plus wellbeing language evidence with a clear digital safety story you can report to leadership and school council.",
    accent: "gold",
  },
];

const veilCards: FeatureCard[] = [
  {
    icon: "PAIR",
    title: "Pairing and Digital DNA",
    body: "Generate classroom pairing cards fast. Students connect without email logins or account setup friction.",
    accent: "coral",
  },
  {
    icon: "GUIDE",
    title: "Blessing Forge and Interventions",
    body: "Send positive nudges, class rewards, and guided interventions without public call-outs.",
    accent: "coral",
  },
  {
    icon: "SCRIPT",
    title: "Facilitation Scripts",
    body: "Short practical teacher language for each session so staff can run the pilot confidently in normal class windows.",
    accent: "coral",
  },
  {
    icon: "QUEST",
    title: "Classroom Quest Layer",
    body: "Math relay, word forge, and science sprint style activities that keep the pilot curriculum-aligned and collaborative.",
    accent: "coral",
  },
];

const governmentCards: FeatureCard[] = [
  {
    icon: "POLICY",
    title: "Policy and Duty-of-Care Alignment",
    body: "The pilot is designed for school and government expectations: wellbeing, digital safety, and privacy-by-design are built into normal classroom delivery.",
    accent: "violet",
  },
  {
    icon: "PRIVACY",
    title: "Data-Minimal Architecture",
    body: "No student accounts, no third-party trackers, and no cloud dependency for core use. Classroom interaction data remains on-device during pilot operation.",
    accent: "violet",
  },
  {
    icon: "AUDIT",
    title: "Audit and Technical Transparency",
    body: "Leadership and ICT teams can review documentation, inspect implementation decisions, and validate privacy claims through transparent evidence.",
    accent: "violet",
  },
  {
    icon: "DELIVERY",
    title: "Low-Risk Rollout Pathway",
    body: "A two-week structure, teacher scripts, and parent communication templates reduce rollout risk for schools and education departments.",
    accent: "violet",
  },
];

const assuranceCards: StrategyCard[] = [
  {
    title: "Governance Fit",
    body: "Learning goals, wellbeing practice, and digital safety expectations are mapped so school and policy reviewers can assess fit quickly.",
    accent: "teal",
    technique: "Focus -> School and policy alignment",
    techniqueTone: "teal",
  },
  {
    title: "Operational Simplicity",
    body: "Teachers can run sessions inside standard class windows without account creation, password resets, or new admin portals.",
    accent: "gold",
    technique: "Focus -> Low admin delivery",
    techniqueTone: "gold",
  },
  {
    title: "Privacy by Design",
    body: "Core features run offline, and student identity data is not required for participation in the pilot model.",
    accent: "violet",
    technique: "Focus -> Data minimization",
    techniqueTone: "teal",
  },
  {
    title: "Classroom Integrity",
    body: "No countdown pressure, streak penalties, or push notifications. The interaction model supports calm, reflective learning routines.",
    accent: "coral",
    technique: "Focus -> Wellbeing-safe mechanics",
    techniqueTone: "gold",
  },
  {
    title: "Family Trust",
    body: "Parent communication templates explain what is and is not collected, how the pilot works, and where support sits.",
    accent: "teal",
    technique: "Focus -> Transparent communication",
    techniqueTone: "teal",
  },
  {
    title: "Review and Improvement",
    body: "Teacher and leadership debrief points support an accountable decision to continue, refine, or stop after the pilot.",
    accent: "gold",
    technique: "Focus -> Accountable evaluation",
    techniqueTone: "gold",
  },
];

const communicationGroups: AdGroup[] = [
  {
    id: "parents",
    label: "Parents and Caregivers",
    tone: "teal",
    cards: [
      {
        id: "parents-launch-note",
        platform: "Parent Notice - Pilot Launch",
        headline: "What families can expect from the Jewble classroom pilot",
        body: `This class is running a two-week pilot using Jewble, a digital companion activity focused on wellbeing language, systems thinking, and reflective practice.

The pilot is designed to be low-risk and privacy-safe: no student accounts, no advertising, and no third-party tracking. Core activity works offline.

Students complete short guided sessions in class, and families receive updates as the pilot progresses.`,
        cta: "Action: Share via newsletter or parent portal",
      },
      {
        id: "parents-privacy-brief",
        platform: "Parent FAQ - Privacy and Safety",
        headline: "Privacy and safety at a glance",
        body: `Jewble does not require student logins during the pilot. The experience does not use third-party analytics, ad networks, or social media sharing loops.

Core classroom use is offline-first, and the school receives implementation and safety documentation before rollout.

If you have technical questions, school leadership and ICT contacts can provide direct support pathways.`,
        cta: "Action: Include in FAQ attachment",
      },
      {
        id: "parents-progress-update",
        platform: "Parent Update - Mid Pilot",
        headline: "How the class pilot is progressing",
        body: `Students are working through short sessions that connect observation, self-regulation, and systems thinking.

Teachers are using guided scripts and reflection prompts, with no added parent admin steps required during pilot delivery.

A post-pilot summary will share outcomes and next-step decisions with families.`,
        cta: "Action: Share in week-two update",
      },
    ],
  },
  {
    id: "schools",
    label: "School Leadership",
    tone: "gold",
    cards: [
      {
        id: "schools-principal-brief",
        platform: "Principal Brief - Pilot Approval",
        headline: "Two-week pilot with low operational risk",
        body: `The pilot runs for seven sessions and is designed to fit standard classroom windows.

No student account creation is required, and the implementation package includes scripts, parent communication templates, and privacy documentation.

Leadership can review values alignment, safety controls, and expected classroom workflow before approval.`,
        cta: "Action: Present at leadership meeting",
      },
      {
        id: "schools-council-brief",
        platform: "School Council Briefing",
        headline: "Clear controls, clear evidence, clear decision points",
        body: `The package includes a privacy and safety technical brief, implementation roadmap, and parent communication kit.

School council can evaluate controls against local wellbeing and digital safety expectations before and after the pilot.

The post-pilot review supports a transparent continue, refine, or discontinue decision.`,
        cta: "Action: Attach to council agenda pack",
      },
    ],
  },
  {
    id: "investors",
    label: "Government and ICT Review",
    tone: "violet",
    cards: [
      {
        id: "government-policy-brief",
        platform: "Education Department Brief",
        headline: "Pilot model for privacy-safe classroom technology",
        body: `Jewble is designed to support classroom learning without requiring student identity capture in the pilot workflow.

Core use is offline-first, with implementation materials that allow policy, safeguarding, and ICT teams to review controls prior to rollout.

The package supports a practical, evidence-led pilot decision process.`,
        cta: "Action: Include in policy review submission",
      },
      {
        id: "government-ict-note",
        platform: "ICT Coordinator Note",
        headline: "Technical controls and verification pathway",
        body: `ICT teams can review the Privacy and Safety Brief, inspect local behavior, and validate that the pilot model avoids unnecessary data collection.

The implementation package includes documentation for leadership and family communication to support safe adoption.

Review findings can be captured in normal school governance channels.`,
        cta: "Action: Attach to ICT recommendation",
      },
    ],
  },
];

const metricsRows = [
  [
    "Student identity data",
    "Names or emails often collected",
    "No student accounts required",
    "Zero-account pilot model",
  ],
  [
    "Core classroom access",
    "Cloud dependency is common",
    "Core learning works offline",
    "Offline-first architecture",
  ],
  [
    "Teacher administration",
    "Setup and account support overhead",
    "No login management required",
    "Scripted classroom delivery",
  ],
  [
    "Engagement mechanics",
    "Timers, streaks, or notification pressure",
    "Calm interaction model",
    "No pressure-loop mechanics",
  ],
  [
    "Governance transparency",
    "Claims can be hard to verify",
    "Documentation and walkthroughs",
    "Evidence-led review",
  ],
  [
    "Implementation pathway",
    "Custom rollout planning",
    "Two-week, seven-session pilot",
    "School implementation package",
  ],
];

const showcaseImages = [
  {
    src: "/assets/companion1.svg",
    alt: "Meet your Meta Pet companion",
    fallbackLabel: "Companion Reveal",
  },
  {
    src: "/assets/adventures.svg",
    alt: "Adventures in the metaverse",
    fallbackLabel: "Adventure World",
  },
  {
    src: "/assets/companion2.svg",
    alt: "Meet your evolving Meta Pet",
    fallbackLabel: "Evolution Frame",
  },
];

function ShowcaseImage({
  src,
  alt,
  fallbackLabel,
}: {
  src: string;
  alt: string;
  fallbackLabel: string;
}) {
  const [isError, setIsError] = useState(false);

  if (isError) {
    return <div className="showcase-fallback">{fallbackLabel}</div>;
  }

  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setIsError(true)} />
  );
}

function NextGate({ from }: { from: NavId }) {
  const currentIndex = labyrinthNodes.findIndex((node) => node.id === from);
  const nextNode = labyrinthNodes[currentIndex + 1];

  if (!nextNode) {
    return (
      <div className="next-gate">
        <span>Labyrinth complete</span>
        <a href="#top">Back to entrance -&gt;</a>
      </div>
    );
  }

  return (
    <div className="next-gate">
      <span>Next chamber</span>
      <a href={`#${nextNode.id}`}>
        {nextNode.chamber} - {nextNode.title} -&gt;
      </a>
    </div>
  );
}

export default function LandingPage() {
  const sectionIds = useMemo<NavId[]>(
    () => labyrinthNodes.map((node) => node.id),
    [],
  );
  const [activeNav, setActiveNav] = useState<NavId>("parents");
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);

  const activeNode =
    labyrinthNodes.find((node) => node.id === activeNav) ?? labyrinthNodes[0];
  const activeNodeIndex = labyrinthNodes.findIndex(
    (node) => node.id === activeNav,
  );

  const copyTimeoutRef = useRef<number | null>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => {
      document.body.classList.remove("landing-body");
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);

    if (!sections.length) {
      return;
    }

    const visibility = new Map<NavId, number>();
    sectionIds.forEach((id) => visibility.set(id, 0));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id as NavId;
          visibility.set(
            id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });

        let bestMatch = sectionIds[0];
        let bestScore = -1;

        sectionIds.forEach((id) => {
          const ratio = visibility.get(id) ?? 0;
          if (ratio > bestScore) {
            bestScore = ratio;
            bestMatch = id;
          }
        });

        if (bestScore > 0) {
          setActiveNav(bestMatch);
          return;
        }

        const anchorLine = window.scrollY + window.innerHeight * 0.45;
        sectionIds.forEach((id) => {
          const node = document.getElementById(id);
          if (node && node.offsetTop <= anchorLine) {
            bestMatch = id;
          }
        });

        setActiveNav(bestMatch);
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        rootMargin: "-16% 0px -42% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    if (!isPilotModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPilotModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    modalPanelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isPilotModalOpen]);

  async function copyAd(card: AdCard) {
    const text = `${card.headline}\n\n${card.body}\n\n${card.cta}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAdId(card.id);

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedAdId(null);
      }, 1500);
    } catch {
      setCopiedAdId(null);
    }
  }

  return (
    <div className="landing">
      <div className="ambient" />
      <div className="grain" />

      <nav>
        <div className="nav-logo">
          Blue Snake <span>Studios</span>
        </div>
        <div className="nav-right">
          <div className="nav-links">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                data-audience={link.audience}
                className={activeNav === link.id ? "active" : ""}
                onClick={() => setActiveNav(link.id)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <a className="nav-launch" href="/compass">
            Open Compass Wheel
          </a>
          <a className="nav-launch" href="/pet">
            Open MetaPet
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-badge">
          School and Family Brief - February 2026
        </div>
        <h1>
          Meet <span className="accent">Jewble</span>
        </h1>
        <p className="hero-sub">
          It is not a pet. It is a <em>process</em>.
          <br />
          Enter a guided labyrinth that walks parents, schools, teachers, and
          government reviewers through one clear implementation pathway.
        </p>
        <div className="hero-cta">
          <button
            className="btn btn-gold"
            type="button"
            onClick={() => setIsPilotModalOpen(true)}
          >
            Start School Pilot -&gt;
          </button>
          <a className="btn btn-gold" href="/pet">
            Open MetaPet App -&gt;
          </a>
          <a className="btn btn-gold" href="/compass">
            Open Compass Wheel -&gt;
          </a>
          <a className="btn btn-ghost" href="#pathway">
            Walk the Labyrinth -&gt;
          </a>
          <a className="btn btn-ghost" href="#parents">
            For Parents -&gt;
          </a>
          <a className="btn btn-ghost" href="#schools">
            For Schools -&gt;
          </a>
          <a className="btn btn-ghost" href="#investors">
            For Government -&gt;
          </a>
        </div>
        <div className="hero-stat-row">
          <div className="hero-stat">
            <div className="num gold">7 sessions</div>
            <div className="label">Structured pilot pathway</div>
          </div>
          <div className="hero-stat">
            <div className="num teal">20 min</div>
            <div className="label">Typical classroom block</div>
          </div>
          <div className="hero-stat">
            <div className="num violet">0 accounts</div>
            <div className="label">Student logins required</div>
          </div>
          <div className="hero-stat">
            <div className="num gold">0 data</div>
            <div className="label">Transmitted off device</div>
          </div>
        </div>
      </section>

      {isPilotModalOpen ? (
        <div
          className="pilot-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsPilotModalOpen(false);
            }
          }}
        >
          <div
            className="pilot-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pilot-modal-title"
            tabIndex={-1}
            ref={modalPanelRef}
          >
            <button
              type="button"
              className="pilot-modal-close"
              onClick={() => setIsPilotModalOpen(false)}
              aria-label="Close pilot links"
            >
              x
            </button>
            <span className="pilot-modal-tag">Pilot Launch</span>
            <h3 id="pilot-modal-title">
              Open teacher delivery tools and pathway
            </h3>
            <p>
              Jump straight into teacher mode, route map, and the full
              documentation package from this landing page.
            </p>
            <div className="pilot-modal-links">
              <a href="/pet">Open MetaPet app</a>
              <a href="/compass">Open Compass Wheel</a>
              <a
                href="https://teachers-meta-pet-mr-brand.vercel.app/?as=teacher"
                target="_blank"
                rel="noopener noreferrer"
              >
                Teacher Hub (The Veil)
              </a>
              <a
                href="https://teachers-meta-pet-mr-brand.vercel.app/routes"
                target="_blank"
                rel="noopener noreferrer"
              >
                Teacher route map
              </a>
              <a
                href="/docs/kpps/00_Package_Index.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                School package index
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="divider" />

      <section className="pathway" id="pathway">
        <div className="pathway-header">
          <div className="section-label teal">Labyrinth Route</div>
          <h2>One path. Seven chambers. Built for trust.</h2>
          <p>
            Each chamber explains one decision layer in sequence, from family
            confidence to policy review. Start at Chamber 01 and follow the
            gates.
          </p>
        </div>
        <div className="pathway-grid">
          {labyrinthNodes.map((node, index) => {
            const isActive = node.id === activeNav;
            const isReached = activeNodeIndex >= index;

            return (
              <a
                key={node.id}
                href={`#${node.id}`}
                className={`path-node ${node.accent} ${
                  isActive ? "active" : ""
                } ${isReached ? "reached" : ""}`}
              >
                <span className="path-node-tag">{node.chamber}</span>
                <h3>{node.title}</h3>
                <p>{node.body}</p>
                <span className="path-node-link">Enter chamber -&gt;</span>
              </a>
            );
          })}
        </div>
        <div className="pathway-status">
          <span>Currently focused:</span>
          <strong>
            {activeNode.chamber} - {activeNode.title}
          </strong>
        </div>
      </section>

      <section className="section" id="parents">
        <div className="section-label teal">Layer 1 - Parents and Kids</div>
        <h2>
          Screen time that supports
          <br />
          family confidence.
        </h2>
        <p className="lead">
          Jewble helps students practice responsibility, systems thinking, and
          emotional regulation in a calm format. During pilot delivery, there
          are no student logins, no ad tracking, and no hidden growth loops.
        </p>

        <div className="card-grid">
          {parentCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="showcase">
          {showcaseImages.map((item) => (
            <ShowcaseImage
              key={item.src}
              src={item.src}
              alt={item.alt}
              fallbackLabel={item.fallbackLabel}
            />
          ))}
        </div>

        <NextGate from="parents" />
      </section>

      <section className="section" id="schools">
        <div className="section-label gold">
          Layer 2 - Schools and Educators
        </div>
        <h2>
          A pilot model that fits
          <br />
          existing classroom practice.
        </h2>
        <p className="lead">
          A 2-week, 7-session pilot that fits existing teaching models. No new
          accounts. No data to export. No parent opt-in complexity. About 20
          minutes per session with scripts provided.
        </p>

        <div className="card-grid">
          {schoolCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="strat-grid week-grid">
          <div className="strat-card s-gold">
            <h4>Week 1 (Sessions 1-4)</h4>
            <p>
              Onboarding to wellbeing routines, values language, and reflection
              practice. Students meet their companion and connect care routines
              to school values.
            </p>
          </div>
          <div className="strat-card s-gold">
            <h4>Week 2 (Sessions 5-7)</h4>
            <p>
              STEM lens (homeostasis plus data), student showcase, and teacher
              debrief. Students present findings. Teachers assess. Leadership
              decides.
            </p>
          </div>
        </div>

        <NextGate from="schools" />
      </section>

      <div className="divider" />

      <section className="section" id="veil">
        <div className="section-label coral">Layer 3 - Teacher Delivery</div>
        <h2>
          Keep delivery practical,
          <br />
          and keep teacher control high.
        </h2>
        <p className="lead">
          The teacher pathway stays connected to this landing page. Open teacher
          mode, run sessions from scripts, and keep student setup friction near
          zero.
        </p>

        <div className="card-grid">
          {veilCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="veil-panel">
          <div>
            <h3>Teacher launch stack</h3>
            <p>
              Use the direct links below to run the full teacher workflow: The
              Veil hub, route map, and implementation documentation.
            </p>
          </div>
          <div className="veil-actions">
            <a
              className="btn btn-gold"
              href="https://teachers-meta-pet-mr-brand.vercel.app/?as=teacher"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open The Veil -&gt;
            </a>
            <a
              className="btn btn-ghost"
              href="https://teachers-meta-pet-mr-brand.vercel.app/routes"
              target="_blank"
              rel="noopener noreferrer"
            >
              Route Map -&gt;
            </a>
          </div>
        </div>

        <NextGate from="veil" />
      </section>

      <div className="divider" />

      <section className="section" id="schoolDocs">
        <div className="section-label teal">Layer 4 - School Documentation</div>
        <h2>
          Full implementation docs
          <br />
          stay visible on this page.
        </h2>
        <p className="lead">
          Every implementation document is linked directly from this landing
          page so teachers, leadership, and ICT reviewers can access materials
          quickly.
        </p>

        <div>
          {schoolDocs.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{doc.tag}</span>
              <h4>{doc.title}</h4>
              <p>{doc.description}</p>
            </a>
          ))}
        </div>

        <NextGate from="schoolDocs" />
      </section>

      <section className="section" id="investors">
        <div className="section-label violet">
          Layer 4 - Government and Policy
        </div>
        <h2>
          Built for policy confidence,
          <br />
          classroom safety, and review.
        </h2>
        <p className="lead">
          This layer is written for school leadership, ICT teams, and government
          stakeholders. It highlights practical controls, risk posture, and
          transparent implementation evidence.
        </p>

        <table className="metrics-table">
          <thead>
            <tr>
              <th>Control area</th>
              <th>Typical classroom app</th>
              <th>Jewble approach</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {metricsRows.map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td className="highlight">{row[2]}</td>
                <td>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="card-grid">
          {governmentCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <NextGate from="investors" />
      </section>

      <div className="divider" />

      <div className="quote-block">
        <blockquote>
          "Learning outcomes and privacy protections can reinforce each other."
        </blockquote>
        <div className="attr">Blue Snake Studios</div>
      </div>

      <div className="divider" />

      <section className="section" id="strategy">
        <div className="section-label coral">Layer 5 - Assurance</div>
        <h2>Implementation Assurance</h2>
        <p className="lead">
          A practical assurance checklist for leadership decisions, with clear
          focus areas across governance, privacy, operations, and communication.
        </p>

        <div className="strat-grid">
          {assuranceCards.map((card) => (
            <div className={`strat-card s-${card.accent}`} key={card.title}>
              <h4>{card.title}</h4>
              <p>{card.body}</p>
              <div className={`technique ${card.techniqueTone}`}>
                {card.technique}
              </div>
            </div>
          ))}
        </div>

        <NextGate from="strategy" />
      </section>

      <section className="section" id="ads">
        <div className="section-label gold">Layer 6 - Communication</div>
        <h2>Stakeholder Communication Templates</h2>
        <p className="lead">
          Copy-ready templates for parent notices, leadership briefings, and
          government or ICT review notes. Click to copy and adapt to context.
        </p>

        {communicationGroups.map((group) => (
          <div key={group.id} className="ad-group">
            <h3 className={`ad-group-title ${group.tone}`}>{group.label}</h3>
            {group.cards.map((card) => (
              <div className="ad-card" key={card.id}>
                <button
                  className="copy-btn"
                  type="button"
                  onClick={() => copyAd(card)}
                >
                  {copiedAdId === card.id ? "Copied!" : "Copy"}
                </button>
                <div className="platform">{card.platform}</div>
                <div className="headline">{card.headline}</div>
                <div className="body-copy">{card.body}</div>
                <div className="cta-text">{card.cta}</div>
              </div>
            ))}
          </div>
        ))}

        <NextGate from="ads" />
      </section>

      <div className="divider" />

      <section className="section poster-section">
        <img
          className="full-img"
          src="/assets/poster.svg"
          alt="Jewble Meta-Pet poster"
          loading="lazy"
        />
      </section>

      <footer className="footer">
        <div className="footer-tagline">
          Calm technology.
          <br />
          Practical classroom delivery.
        </div>
        <p className="footer-sub">
          Blue Snake Studios - Privacy-first learning systems
        </p>
        <div className="hero-cta footer-cta">
          <a className="btn btn-gold" href="/pet">
            Try MetaPet -&gt;
          </a>
          <a className="btn btn-gold" href="/compass">
            Open Compass Wheel -&gt;
          </a>
          <a
            className="btn btn-ghost"
            href="https://teachers-meta-pet-mr-brand.vercel.app/?as=teacher"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Veil Teacher Hub -&gt;
          </a>
        </div>
        <p className="footer-legal">
          Copyright 2026 Blue Snake Studios - All Jewble branding and creative
          IP remains the property of Blue Snake Studios.
          <br />
          School and Family Briefing v1.2 - February 2026
        </p>
      </footer>
    </div>
  );
}
