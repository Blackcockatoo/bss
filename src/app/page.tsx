"use client";

import "./landing.css";

const appSections = [
  {
    id: "main-app",
    label: "Main Meta Pet App",
    tone: "teal",
    href: "/pet",
    cta: "Open Main App",
    points: [
      "Live companion simulation with vitals, evolution, and response overlays.",
      "Advanced mechanics lab: identity, addons, profile tooling, and secure systems visibility.",
      "Designed for calm engagement: meaningful progression without ad-tech dependencies.",
    ],
  },
  {
    id: "teacher-hub",
    label: "Teachers Hub / Classroom App",
    tone: "gold",
    href: "/school-game",
    cta: "Open Teachers Hub",
    points: [
      "Classroom queue and lesson activation flows for practical session management.",
      "Gamified challenge loops for short, measurable engagement cycles in class contexts.",
      "Built to pair with pilot scripts, reflection prompts, and school rollout docs.",
    ],
  },
];

const kppsDocs = [
  "Package index",
  "Teacher Hub welcome",
  "Implementation guide",
  "Facilitation scripts",
  "Reflection prompts",
  "Values integration map",
  "Parent communication kit",
  "Privacy & safety brief",
];

const audienceCards = [
  {
    audience: "Parents",
    accent: "teal",
    headline: "Something noticed you noticing it.",
    body: "A private, offline-first companion that teaches responsibility and systems thinking with no account setup, no tracking, and no manipulative timers.",
  },
  {
    audience: "Schools",
    accent: "gold",
    headline: "A 2-week pilot with near-zero admin overhead.",
    body: "Seven structured sessions, reflection scripts, and values alignment—all designed to fit existing teaching workflows.",
  },
  {
    audience: "Investors",
    accent: "violet",
    headline: "Privacy-native architecture in a $19.5B opportunity zone.",
    body: "Retention upside, policy tailwinds, and dual distribution paths through direct consumer and education channels.",
  },
];

const adSnippets = [
  {
    platform: "Instagram / Facebook",
    headline: "A digital companion that never sells your child.",
    body: "Jewble runs offline-first with no account requirements and no behavioural tracking. Kids build patience, care routines, and systems thinking.",
    cta: "Meet your Jewble →",
  },
  {
    platform: "LinkedIn / Education",
    headline: "The classroom wellbeing pilot with no dashboard drag.",
    body: "Deploy in two weeks with seven sessions, facilitator language, and parent communication templates.",
    cta: "Request the implementation pack →",
  },
  {
    platform: "Investor Outreach",
    headline: "Category shift: post-adtech kids products are investable.",
    body: "Jewble combines trust-first product design, education adoption leverage, and retention mechanics grounded in uniqueness and progression.",
    cta: "Request the investor brief →",
  },
];

export default function LandingPage() {
  const copyAd = async (headline: string, body: string, cta: string) => {
    const text = `${headline}\n\n${body}\n\nCTA: ${cta}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  return (
    <main className="jewble-landing">
      <div className="ambient" />

      <nav>
        <div className="brand">Blue Snake <span>Studios</span></div>
        <div className="links">
          <a href="#audiences">Audiences</a>
          <a href="#main-app">Main App</a>
          <a href="#teacher-hub">Teachers Hub</a>
          <a href="#kpps">KPPS Docs</a>
          <a href="#ads">Ad Copy</a>
        </div>
      </nav>

      <section className="hero">
        <p className="badge">Campaign Pack • Meta-Pet + Teachers Hub</p>
        <h1>Meet <span>Jewble</span></h1>
        <p className="sub">
          Rebuilt with the full story back in: parents, schools, investors, the main Meta-Pet app,
          and the Teachers Hub rollout layer in one landing flow.
        </p>
        <div className="cta-row">
          <a className="btn solid" href="/pet">Open Main App</a>
          <a className="btn ghost" href="/school-game">Open Teachers Hub</a>
          <a className="btn ghost" href="#kpps">View KPPS docs</a>
        </div>
      </section>

      <section className="section" id="audiences">
        <p className="label teal">Audience Layers</p>
        <h2>Parents, Schools, and Investors—together</h2>
        <div className="grid3">
          {audienceCards.map((card) => (
            <article className="card" key={card.audience}>
              <p className={`chip ${card.accent}`}>{card.audience}</p>
              <h3>{card.headline}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {appSections.map((section) => (
        <section className="section" id={section.id} key={section.id}>
          <p className={`label ${section.tone}`}>{section.label}</p>
          <h2>{section.label}</h2>
          <ul className="bullets">
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <a className="btn solid" href={section.href}>{section.cta}</a>
        </section>
      ))}

      <section className="section" id="kpps">
        <p className="label gold">KPPS Teacher Hub Package</p>
        <h2>All key rollout materials included</h2>
        <p className="sub left">
          The landing now brings back the complete school package surface area so leadership,
          teachers, and ICT reviewers can see the full implementation story.
        </p>
        <div className="doc-grid">
          {kppsDocs.map((doc) => (
            <article className="doc" key={doc}>{doc}</article>
          ))}
        </div>
      </section>

      <section className="section" id="ads">
        <p className="label violet">Ready-to-Deploy Copy</p>
        <h2>Ad Copy Bank</h2>
        <div className="grid3">
          {adSnippets.map((ad) => (
            <article className="card" key={ad.platform}>
              <p className="platform">{ad.platform}</p>
              <h3>{ad.headline}</h3>
              <p>{ad.body}</p>
              <div className="ad-footer">
                <span>{ad.cta}</span>
                <button type="button" onClick={() => copyAd(ad.headline, ad.body, ad.cta)}>Copy</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
