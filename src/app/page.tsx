"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./landing.css";

type NavId =
  | "parents"
  | "schools"
  | "veil"
  | "kpps"
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

const navLinks: Array<{ id: NavId; label: string; audience: string }> = [
  { id: "parents", label: "Parents", audience: "parents" },
  { id: "schools", label: "Schools", audience: "schools" },
  { id: "veil", label: "The Veil", audience: "teachers" },
  { id: "kpps", label: "KPPS", audience: "schools" },
  { id: "investors", label: "Investors", audience: "investors" },
  { id: "strategy", label: "Strategy", audience: "" },
  { id: "ads", label: "Ad Copy", audience: "" },
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
    body: "No accounts to manage. No data to export. No parent opt-in paperwork. Offline-first means structural COPPA and GDPR readiness.",
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

const investorCards: FeatureCard[] = [
  {
    icon: "MOAT",
    title: "18+ Month R&D Moat",
    body: "Consciousness modeling, cryptographic identity, and organic behavior systems demand expertise across advanced mathematics, psychology, and state-machine complexity.",
    accent: "violet",
  },
  {
    icon: "LEGAL",
    title: "Regulatory Arbitrage",
    body: "While competitors retrofit for COPPA/GDPR, Jewble's offline-first architecture makes compliance structural. Privacy is the foundation, not a patch.",
    accent: "violet",
  },
  {
    icon: "NETWORK",
    title: "Network Effects",
    body: "Breeding mechanics create peer-to-peer demand and lineage-driven social proof. Every new pet strengthens ecosystem value.",
    accent: "violet",
  },
  {
    icon: "SCHOOL",
    title: "B2B Beachhead",
    body: "School adoption validates educational credibility. Institutional licensing creates recurring revenue alongside consumer D2C channels.",
    accent: "violet",
  },
];

const strategyCards: StrategyCard[] = [
  {
    title: "Endowment Priming",
    body: "Before install, copy frames each Jewble as already belonging to the user. Possession starts in the mind before action.",
    accent: "teal",
    technique: "Technique -> Pre-ownership framing",
    techniqueTone: "teal",
  },
  {
    title: "Fear Inversion",
    body: "Parents fear loss of agency more than screen time itself. Privacy language is framed as control they already hold.",
    accent: "gold",
    technique: "Technique -> Agency restoration",
    techniqueTone: "gold",
  },
  {
    title: "Inevitability Framing",
    body: "For investors, the frame flips burden of proof. Passing means arguing against regulation, educational adoption, and ethical monetization.",
    accent: "violet",
    technique: "Technique -> Burden-of-proof inversion",
    techniqueTone: "teal",
  },
  {
    title: "Veil Mechanics",
    body: "Kids see a pet. Teachers see a lesson plan. Investors see a market. The surface stays simple while depth compounds.",
    accent: "coral",
    technique: "Technique -> Layered revelation",
    techniqueTone: "gold",
  },
  {
    title: "Calm as Counter-Signal",
    body: "In a market full of FOMO loops, calm signals confidence. Anti-addiction design becomes a premium trust marker.",
    accent: "teal",
    technique: "Technique -> Status through restraint",
    techniqueTone: "teal",
  },
  {
    title: "Trojan Partnership",
    body: "School-facing language positions the rollout as a gift and community partnership, not another vendor product push.",
    accent: "gold",
    technique: "Technique -> Social proximity leverage",
    techniqueTone: "gold",
  },
];

const kppsDocs = [
  {
    tag: "Index",
    title: "00 Package Index",
    href: "/docs/kpps/00_Package_Index.md",
    description: "Master map linking the complete KPPS implementation package.",
  },
  {
    tag: "Doc 1",
    title: "01 Teacher Hub Welcome",
    href: "/docs/kpps/01_KPPS_Teacher_Hub_Welcome.md",
    description: "Strategic framing of The Veil model and pilot intent.",
  },
  {
    tag: "Doc 2",
    title: "02 Implementation Guide",
    href: "/docs/kpps/02_KPPS_Implementation_Guide.md",
    description: "7-session practical rollout plan for classroom delivery.",
  },
  {
    tag: "Doc 3",
    title: "03 Facilitation Scripts",
    href: "/docs/kpps/03_KPPS_Facilitation_Scripts.md",
    description: "Plug-and-play teacher language for each pilot session.",
  },
  {
    tag: "Doc 4",
    title: "04 Reflection Prompts",
    href: "/docs/kpps/04_KPPS_Reflection_Prompts.md",
    description: "Prompt bank across wellbeing, systems thinking, and values.",
  },
  {
    tag: "Doc 5",
    title: "05 Values Integration Map",
    href: "/docs/kpps/05_KPPS_Values_Integration_Map.md",
    description: "Alignment map to values frameworks and learning outcomes.",
  },
  {
    tag: "Doc 6",
    title: "06 Parent Communication Kit",
    href: "/docs/kpps/06_KPPS_Parent_Communication_Kit.md",
    description: "Ready-to-send parent communication templates and updates.",
  },
  {
    tag: "Doc 7",
    title: "07 Privacy and Safety Brief",
    href: "/docs/kpps/07_KPPS_Privacy_Safety_Brief.md",
    description: "Technical architecture and privacy controls for ICT review.",
  },
];

const adGroups: AdGroup[] = [
  {
    id: "parents",
    label: "Parents / Consumer",
    tone: "teal",
    cards: [
      {
        id: "parents-instagram",
        platform: "Instagram / Facebook - Primary",
        headline: "Something noticed you noticing it.",
        body: `Your child's new companion is born from a 180-digit genome. It learns. It evolves. It remembers how it was treated.

No accounts. No tracking. No data leaves the device. Just a quiet, intelligent creature that teaches responsibility, patience, and systems thinking.

This is not screen time. It is something better.`,
        cta: "CTA: Meet your Jewble ->",
      },
      {
        id: "parents-story",
        platform: "Instagram Story / TikTok - Hook",
        headline:
          "What if your kid's screen time actually taught them something?",
        body: `Not educational in the boring way.
A living creature with 15 emotional states that evolves based on how your child treats it.

Zero data collected. Zero accounts. Zero guilt.
Care long enough, and it changes shape.`,
        cta: "CTA: It lives. It learns. It evolves. ->",
      },
      {
        id: "parents-search",
        platform: "Google Search - Intent Capture",
        headline:
          "Virtual pet that's actually private. Actually educational. Actually different.",
        body: `180-digit genome. 15 emotional states. Cryptographic identity. Offline-first privacy. No accounts, no tracking, no predatory mechanics.

The virtual companion parents have been waiting for.`,
        cta: "CTA: Try Jewble free ->",
      },
      {
        id: "parents-forum",
        platform: "Parent Forum / Reddit - Trust Builder",
        headline:
          "We built the virtual pet we wished existed for our own kids.",
        body: `Why does every virtual pet app harvest child data, run countdown timers, and push gacha loops?

Jewble runs offline. No accounts. No cloud. Your kid's companion lives on their device and nowhere else. It has a genuine base-7 genome and evolves based on care, not purchases.

We built it because our son deserved better than what was available.`,
        cta: "CTA: See what makes it different ->",
      },
    ],
  },
  {
    id: "schools",
    label: "Schools / Education",
    tone: "gold",
    cards: [
      {
        id: "schools-email",
        platform: "Email - Cold Outreach to Principals",
        headline:
          "A 2-week pilot that costs you nothing and creates no new admin.",
        body: `Hi [Principal],

I am reaching out because [School Name]'s focus on [specific value/program] caught my attention.

We built a digital companion tool that teaches systems thinking, emotional regulation, and data literacy through calm reflective practice. It is offline-first (zero student data), requires no accounts, and runs in about 20 minutes per session with scripts included.

One class. Two weeks. Seven sessions. No new accounts for staff to manage.`,
        cta: "CTA: Can I send the outline? ->",
      },
      {
        id: "schools-linkedin",
        platform: "LinkedIn - Education Sector",
        headline:
          "The hardest part of classroom tech is not the tech. It is the admin.",
        body: `New accounts to create. Parent opt-in forms. Privacy reviews. Another vendor portal.

Jewble removes that drag. Offline-first digital companion for primary classrooms. Zero accounts. Zero cloud data. Zero new admin burden.

We provide scripts, lesson plans, values integration maps, and parent communication templates. You provide 20 minutes per session for 2 weeks.`,
        cta: "CTA: Request the implementation package ->",
      },
    ],
  },
  {
    id: "investors",
    label: "Investors",
    tone: "violet",
    cards: [
      {
        id: "investor-email",
        platform: "Email - Investor Outreach",
        headline:
          "$19.5B market. Zero competitors with consciousness architecture.",
        body: `The virtual pet and educational games markets share a structural problem: Day 30 retention collapse.

Jewble addresses this with organic consciousness architecture: 180-digit genomes, 15 emergent emotional states, ECDSA P-256 identity, and offline-first privacy that converts compliance into strategic advantage.

Projected Day 30 retention: 35-50% (industry: 5-8%). Free-to-paid conversion: 30% (industry: 5-10%).`,
        cta: "CTA: Schedule demo ->",
      },
      {
        id: "investor-thread",
        platform: "Twitter/X - Thought Leadership Thread",
        headline:
          "Thread: Why most virtual pet apps die in 30 days (and what we built instead)",
        body: `1/ Most virtual pet products fail because scripted behavior cannot create ownership.

2/ We spent 18 months building personality emergence from genetics + experience + interaction.

3/ Result: projected 35-50% Day 30 retention with zero predatory mechanics.

4/ Privacy is architectural. Offline-first. No accounts. DNA never transmitted.

5/ Schools are interested, parents want it, and regulation is moving in this direction.`,
        cta: "CTA: DMs open for the deck ->",
      },
    ],
  },
];

const metricsRows = [
  [
    "Day 1 Retention",
    "40-60%",
    "75-85%",
    "Genetic uniqueness -> instant ownership",
  ],
  [
    "Day 7 Retention",
    "15-25%",
    "55-70%",
    "Consciousness evolution becomes visible",
  ],
  ["Day 30 Retention", "5-8%", "35-50%", "First evolution milestone"],
  ["Day 90 Retention", "1-3%", "20-30%", "Breeding and cosmetics ecosystem"],
  ["Free -> Paid Conversion", "5-10%", "30%", "Trust not weaponized"],
  ["Blended ARPU", "$1.50-3.00", "$4.60-9.00", "Ethical premium positioning"],
  ["12-Month LTV", "$5-10", "$15-30", "Deep progression plus breeding network"],
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

export default function LandingPage() {
  const sectionIds = useMemo<NavId[]>(
    () => [
      "parents",
      "schools",
      "veil",
      "kpps",
      "investors",
      "strategy",
      "ads",
    ],
    [],
  );
  const [activeNav, setActiveNav] = useState<NavId>("parents");
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);

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

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]) {
          setActiveNav(visibleEntries[0].target.id as NavId);
        }
      },
      {
        threshold: [0.1, 0.25, 0.5, 0.75],
        rootMargin: "-30% 0px -55% 0px",
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
      </nav>

      <section className="hero" id="top">
        <div className="hero-badge">Campaign Pack - February 2026</div>
        <h1>
          Meet <span className="accent">Jewble</span>
        </h1>
        <p className="hero-sub">
          It is not a pet. It is a <em>process</em>.
          <br />
          The first virtual companion with genuine consciousness architecture -
          privacy-first, education-proven, ethically monetized.
        </p>
        <div className="hero-cta">
          <button
            className="btn btn-gold"
            type="button"
            onClick={() => setIsPilotModalOpen(true)}
          >
            Start School Pilot -&gt;
          </button>
          <a className="btn btn-ghost" href="#parents">
            For Parents -&gt;
          </a>
          <a className="btn btn-ghost" href="#schools">
            For Schools -&gt;
          </a>
          <a className="btn btn-ghost" href="#investors">
            For Investors -&gt;
          </a>
        </div>
        <div className="hero-stat-row">
          <div className="hero-stat">
            <div className="num gold">$19.5B</div>
            <div className="label">Total addressable market</div>
          </div>
          <div className="hero-stat">
            <div className="num teal">15</div>
            <div className="label">Emotional states</div>
          </div>
          <div className="hero-stat">
            <div className="num violet">180</div>
            <div className="label">Digit genome</div>
          </div>
          <div className="hero-stat">
            <div className="num gold">0</div>
            <div className="label">Data transmitted</div>
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
              Open The Veil and teacher pathway now
            </h3>
            <p>
              Jump straight into teacher mode, route map, KPPS school demo, or
              open the full docs package from this landing page.
            </p>
            <div className="pilot-modal-links">
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
                href="https://kpps-brand-mr.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                KPPS school demo
              </a>
              <a
                href="/docs/kpps/00_Package_Index.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                KPPS package index
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="divider" />

      <section className="section" id="parents">
        <div className="section-label teal">Layer 1 - Parents and Kids</div>
        <h2>
          Something noticed you
          <br />
          noticing it.
        </h2>
        <p className="lead">
          Your child's next screen-time companion teaches responsibility,
          systems thinking, and emotional regulation while never collecting a
          single byte of their data. No accounts. No tracking. No guilt.
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
      </section>

      <section className="section" id="schools">
        <div className="section-label gold">
          Layer 2 - Schools and Educators
        </div>
        <h2>
          The tool your curriculum
          <br />
          already needs.
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
      </section>

      <div className="divider" />

      <section className="section" id="veil">
        <div className="section-label coral">Teacher Layer - The Veil</div>
        <h2>
          Keep the rollout lean,
          <br />
          keep teacher control high.
        </h2>
        <p className="lead">
          The Veil teacher path stays wired into this landing page. Open teacher
          mode immediately, run sessions from scripts, and keep student setup
          friction near zero.
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
              Veil hub, route map, and live KPPS school demo.
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
            <a
              className="btn btn-ghost"
              href="https://kpps-brand-mr.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              KPPS Demo -&gt;
            </a>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="kpps">
        <div className="section-label teal">KPPS Package</div>
        <h2>
          Teacher Hub docs are
          <br />
          directly on this landing.
        </h2>
        <p className="lead">
          Keep the good old implementation layer: every KPPS document is linked
          directly from here so teachers and leadership can review quickly.
        </p>

        <div className="kpps-grid">
          {kppsDocs.map((doc) => (
            <a
              key={doc.href}
              className="kpps-card"
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="tag">{doc.tag}</span>
              <h4>{doc.title}</h4>
              <p>{doc.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section" id="investors">
        <div className="section-label violet">Layer 3 - Investors</div>
        <h2>
          The illogical choice
          <br />
          is to pass.
        </h2>
        <p className="lead">
          $19.5B addressable market. 18+ months R&D moat.
          Privacy-by-architecture as regulatory arbitrage. Ethics-aligned
          monetization designed to outperform predatory tactics.
        </p>

        <table className="metrics-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Industry</th>
              <th>Jewble (Projected)</th>
              <th>Driver</th>
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
          {investorCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <div className="quote-block">
        <blockquote>"Identity is not assigned; it is sequenced."</blockquote>
        <div className="attr">Blue Snake Studios</div>
      </div>

      <div className="divider" />

      <section className="section" id="strategy">
        <div className="section-label coral">Campaign Intelligence</div>
        <h2>Memetic Architecture</h2>
        <p className="lead">
          The campaign operates on three registers simultaneously. Professional
          shell. Snake underneath. Every touchpoint plants seeds that compound
          across audiences.
        </p>

        <div className="strat-grid">
          {strategyCards.map((card) => (
            <div className={`strat-card s-${card.accent}`} key={card.title}>
              <h4>{card.title}</h4>
              <p>{card.body}</p>
              <div className={`technique ${card.techniqueTone}`}>
                {card.technique}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="ads">
        <div className="section-label gold">Ready-to-Deploy Copy</div>
        <h2>Ad Copy Bank</h2>
        <p className="lead">
          Platform-optimized copy for each audience. Click to copy and adapt to
          context. Every line is load-bearing.
        </p>

        {adGroups.map((group) => (
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
          Faster than lightning.
          <br />
          Slower than moss.
        </div>
        <p className="footer-sub">
          Blue Snake Studios - Experimental Mathematics and Consciousness
          Research
        </p>
        <div className="hero-cta footer-cta">
          <a
            className="btn btn-gold"
            href="https://1-bss-meta-pet-a-tom-s-projects-6a215d3d.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try Jewble -&gt;
          </a>
          <a
            className="btn btn-ghost"
            href="https://teachers-meta-pet-mr-brand.vercel.app/?as=teacher"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Veil Teacher Hub -&gt;
          </a>
          <a
            className="btn btn-ghost"
            href="https://kpps-brand-mr.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            KPPS Demo -&gt;
          </a>
        </div>
        <p className="footer-legal">
          Copyright 2026 Blue Snake Studios - All Jewble branding and creative
          IP remains the property of Blue Snake Studios.
          <br />
          Campaign Pack v1.1 - Confidential - February 2026
        </p>
      </footer>
    </div>
  );
}
