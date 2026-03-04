"use client";

import "./landing.css";

const valueProps = [
  {
    title: "Parents",
    subtitle: "Privacy first, calm by design",
    points: [
      "No accounts, no ad tracking, no cloud dependency.",
      "180-digit genome creates true uniqueness and ownership.",
      "Anti-FOMO loops reward healthy breaks, not compulsive taps.",
    ],
  },
  {
    title: "Schools",
    subtitle: "A 2-week pilot with almost zero overhead",
    points: [
      "7-session structure with scripts and reflection prompts.",
      "Works with existing wellbeing and systems-thinking outcomes.",
      "No account management or data-export burden for staff.",
    ],
  },
  {
    title: "Investors",
    subtitle: "Built for regulation-era growth",
    points: [
      "Privacy-by-architecture lowers policy and compliance risk.",
      "Differentiated retention thesis via evolving consciousness model.",
      "Dual path to revenue: direct consumer + education licensing.",
    ],
  },
];

const adSnippets = [
  {
    platform: "Instagram / Facebook",
    headline: "Something noticed you noticing it.",
    body: "Jewble is a private, offline-first companion that helps kids build responsibility and systems thinking without data harvesting.",
    cta: "Meet your Jewble →",
  },
  {
    platform: "LinkedIn (Education)",
    headline: "Classroom tech with no account admin drag.",
    body: "Run a 7-session pilot in two weeks, with scripts and reflection materials included. Zero student account setup.",
    cta: "Request implementation pack →",
  },
  {
    platform: "Investor Outreach",
    headline: "$19.5B TAM meets privacy-native product architecture.",
    body: "Jewble combines educational trust, ethical monetisation, and defensible consciousness systems into a category-defining proposition.",
    cta: "Request the deck →",
  },
];

export default function LandingPage() {
  const copyAd = async (headline: string, body: string, cta: string) => {
    const text = `${headline}\n\n${body}\n\nCTA: ${cta}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op if clipboard is unavailable
    }
  };

  return (
    <main className="jewble-landing">
      <div className="ambient" />
      <nav>
        <div className="brand">Blue Snake <span>Studios</span></div>
        <div className="links">
          <a href="#parents">Parents</a>
          <a href="#schools">Schools</a>
          <a href="#investors">Investors</a>
          <a href="#ads">Ad Copy</a>
        </div>
      </nav>

      <section className="hero">
        <p className="badge">Campaign Pack • 2026</p>
        <h1>Meet <span>Jewble</span></h1>
        <p className="sub">
          A leaner, clearer landing page built from your campaign template: same multi-audience strategy,
          tighter copy, faster scan.
        </p>
        <div className="cta-row">
          <a className="btn solid" href="#parents">For Parents</a>
          <a className="btn ghost" href="#schools">For Schools</a>
          <a className="btn ghost" href="#investors">For Investors</a>
        </div>
      </section>

      <section className="section" id="parents">
        <p className="label teal">Layer 1</p>
        <h2>Parents</h2>
        <p className="lead">Safe by default. Useful by design. Built to feel meaningful without manipulative mechanics.</p>
      </section>

      <section className="section" id="schools">
        <p className="label gold">Layer 2</p>
        <h2>Schools</h2>
        <p className="lead">A practical pilot model that fits existing classrooms, staff workflows, and student wellbeing goals.</p>
      </section>

      <section className="section" id="investors">
        <p className="label violet">Layer 3</p>
        <h2>Investors</h2>
        <p className="lead">Defensible architecture + policy tailwinds + trust-led monetisation.</p>
      </section>

      <section className="section compact-grid">
        {valueProps.map((item) => (
          <article key={item.title} className="card">
            <h3>{item.title}</h3>
            <p className="card-sub">{item.subtitle}</p>
            <ul>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="section" id="ads">
        <p className="label gold">Ready to Deploy</p>
        <h2>Ad Copy Bank</h2>
        <div className="ad-grid">
          {adSnippets.map((ad) => (
            <article key={ad.platform} className="ad">
              <p className="platform">{ad.platform}</p>
              <h3>{ad.headline}</h3>
              <p>{ad.body}</p>
              <div className="ad-footer">
                <span>{ad.cta}</span>
                <button type="button" onClick={() => copyAd(ad.headline, ad.body, ad.cta)}>
                  Copy
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
