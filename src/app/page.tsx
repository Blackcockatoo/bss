"use client";

import { useEffect, useRef } from "react";
import "./landing.css";

export default function LandingPage() {
  const adCards = [
    {
      platform: "Meta / Instagram",
      audience: "Parents",
      headline: "A digital pet that never sells your child.",
      body:
        "Jewble is an offline-first companion app with no ads, no surveillance, and no account setup. Kids grow a calm creature while building reflection habits and systems thinking.",
      cta: "Join the pilot waitlist.",
    },
    {
      platform: "LinkedIn",
      audience: "School leaders",
      headline: "The classroom wellbeing pilot with zero admin drag.",
      body:
        "Deploy in minutes with no student accounts and no dashboard overhead. Teacher Hub includes pairing cards, facilitation scripts, and privacy-first implementation guides.",
      cta: "Request the KPPS implementation pack.",
    },
    {
      platform: "X / Threads",
      audience: "Investors & partners",
      headline: "Category shift: post-adtech kids products are now investable.",
      body:
        "Jewble combines privacy-by-design architecture, education distribution, and retention-led product loops in a market where regulation is accelerating differentiation.",
      cta: "Request the investor briefing packet.",
    },
  ];

  const kppsDocs = [
    {
      title: "Package index",
      tag: "Start here",
      href: "/docs/kpps/00_Package_Index.md",
      description:
        "Overview of the full KPPS Teacher Hub package, audience pathways, and rollout steps.",
    },
    {
      title: "Teacher Hub welcome",
      tag: "Document 1",
      href: "/docs/kpps/01_KPPS_Teacher_Hub_Welcome.md",
      description:
        "Strategic framing of The Veil model, mission fit, and the pilot context for schools.",
    },
    {
      title: "Implementation guide",
      tag: "Document 2",
      href: "/docs/kpps/02_KPPS_Implementation_Guide.md",
      description:
        "Seven-session classroom roadmap aligned to the KPPS gradual release structure.",
    },
    {
      title: "Facilitation scripts",
      tag: "Document 3",
      href: "/docs/kpps/03_KPPS_Facilitation_Scripts.md",
      description:
        "Plug-and-play teacher language and transition cues for each pilot session.",
    },
    {
      title: "Reflection prompts",
      tag: "Document 4",
      href: "/docs/kpps/04_KPPS_Reflection_Prompts.md",
      description:
        "Printable and digital prompt bank across wellbeing, systems thinking, and values.",
    },
    {
      title: "Values integration map",
      tag: "Document 5",
      href: "/docs/kpps/05_KPPS_Values_Integration_Map.md",
      description:
        "Leadership-level alignment to KPPS values, policy intent, and success metrics.",
    },
    {
      title: "Parent communication kit",
      tag: "Document 6",
      href: "/docs/kpps/06_KPPS_Parent_Communication_Kit.md",
      description:
        "Ready-to-send Sentral and newsletter templates for pre, mid, and post-pilot updates.",
    },
    {
      title: "Privacy & safety brief",
      tag: "Document 7",
      href: "/docs/kpps/07_KPPS_Privacy_Safety_Brief.md",
      description:
        "Technical architecture and privacy-by-design controls for ICT and leadership review.",
    },
  ];

  const marketRows = [
    ["Global educational apps", "$6.4B", "$19.5B", "14.9%"],
    ["Social emotional learning tech", "$2.1B", "$7.9B", "17.9%"],
    ["Child-safe digital wellbeing", "$1.2B", "$4.6B", "18.3%"],
  ];

  const regulatoryRows = [
    ["Children's Privacy Code", "Active", "Raises compliance costs", "Offline-first, zero-ad telemetry baseline"],
    ["Age Appropriate Design", "Expanding", "Limits behavioural targeting", "No behavioural ads or dark patterns"],
    ["School procurement standards", "Tightening", "Longer due diligence", "Teacher Hub package and privacy briefs ready"],
  ];

  const actionPlan = [
    "Close 3 pilot schools and capture baseline-to-outcome evidence.",
    "Publish parent and teacher testimonials with quantified engagement deltas.",
    "Open partner pipeline for district rollout and education channel licensing.",
    "Expand premium roadmap: cosmetics, cloud backup, and curriculum modules.",
  ];

  const cosmosRef = useRef<HTMLCanvasElement>(null);
  const h7Ref = useRef<SVGPolygonElement>(null);
  const h7bRef = useRef<SVGPolygonElement>(null);
  const h7cRef = useRef<SVGPolygonElement>(null);
  const spokesRef = useRef<SVGGElement>(null);

  function heptPoints(cx: number, cy: number, r: number, offset = 0) {
    const pts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + offset - Math.PI / 2;
      pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    return pts.join(" ");
  }

  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => {
      document.body.classList.remove("landing-body");
    };
  }, []);

  function copyAd(headline: string, body: string, cta: string) {
    const text = `${headline}\n\n${body}\n\n${cta}`;
    navigator.clipboard.writeText(text).catch(() => undefined);
  }

  useEffect(() => {
    const canvas = cosmosRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let animId: number;

    interface Star {
      x: number;
      y: number;
      r: number;
      a: number;
      speed: number;
    }

    const stars: Star[] = [];

    class Snake {
      x = 0;
      y = 0;
      angle = 0;
      speed = 0;
      life = 0;
      maxLife = 0;
      hue: "gold" | "teal" = "gold";
      r = 0;
      trail: { x: number; y: number }[] = [];

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * 2000;
        this.y = Math.random() * 2000;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.3 + Math.random() * 0.7;
        this.life = 0;
        this.maxLife = 200 + Math.random() * 300;
        this.hue = Math.random() < 0.6 ? "gold" : "teal";
        this.r = Math.random() * 0.8 + 0.3;
        this.trail = [];
      }

      update() {
        this.angle += (Math.random() - 0.5) * 0.08;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life++;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 30) this.trail.shift();
        if (this.life > this.maxLife) this.reset();
      }

      draw(c: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;
        const pct = this.life / this.maxLife;
        const fade = Math.sin(pct * Math.PI);
        c.beginPath();
        c.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          c.lineTo(this.trail[i].x, this.trail[i].y);
        }
        c.strokeStyle =
          this.hue === "gold"
            ? `rgba(245,200,76,${fade * 0.15})`
            : `rgba(77,214,200,${fade * 0.12})`;
        c.lineWidth = this.r;
        c.stroke();
      }
    }

    const snakes: Snake[] = [];

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        speed: 0.0003 + Math.random() * 0.0008,
      });
    }

    for (let i = 0; i < 40; i++) snakes.push(new Snake());

    let t = 0;
    ctx!.fillStyle = "#040810";
    ctx!.fillRect(0, 0, W, H);

    function loop() {
      ctx!.fillStyle = "rgba(4,8,16,.06)";
      ctx!.fillRect(0, 0, W, H);
      t += 0.005;

      for (const s of stars) {
        s.a = 0.3 + Math.sin(t * s.speed * 200 + s.x) * 0.3;
        ctx!.beginPath();
        ctx!.arc(s.x % W, s.y % H, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(221,232,245,${s.a})`;
        ctx!.fill();
      }

      for (const s of snakes) {
        s.update();
        s.draw(ctx!);
      }

      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    if (h7Ref.current)
      h7Ref.current.setAttribute("points", heptPoints(110, 110, 98));
    if (h7bRef.current)
      h7bRef.current.setAttribute("points", heptPoints(110, 110, 68));
    if (h7cRef.current)
      h7cRef.current.setAttribute("points", heptPoints(110, 110, 38));

    const sp = spokesRef.current;
    if (sp) {
      sp.innerHTML = "";
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", "110");
        line.setAttribute("y1", "110");
        line.setAttribute("x2", String(110 + 98 * Math.cos(a)));
        line.setAttribute("y2", String(110 + 98 * Math.sin(a)));
        line.setAttribute("stroke", "#f5c84c");
        line.setAttribute("stroke-width", ".5");
        sp.appendChild(line);
      }
    }
  }, []);



  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target
              .querySelectorAll(".card,.link-card,.tl-item")
              .forEach((c, i) => {
                (c as HTMLElement).style.transitionDelay = `${i * 0.08}s`;
                c.classList.add("visible");
              });
          }
        }
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".landing .reveal").forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing">
      <canvas ref={cosmosRef} className="landing-cosmos" />
      <div className="landing-grain" />

      {/* ── NAV ── */}
      <nav className="landing-nav">
        <a className="logo" href="#top">
          <svg className="logo-mark" viewBox="0 0 28 28">
            <polygon points="14,2 25,8.5 25,19.5 14,26 3,19.5 3,8.5" fill="none" stroke="#f5c84c" strokeWidth="1.2" opacity=".6" />
            <polygon points="14,6 22,10.5 22,17.5 14,22 6,17.5 6,10.5" fill="none" stroke="#4dd6c8" strokeWidth=".8" opacity=".5" />
            <circle cx="14" cy="14" r="3" fill="#f5c84c" opacity=".9" />
          </svg>
          <span className="logo-text">
            Blue Snake <span>Studios</span>
          </span>
        </a>
        <div className="nav-r">
          <a href="#why-now">Why Now</a>
          <a href="#what-jewble-is">What It Is</a>
          <a href="#for-teachers">For Teachers</a>
          <a href="#kpps-package">KPPS Pack</a>
          <a href="#student-experience">Student App</a>
          <a href="#evidence">Evidence</a>
          <a href="#investor-brief">Investor Brief</a>
          <a href="https://bluesnakestudios.com/" target="_blank" rel="noopener noreferrer">BlueSnakeStudios.com</a>
          <a className="cta-nav" href="#get-involved">Start a Pilot</a>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="hero" id="top">
        <div className="hero-eyebrow">For Australian classrooms</div>
        <h1>
          A privacy-first virtual companion that teaches systems thinking
          <br />
          — built by a local parent for Australian classrooms.
        </h1>
        <p className="hero-sub">
          <em>Faster than lightning. Slower than moss.</em>
        </p>
        <div className="hero-actions">
          <a className="btn btn-gold" href="https://teachers-meta-pet-mr-brand.vercel.app/" target="_blank" rel="noopener noreferrer">Start a Free Pilot</a>
          <a className="btn btn-ghost" href="https://bluesnakestudios.com/" target="_blank" rel="noopener noreferrer">Visit BlueSnakeStudios.com</a>
          <a className="btn btn-ghost" href="mailto:hello@bluesnakestudios.com.au?subject=Curriculum%20Pack%20Request">Request a Curriculum Pack</a>
        </div>

        <div className="hepta-ring">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f5c84c" stopOpacity=".4" />
                <stop offset="100%" stopColor="#4dd6c8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="hepta-outer"><polygon ref={h7Ref} fill="none" stroke="#f5c84c" strokeWidth=".8" opacity=".35" /></g>
            <g className="hepta-mid"><polygon ref={h7bRef} fill="none" stroke="#4dd6c8" strokeWidth=".6" opacity=".3" /></g>
            <g className="hepta-inner"><polygon ref={h7cRef} fill="none" stroke="#a78bfa" strokeWidth=".5" opacity=".25" /></g>
            <g ref={spokesRef} opacity=".18" />
            <circle cx="110" cy="110" r="60" fill="url(#rg)" />
            <circle cx="110" cy="110" r="4" fill="#f5c84c" opacity=".9" />
            <circle cx="110" cy="110" r="8" fill="none" stroke="#f5c84c" className="pulse-ring" />
          </svg>
        </div>

        <p className="lead" style={{ marginBottom: 0, maxWidth: "760px" }}>
          180-digit base-7 genome. 15 emotional states. Zero data collected.
        </p>
      </section>

      <div className="divider" />

      <section className="section" id="parents">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Layer 1 — Parents &amp; kids</span>
          <h2 className="reveal">Something noticed you noticing it.</h2>
          <p className="lead reveal">
            A privacy-first companion that teaches systems thinking, responsibility, and emotional
            regulation without harvesting data. No accounts. No tracking. No ad-tech loops.
          </p>
          <div className="campaign-card-grid reveal">
            <div className="card"><div className="card-top t" /><h4>Genuinely unique</h4><p>180-digit base-7 genome with mathematically unique identity and expression.</p></div>
            <div className="card"><div className="card-top t" /><h4>Privacy by architecture</h4><p>Offline-first runtime with local-only core data model and no default tracking.</p></div>
            <div className="card"><div className="card-top t" /><h4>Screen-time with substance</h4><p>15 emotional states and care loops that teach feedback, cause/effect, and reflection.</p></div>
            <div className="card"><div className="card-top t" /><h4>Anti-addiction design</h4><p>Progression pacing rewards consistency and breaks over binge behaviour.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="schools">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Layer 2 — Schools &amp; educators</span>
          <h2 className="reveal">The tool your curriculum already needs.</h2>
          <p className="lead reveal">
            A structured two-week implementation path designed for real classrooms: light setup,
            practical scripts, and evidence-aligned outcomes.
          </p>
          <div className="campaign-card-grid reveal">
            <div className="card"><div className="card-top g" /><h4>Complete implementation package</h4><p>Session guides, scripts, reflection prompts, values mapping, and parent comms templates.</p></div>
            <div className="card"><div className="card-top g" /><h4>Curriculum alignment</h4><p>Supports Digital Technologies, wellbeing practice, and systems-thinking pedagogy.</p></div>
            <div className="card"><div className="card-top g" /><h4>Zero teacher overhead</h4><p>No student account admin workflows for baseline deployment.</p></div>
            <div className="card"><div className="card-top g" /><h4>Measurable outcomes</h4><p>Supports reporting around engagement, wellbeing language, and digital-safety posture.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="investors">
        <div className="wrap">
          <span className="section-tag t-violet reveal">Layer 3 — Investors</span>
          <h2 className="reveal">The illogical choice is to pass.</h2>
          <p className="lead reveal">Market momentum, regulatory change, and ethical monetisation are converging.</p>
          <div className="briefing-table-wrap reveal">
            <table className="briefing-table">
              <thead><tr><th>Metric</th><th>Industry</th><th>Jewble (Projected)</th><th>Driver</th></tr></thead>
              <tbody>
                <tr><td>Day 30 retention</td><td>5–8%</td><td>35–50%</td><td>Visible consciousness and evolution loops</td></tr>
                <tr><td>Free→Paid conversion</td><td>5–10%</td><td>Up to 30%</td><td>Trust-led premium positioning</td></tr>
                <tr><td>12-month LTV</td><td>$5–10</td><td>$15–30</td><td>Deep progression plus cosmetic/education layers</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="strategy">
        <div className="wrap">
          <span className="section-tag" style={{ color: "var(--coral)" }}>Campaign intelligence</span>
          <h2 className="reveal">Memetic architecture</h2>
          <p className="lead reveal">Three audience registers: parents, schools, and investors — one coherent thesis.</p>
          <div className="campaign-card-grid reveal">
            <div className="card"><div className="card-top t" /><h4>Endowment priming</h4><p>Pre-ownership language increases emotional commitment before install.</p></div>
            <div className="card"><div className="card-top g" /><h4>Fear inversion</h4><p>Privacy claims are framed as parent and school agency, not compliance jargon.</p></div>
            <div className="card"><div className="card-top v" /><h4>Inevitability framing</h4><p>Regulatory and category shifts make the thesis easier to validate over time.</p></div>
            <div className="card"><div className="card-top c" /><h4>Veil mechanics</h4><p>Simple interface, deep systems learning, layered for each stakeholder audience.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="ads">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Ready-to-deploy copy</span>
          <h2 className="reveal">Ad copy bank</h2>
          <p className="lead reveal">Platform-ready baseline messaging for immediate outreach and campaign testing.</p>
          <div className="ad-card-grid reveal">
            {adCards.map((ad) => (
              <div className="ad-copy-card" key={ad.headline}>
                <div className="ad-copy-top">
                  <span className="ad-platform">{ad.platform}</span>
                  <button type="button" className="ad-copy-btn" onClick={() => copyAd(ad.headline, ad.body, ad.cta)}>Copy</button>
                </div>
                <div className="ad-audience">{ad.audience}</div>
                <h4>{ad.headline}</h4>
                <p>{ad.body}</p>
                <p className="ad-cta">{ad.cta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 2: WHY NOW ── */}
      <section className="section" id="why-now">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Why now</span>
          <h2 className="reveal">Schools need tools built for the next wave of regulation.</h2>
          <p className="lead reveal">
            The landscape is shifting fast. Privacy codes, social-media bans, and data breaches
            are changing what &ldquo;safe&rdquo; means in a classroom.
          </p>
          <ul className="context-list reveal">
            <li>
              <span className="cl-marker" />
              <span>
                <strong>Parents want ad-free, educational apps.</strong> 58&nbsp;% of Australian parents
                now prefer ad-free content for their children; 47&nbsp;% cite data privacy as a top concern.
                Schools that adopt privacy-first tools are aligning with what families already expect.
              </span>
            </li>
            <li>
              <span className="cl-marker" />
              <span>
                <strong>The Children&apos;s Online Privacy Code is coming.</strong> Combined with
                the January 2026 Department of Education data breach, schools face growing pressure to minimise
                data exposure. Jewble&apos;s offline-first design means there is nothing to breach.
              </span>
            </li>
            <li>
              <span className="cl-marker" />
              <span>
                <strong>Social media restrictions are tightening.</strong> New under-16 bans and
                reduced screen-time mandates in Victoria mean schools need calm, curriculum-aligned
                alternatives — not another app that competes for attention.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 3: WHAT JEWBLE IS — DIFFERENTIATORS ── */}
      <section className="section" id="what-jewble-is">
        <div className="wrap">
          <span className="section-tag t-teal reveal">What Jewble is</span>
          <h2 className="reveal">Five properties no other classroom tool has.</h2>
          <p className="lead reveal">
            Jewble isn&apos;t a game, a chatbot, or a screen-time app. It&apos;s a virtual companion
            built on mathematical architecture.
          </p>

          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top g" />
              <span className="pill pill-gold"><span className="pill-dot" />Genome</span>
              <h4>Genomic Identity</h4>
              <p>Each companion&apos;s 180-digit base-7 genome is mathematically unrepeatable, determining personality and evolution paths.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <span className="pill pill-teal"><span className="pill-dot" />Consciousness</span>
              <h4>Organic Consciousness</h4>
              <p>15 emotion states driven by genetics and lived experience — not scripted loops.</p>
            </div>
            <div className="card">
              <div className="card-top v" />
              <span className="pill pill-violet"><span className="pill-dot" />Cryptography</span>
              <h4>Cryptographic Self</h4>
              <p>ECDSA P-256 signatures and visual HeptaCode identity. No central authority can counterfeit your pet.</p>
            </div>
          </div>

          <div className="grid-2 reveal" style={{ marginTop: "14px" }}>
            <div className="card">
              <div className="card-top g" />
              <span className="pill pill-gold"><span className="pill-dot" />Privacy</span>
              <h4>Privacy by Design</h4>
              <p>Offline-first runtime, zero-account model, and sealed QR encryption ensure no data is ever collected.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <span className="pill pill-teal"><span className="pill-dot" />Anti-addiction</span>
              <h4>Quadratic Progression</h4>
              <p>XP growth is proportional to level squared. Daily bonuses reward breaks, not binges. Engagement without exploitation.</p>
            </div>
          </div>

          <h3 className="reveal" style={{ marginTop: "48px", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            How the pieces interlock
          </h3>
          <p className="lead reveal" style={{ marginBottom: "20px" }}>
            Teachers orchestrate interventions and guidance; students run the app entirely locally;
            the privacy layer makes the whole system breach-proof.
          </p>
          <div className="ecosystem-diagram reveal">
            <div>
              <strong>Teacher Hub</strong><br />
              Pairing, scripts, blessings, classroom quests
            </div>
            <span>&harr;</span>
            <div>
              <strong>Student Experience</strong><br />
              Meta-Pet companion, reflection, vitals
            </div>
            <span>&harr;</span>
            <div>
              <strong>Privacy Layer</strong><br />
              Offline runtime, zero accounts, sealed QR
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 4: TEACHER HUB ── */}
      <section className="section" id="for-teachers">
        <div className="wrap">
          <span className="section-tag t-violet reveal">For teachers</span>
          <h2 className="reveal">The Teacher Hub (&ldquo;The Veil&rdquo;) gives you full control.</h2>
          <p className="lead reveal">
            No admin overhead. No student accounts to manage. Just open the Hub, generate
            pairing cards, and run your session.
          </p>
          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top g" />
              <h4>Pairing &amp; Digital DNA</h4>
              <p>Generate QR pairing cards in minutes. Each student gets a unique cryptographic companion — no emails, no passwords.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Blessing Forge &amp; Interventions</h4>
              <p>Send positive nudges and classroom rewards. Guide individual or group behaviour without public call-outs.</p>
            </div>
            <div className="card">
              <div className="card-top v" />
              <h4>Facilitation Scripts</h4>
              <p>Short, repeatable lesson flows you can run in 10-minute windows or full 45-minute sessions.</p>
            </div>
            <div className="card">
              <div className="card-top g" />
              <h4>Classroom Quest</h4>
              <p>Math Relay, Word Forge, Science Lab Sprint — curriculum-aligned mini-games the whole class plays together.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Constellation View</h4>
              <p>See your entire class at a glance. Spot patterns, celebrate progress, identify who needs support.</p>
            </div>
            <div className="card">
              <div className="card-top c" />
              <h4>Micro-line</h4>
              <p>Teacher-guided. Student-owned. Device-local. A private communication line that stays on the device.</p>
            </div>
          </div>
          <p className="lead reveal" style={{ marginTop: "24px", marginBottom: 0, fontSize: "12px" }}>
            All Jewble branding and creative IP remains the property of Blue Snake Studios.
            Schools receive a limited educational-use licence during pilot.
          </p>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="kpps-package">
        <div className="wrap">
          <span className="section-tag t-teal reveal">KPPS Teacher Hub package</span>
          <h2 className="reveal">All implementation files are now on the landing page.</h2>
          <p className="lead reveal">
            Open any file directly from here. Each document is hosted in <code>/public/docs/kpps</code>
            so schools can quickly review, download, and share the full package.
          </p>

          <div className="kpps-doc-grid reveal">
            {kppsDocs.map((doc) => (
              <a
                key={doc.href}
                className="link-card kpps-doc-card"
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="lc-tag t-gold">{doc.tag}</span>
                <h4>{doc.title}</h4>
                <p>{doc.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 5: STUDENT EXPERIENCE ── */}
      <section className="section" id="student-experience">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Student experience</span>
          <h2 className="reveal">What happens on the student&apos;s device.</h2>
          <p className="lead reveal">
            A calm companion students care for over time — with guided reflection,
            journaling prompts, and emotional check-ins. Everything runs locally.
          </p>
          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top g" />
              <h4>Meta-Pet Companion</h4>
              <p>A unique creature born from a 180-digit genome. Students feed, nurture, and learn alongside it as it grows over weeks.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Reflection &amp; Vitals</h4>
              <p>Journaling prompts, emotional check-ins, and metacognition exercises built into the daily care routine.</p>
            </div>
            <div className="card">
              <div className="card-top v" />
              <h4>Offline Runtime</h4>
              <p>No internet required. No cloud sync. The companion lives on the device and nowhere else.</p>
            </div>
          </div>
          <div className="stat-row reveal" style={{ marginTop: "28px" }}>
            <div className="stat-item">
              <div className="n" style={{ color: "var(--gold)" }}>180</div>
              <div className="l">Digit genome</div>
            </div>
            <div className="stat-item">
              <div className="n" style={{ color: "var(--teal)" }}>15</div>
              <div className="l">Emotion states</div>
            </div>
            <div className="stat-item">
              <div className="n" style={{ color: "var(--violet)" }}>0</div>
              <div className="l">Data collected</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 6: EVIDENCE ── */}
      <section className="section" id="evidence">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Evidence</span>
          <h2 className="reveal">What parents and researchers are saying.</h2>
          <div className="evidence-stats reveal">
            <div className="evidence-stat">
              <div className="es-num">58%</div>
              <div className="es-label">of parents prefer ad-free content for their children</div>
            </div>
            <div className="evidence-stat">
              <div className="es-num">68%</div>
              <div className="es-label">prioritise educational value over entertainment</div>
            </div>
            <div className="evidence-stat">
              <div className="es-num">47%</div>
              <div className="es-label">cite data privacy as a top concern with children&apos;s apps</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="investor-brief">
        <div className="wrap">
          <span className="section-tag t-violet reveal">Investor &amp; partner briefing packet</span>
          <h2 className="reveal">Jewble Meta-Pet — where consciousness meets code.</h2>
          <p className="lead reveal">
            Confidential snapshot (February 2026): market timing, regulatory moat, product readiness,
            and commercialisation pathways for investors, strategic partners, and education buyers.
          </p>

          <div className="briefing-grid reveal">
            <div className="card">
              <div className="card-top g" />
              <h4>The opportunity in numbers</h4>
              <div className="briefing-table-wrap">
                <table className="briefing-table">
                  <thead>
                    <tr>
                      <th>Market segment</th>
                      <th>2025</th>
                      <th>2033</th>
                      <th>CAGR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketRows.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="briefing-note">Sources: Research and Markets, IMARC, 360iResearch, and other 2025 market reports.</p>
            </div>

            <div className="card">
              <div className="card-top t" />
              <h4>Regulatory moat</h4>
              <div className="briefing-table-wrap">
                <table className="briefing-table">
                  <thead>
                    <tr>
                      <th>Regulation</th>
                      <th>Status</th>
                      <th>Competitor impact</th>
                      <th>Jewble position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regulatoryRows.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="briefing-note">Core thesis: compliance is architectural, not an expensive retrofit.</p>
            </div>
          </div>

          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top v" />
              <h4>Five differentiators</h4>
              <ul className="briefing-list">
                <li>15-state organic consciousness model driven by genetics + care history.</li>
                <li>180-digit base-7 genome with cryptographic identity and tamper-evident traits.</li>
                <li>Offline-first, zero-account architecture with local-only core runtime.</li>
                <li>Deep progression: evolution, duels, mini-games, lineage, cosmetics, achievements.</li>
                <li>Non-violent, calm UX suitable for family and school environments.</li>
              </ul>
            </div>
            <div className="card">
              <div className="card-top g" />
              <h4>Monetisation pathways</h4>
              <ul className="briefing-list">
                <li>Premium app one-time purchase ($4.99–$9.99).</li>
                <li>Optional visual-only cosmetic packs.</li>
                <li>Educational licensing for schools and districts.</li>
                <li>Optional encrypted cloud-sync subscription.</li>
                <li>SDK / white-label licensing for education and wellness partners.</li>
              </ul>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Immediate action plan</h4>
              <ul className="briefing-list">
                {actionPlan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="manifesto reveal">
        <p className="manifesto-q">
          &ldquo;Pilot teacher and parent testimonials coming soon.
          <em> Interested in being part of our first cohort?</em>&rdquo;
        </p>
        <p className="manifesto-attr">Get in touch &mdash; hello@bluesnakestudios.com.au</p>
      </div>

      <div className="divider" />

      {/* ── SECTION 7: GET INVOLVED ── */}
      <section className="section" id="get-involved">
        <div className="wrap">
          <span className="section-tag t-violet reveal">Get involved</span>
          <h2 className="reveal">Start with one class. One week. One teacher.</h2>
          <p className="lead reveal">
            Pilots are free, take ~10 minutes to set up, and run for 7 sessions.
            No accounts, no cloud dashboards, no IT overhead.
          </p>

          <div className="grid-2 reveal">
            <a className="link-card" href="mailto:hello@bluesnakestudios.com.au?subject=Start%20Free%20Pilot">
              <span className="lc-tag t-gold">For teachers &amp; principals</span>
              <h4>Start your free pilot</h4>
              <p>It takes 10 minutes to set up; no accounts required. Get teacher scripts, classroom activities, and a simple rollout guide.</p>
            </a>
            <a className="link-card" href="mailto:hello@bluesnakestudios.com.au?subject=Technical%20Brief%20Request">
              <span className="lc-tag t-teal">For district leaders &amp; regulators</span>
              <h4>See our technical brief</h4>
              <p>Read our architecture overview, OAIC submission, and privacy-by-design documentation.</p>
            </a>
          </div>

          <div className="grid-2 reveal" style={{ marginTop: "14px" }}>
            <div className="card">
              <div className="card-top g" />
              <h4>Pilot format</h4>
              <p>7 sessions (30–45 minutes). Setup time: ~10 minutes.</p>
              <h4 style={{ marginTop: "14px" }}>What you get</h4>
              <p>Teacher scripts + classroom activities + simple rollout guide.</p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Contact us</h4>
              <p style={{ marginBottom: "14px" }}>
                hello@bluesnakestudios.com.au
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a className="btn btn-gold" href="mailto:hello@bluesnakestudios.com.au?subject=Start%20Free%20Pilot">Start a Pilot &rarr;</a>
                <a className="btn btn-ghost" href="mailto:hello@bluesnakestudios.com.au?subject=Book%2012-minute%20Call">Book a 12-min Call</a>
              </div>
            </div>
          </div>

          <p className="lead reveal" style={{ marginTop: "24px", marginBottom: 0, fontSize: "11px" }}>
            All Jewble branding and creative IP remains the property of Blue Snake Studios;
            the school receives a limited educational-use licence. Default deployments operate
            in offline-first, zero-account mode with no default cloud data transmission.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* ── SECTION 8: ABOUT ── */}
      <section className="section" id="about">
        <div className="wrap">
          <span className="section-tag t-gold reveal">About</span>
          <h2 className="reveal">Blue Snake Studios</h2>
          <p className="lead reveal">
            We combine rigorous cryptography with long-term mathematical and artistic inquiry.
            The name reflects both timescales: the blue snake moves faster than lightning through circuits,
            and slower than moss through meaning.
          </p>
          <div className="card reveal">
            <div className="card-top g" />
            <h4>Built by a parent, for a classroom</h4>
            <p>
              Our founder is an Australian parent and mathematician who built Jewble
              for his child&apos;s classroom. Every design decision — offline-first,
              zero accounts, anti-addiction progression — comes from asking one question:
              &ldquo;Would I put this in front of my own kid?&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-logo">Ready to pilot a safer classroom tool?</div>
        <div className="footer-tagline">Faster than lightning. Slower than moss.</div>
        <div className="footer-links">
          <a href="#get-involved">Start Pilot</a>
          <a href="#for-teachers">Teacher Hub</a>
          <a href="#evidence">Evidence</a>
          <a href="#about">About</a>
          <a href="mailto:hello@bluesnakestudios.com.au">Contact</a>
        </div>
        <p className="footer-legal">
          &copy; 2026 Blue Snake Studios &mdash; All Jewble branding and creative IP
          remains the property of Blue Snake Studios; the school receives a limited
          educational-use licence. Default deployments operate in offline-first,
          zero-account mode with no default cloud data transmission.
        </p>
      </footer>
    </div>
  );
}
