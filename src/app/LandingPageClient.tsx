"use client";

import { SteeringWheel } from "@/components/steering";
import { useMemo, useState } from "react";
import "./landing.css";

type NavId = "home" | "why" | "play" | "gallery" | "launch";
type AccentTone = "gold" | "teal" | "violet" | "coral";

type FeatureCard = {
  icon: string;
  title: string;
  body: string;
  accent: AccentTone;
};

type LabyrinthNode = {
  id: NavId;
  chamber: string;
  title: string;
  body: string;
  accent: AccentTone;
};

const navLinks: Array<{ id: NavId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "why", label: "Why MetaPet" },
  { id: "play", label: "Play" },
  { id: "gallery", label: "Gallery" },
  { id: "launch", label: "Launch" },
];

const pathNodes: LabyrinthNode[] = [
  {
    id: "home",
    chamber: "Step 01",
    title: "Meet your MetaPet",
    body: "A calm, private digital companion that evolves as kids care for it.",
    accent: "teal",
  },
  {
    id: "why",
    chamber: "Step 02",
    title: "Learn through care",
    body: "Daily interaction builds systems thinking, responsibility, and emotional awareness.",
    accent: "gold",
  },
  {
    id: "play",
    chamber: "Step 03",
    title: "Explore and discover",
    body: "Jump into quests, companion care, and the Compass Wheel to guide adventures.",
    accent: "coral",
  },
  {
    id: "gallery",
    chamber: "Step 04",
    title: "See the vibe",
    body: "A bright visual world centered around the MetaPet experience.",
    accent: "violet",
  },
  {
    id: "launch",
    chamber: "Step 05",
    title: "Start instantly",
    body: "Open MetaPet and begin the journey in one click.",
    accent: "teal",
  },
];

const featureCards: FeatureCard[] = [
  {
    icon: "DNA",
    title: "Unique by design",
    body: "Each MetaPet has its own identity and growth path, so every journey feels personal.",
    accent: "teal",
  },
  {
    icon: "LOCK",
    title: "Private and safe",
    body: "Offline-first with no account setup required for core play.",
    accent: "gold",
  },
  {
    icon: "HEART",
    title: "Calm engagement",
    body: "Designed for healthy rhythms and reflection instead of pressure loops.",
    accent: "violet",
  },
  {
    icon: "SPARK",
    title: "Fun with purpose",
    body: "Care routines and mini challenges blend creativity with learning.",
    accent: "coral",
  },
];

const showcaseImages = [
  {
    src: "/assets/companion1.svg",
    alt: "MetaPet companion",
    fallbackLabel: "Companion",
  },
  {
    src: "/assets/adventures.svg",
    alt: "MetaPet adventures",
    fallbackLabel: "Adventure",
  },
  {
    src: "/assets/companion2.svg",
    alt: "Evolving MetaPet",
    fallbackLabel: "Evolution",
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
  const currentIndex = pathNodes.findIndex((node) => node.id === from);
  const nextNode = pathNodes[currentIndex + 1];

  if (!nextNode) {
    return (
      <div className="next-gate">
        <span>Path complete</span>
        <a href="#home">Back to top -&gt;</a>
      </div>
    );
  }

  return (
    <div className="next-gate">
      <span>Next</span>
      <a href={`#${nextNode.id}`}>
        {nextNode.chamber} - {nextNode.title} -&gt;
      </a>
    </div>
  );
}

export default function LandingPage() {
  const defaultNode = useMemo(() => pathNodes[0], []);
  const [activeNav, setActiveNav] = useState<NavId>(defaultNode.id);

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
                className={activeNav === link.id ? "active" : ""}
                onClick={() => setActiveNav(link.id)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <a className="nav-launch" href="/pet">
            Open MetaPet
          </a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-badge">MetaPet Experience</div>
        <h1>
          Meet <span className="accent">MetaPet</span>
        </h1>
        <p className="hero-sub">
          A streamlined home for the companion experience.
          <br />
          Play, care, and explore in a calm digital world.
        </p>
        <div className="hero-cta">
          <a className="btn btn-gold" href="/pet">
            Open MetaPet App -&gt;
          </a>
          <a className="btn btn-gold" href="/compass">
            Open Compass Wheel -&gt;
          </a>
          <a className="btn btn-ghost" href="#why">
            See Why -&gt;
          </a>
        </div>
        <div className="hero-stat-row">
          <div className="hero-stat">
            <div className="num gold">180-digit</div>
            <div className="label">Digital DNA style identity</div>
          </div>
          <div className="hero-stat">
            <div className="num teal">15 states</div>
            <div className="label">Expressive emotional range</div>
          </div>
          <div className="hero-stat">
            <div className="num violet">offline-first</div>
            <div className="label">Core play works locally</div>
          </div>
          <div className="hero-stat">
            <div className="num gold">0 ads</div>
            <div className="label">No ad pressure loops</div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="pathway" id="why">
        <div className="pathway-header">
          <div className="section-label teal">MetaPet Path</div>
          <h2>Simple flow. Clear focus. Pure MetaPet.</h2>
          <p>
            This page now focuses only on the companion journey: what it is,
            why it matters, and where to jump in.
          </p>
        </div>
        <div className="pathway-grid">
          {pathNodes.map((node, index) => (
            <a
              key={node.id}
              href={`#${node.id}`}
              className={`path-node ${node.accent} ${activeNav === node.id ? "active" : ""} ${
                pathNodes.findIndex((item) => item.id === activeNav) >= index
                  ? "reached"
                  : ""
              }`}
            >
              <span className="path-node-tag">{node.chamber}</span>
              <h3>{node.title}</h3>
              <p>{node.body}</p>
              <span className="path-node-link">Open step -&gt;</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section" id="play">
        <div className="section-label coral">Core Experience</div>
        <h2>
          Everything here points to
          <br />
          your MetaPet journey.
        </h2>
        <p className="lead">
          No school, investor, or policy detours. Just the experience, the
          companion, and direct access to play.
        </p>

        <div className="card-grid">
          {featureCards.map((card) => (
            <div className="card" key={card.title}>
              <div className={`card-accent ${card.accent}`} />
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="compass-inline-shell" id="compass-wheel">
          <SteeringWheel />
        </div>

        <NextGate from="play" />
      </section>

      <div className="divider" />

      <section className="section" id="gallery">
        <div className="section-label violet">Visuals</div>
        <h2>MetaPet world snapshots</h2>
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

        <NextGate from="gallery" />
      </section>

      <section className="section" id="launch">
        <div className="section-label gold">Launch</div>
        <h2>Ready to start?</h2>
        <p className="lead">Open MetaPet and begin.</p>
        <div className="hero-cta">
          <a className="btn btn-gold" href="/pet">
            Launch MetaPet -&gt;
          </a>
          <a className="btn btn-ghost" href="/compass">
            Open Compass Wheel -&gt;
          </a>
        </div>
      </section>

      <div className="divider" />

      <footer className="footer">
        <div className="footer-tagline">
          Calm technology.
          <br />
          Real companion vibes.
        </div>
        <p className="footer-sub">Blue Snake Studios - MetaPet</p>
        <div className="hero-cta footer-cta">
          <a className="btn btn-gold" href="/pet">
            Try MetaPet -&gt;
          </a>
          <a className="btn btn-gold" href="/compass">
            Open Compass Wheel -&gt;
          </a>
        </div>
      </footer>
    </div>
  );
}
