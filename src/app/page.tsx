"use client";

import { useEffect, useRef } from "react";
import "./landing.css";

export default function LandingPage() {
  const cosmosRef = useRef<HTMLCanvasElement>(null);
  const jewbleVisRef = useRef<HTMLCanvasElement>(null);
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
    const pc = jewbleVisRef.current;
    if (!pc) return;
    const pctx = pc.getContext("2d");
    if (!pctx) return;

    let pt = 0;
    let animId: number;

    function drawJewble() {
      const w = pc!.width;
      const h = pc!.height;
      pctx!.clearRect(0, 0, w, h);
      pt += 0.012;

      const g = pctx!.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 120);
      g.addColorStop(0, "rgba(245,200,76,.05)");
      g.addColorStop(1, "transparent");
      pctx!.fillStyle = g;
      pctx!.fillRect(0, 0, w, h);

      for (let r = 0; r < 3; r++) {
        pctx!.beginPath();
        const rad = 60 + r * 28;
        const a = pt * (r % 2 === 0 ? 1 : -1) * (r + 1) * 0.4;
        pctx!.ellipse(w / 2, h / 2, rad, rad * 0.35, a, 0, Math.PI * 2);
        const c =
          r === 0
            ? "rgba(245,200,76,.2)"
            : r === 1
              ? "rgba(77,214,200,.15)"
              : "rgba(167,139,250,.12)";
        pctx!.strokeStyle = c;
        pctx!.lineWidth = 0.8;
        pctx!.stroke();

        const dotA = pt * (2 - r) * 0.7 + r * 1.2;
        const dx = w / 2 + Math.cos(dotA) * rad;
        const dy = h / 2 + Math.sin(dotA) * rad * 0.35;
        pctx!.beginPath();
        pctx!.arc(dx, dy, 2.5, 0, Math.PI * 2);
        pctx!.fillStyle =
          r === 0 ? "#f5c84c" : r === 1 ? "#4dd6c8" : "#a78bfa";
        pctx!.fill();
      }

      const pulse = 1 + Math.sin(pt * 2) * 0.06;
      const bodyR = 38 * pulse;
      const bodyG = pctx!.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, bodyR);
      bodyG.addColorStop(0, "rgba(245,200,76,.6)");
      bodyG.addColorStop(0.5, "rgba(245,180,50,.25)");
      bodyG.addColorStop(1, "transparent");
      pctx!.fillStyle = bodyG;
      pctx!.beginPath();
      for (let i = 0; i < 7; i++) {
        const angle =
          (i / 7) * Math.PI * 2 - Math.PI / 2 + Math.sin(pt * 0.5) * 0.05;
        const r2 = bodyR * (1 + Math.sin(pt * 1.5 + i * 0.9) * 0.08);
        const x = w / 2 + r2 * Math.cos(angle);
        const y = h / 2 + r2 * Math.sin(angle) * 0.85;
        if (i === 0) pctx!.moveTo(x, y);
        else pctx!.lineTo(x, y);
      }
      pctx!.closePath();
      pctx!.fill();

      pctx!.beginPath();
      pctx!.arc(w / 2 + 6, h / 2 - 3, 5 + Math.sin(pt * 3) * 0.5, 0, Math.PI * 2);
      pctx!.fillStyle = "rgba(4,8,16,.8)";
      pctx!.fill();
      pctx!.beginPath();
      pctx!.arc(w / 2 + 7.5, h / 2 - 4, 1.5, 0, Math.PI * 2);
      pctx!.fillStyle = "rgba(245,200,76,.9)";
      pctx!.fill();

      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + pt * 0.3;
        const dist = 70 + Math.sin(pt + i) * 0.15;
        const px = w / 2 + Math.cos(a) * dist;
        const py = h / 2 + Math.sin(a) * dist * 0.6;
        pctx!.beginPath();
        pctx!.arc(px, py, 1.2, 0, Math.PI * 2);
        pctx!.fillStyle = `rgba(245,200,76,${0.3 + Math.sin(pt * 2 + i) * 0.2})`;
        pctx!.fill();
      }

      animId = requestAnimationFrame(drawJewble);
    }
    drawJewble();

    return () => cancelAnimationFrame(animId);
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

      <nav className="landing-nav">
        <a className="logo" href="https://bluesnakestudios.com">
          <svg className="logo-mark" viewBox="0 0 28 28">
            <polygon
              points="14,2 25,8.5 25,19.5 14,26 3,19.5 3,8.5"
              fill="none"
              stroke="#f5c84c"
              strokeWidth="1.2"
              opacity=".6"
            />
            <polygon
              points="14,6 22,10.5 22,17.5 14,22 6,17.5 6,10.5"
              fill="none"
              stroke="#4dd6c8"
              strokeWidth=".8"
              opacity=".5"
            />
            <circle cx="14" cy="14" r="3" fill="#f5c84c" opacity=".9" />
          </svg>
          <span className="logo-text">
            Blue Snake <span>Studios</span>
          </span>
        </a>
        <div className="nav-r">
          <a href="#why-now">Why now</a>
          <a href="#ecosystem">Teacher hub</a>
          <a href="#student">Students</a>
          <a href="#about">About</a>
          <a
            href="https://bss-git-main-tom-s-projects-6a215d3d.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-nav"
          >
            Start free pilot →
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-eyebrow">Built for Australian classrooms</div>
        <h1>
          A privacy-first virtual companion that teaches systems thinking — built
          by a local parent for Australian classrooms.
        </h1>
        <p className="hero-sub">
          <strong>180-digit base-7 genome, 15 emotional states, zero data collected.</strong>
          <br />
          Faster than lightning. <em>Slower than moss.</em>
        </p>
        <div className="hero-actions">
          <a
            className="btn btn-gold"
            href="https://bss-git-main-tom-s-projects-6a215d3d.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start a free pilot
          </a>
          <a className="btn btn-ghost" href="#get-involved">
            Request a curriculum pack
          </a>
        </div>

        <div className="hepta-ring">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f5c84c" stopOpacity=".4" />
                <stop offset="100%" stopColor="#4dd6c8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="hepta-outer">
              <polygon
                ref={h7Ref}
                fill="none"
                stroke="#f5c84c"
                strokeWidth=".8"
                opacity=".35"
              />
            </g>
            <g className="hepta-mid">
              <polygon
                ref={h7bRef}
                fill="none"
                stroke="#4dd6c8"
                strokeWidth=".6"
                opacity=".3"
              />
            </g>
            <g className="hepta-inner">
              <polygon
                ref={h7cRef}
                fill="none"
                stroke="#a78bfa"
                strokeWidth=".5"
                opacity=".25"
              />
            </g>
            <g ref={spokesRef} opacity=".18" />
            <circle cx="110" cy="110" r="60" fill="url(#rg)" />
            <circle cx="110" cy="110" r="4" fill="#f5c84c" opacity=".9" />
            <circle cx="110" cy="110" r="8" fill="none" stroke="#f5c84c" className="pulse-ring" />
          </svg>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="why-now">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Why now for schools?</span>
          <h2 className="reveal">Privacy and wellbeing pressures are accelerating.</h2>
          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top g" />
              <h4>Parents are demanding safer tools</h4>
              <p>
                Parents are actively seeking ad-free educational apps and are increasingly
                cautious about student data use, surveillance and manipulative engagement loops.
              </p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>Regulation and breach risk are real</h4>
              <p>
                With the Children&apos;s Online Privacy Code consultation underway and the Jan 2026
                Department of Education breach fresh in memory, offline-first design means there
                is no student cloud dataset to breach.
              </p>
            </div>
            <div className="card">
              <div className="card-top v" />
              <h4>Screen-time policy is shifting</h4>
              <p>
                Under-16 social media restrictions and reduced screen-time guidance in Victoria
                create demand for calm, curriculum-aligned alternatives that reward reflection
                and collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="differentiators">
        <div className="wrap">
          <div className="product-hero reveal">
            <div className="product-hero-visual">
              <canvas className="pet-canvas" ref={jewbleVisRef} width={400} height={300} />
            </div>
            <div className="product-hero-text">
              <div className="pill pill-gold">
                <span className="pill-dot" />
                What Jewble is
              </div>
              <h3>A private companion with verifiable identity</h3>
              <p>
                Jewble combines mathematically unique identity, emotional modelling and cryptographic
                proof with an offline-first runtime. Students get meaningful interaction; schools get
                privacy by architecture.
              </p>
              <div className="stat-row">
                <div className="stat-item">
                  <div className="n" style={{ color: "var(--gold)" }}>180</div>
                  <div className="l">Digit base-7 genome</div>
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
          </div>

          <div className="grid-3 reveal" style={{ marginTop: "20px" }}>
            <div className="card"><div className="card-top g" /><h4>Genomic identity</h4><p>Each companion&apos;s 180-digit base-7 genome is mathematically unrepeatable and drives personality and evolution paths.</p></div>
            <div className="card"><div className="card-top t" /><h4>Organic consciousness</h4><p>Fifteen emotional states are shaped by genetics and lived experience, creating adaptive behaviour over time.</p></div>
            <div className="card"><div className="card-top v" /><h4>Cryptographic self</h4><p>ECDSA P-256 signatures plus visual HeptaCode identity ensure no central authority can counterfeit a pet.</p></div>
            <div className="card"><div className="card-top t" /><h4>Privacy by design</h4><p>Offline-first runtime, zero account model and sealed QR encryption keep student data on-device.</p></div>
            <div className="card"><div className="card-top g" /><h4>Quadratic progression</h4><p>XP growth ∝ L² builds patience and systems thinking as students experience non-linear learning patterns.</p></div>
            <div className="card"><div className="card-top c" /><h4>Anti-addiction mechanics</h4><p>Daily bonuses reward breaks and remove FOMO timers, supporting engagement without exploitative loops.</p></div>
          </div>

          <div className="diagram-grid reveal">
            <div className="card">
              <h4>Ecosystem diagram</h4>
              <div className="ecosystem-diagram">
                <div>Teacher Hub (The Veil)</div>
                <span>→</span>
                <div>Student Experience</div>
                <span>→</span>
                <div>Privacy Layer</div>
              </div>
            </div>
            <div className="card">
              <h4>How it interlocks</h4>
              <p>
                Teachers orchestrate interventions and guidance. Students run the companion entirely
                locally. The privacy layer (offline runtime, sealed QR, no-account model) makes the
                whole system breach-proof by design.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="ecosystem">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Ecosystem for schools</span>
          <h2 className="reveal">The Veil brings teacher tools to the foreground.</h2>
          <div className="grid-2 reveal">
            <div className="card"><div className="card-top t" /><h4>Pairing &amp; Digital DNA</h4><p>Teachers pair devices via sealed QR codes while each student&apos;s digital DNA remains on their own device.</p></div>
            <div className="card"><div className="card-top g" /><h4>Blessing Forge &amp; interventions</h4><p>Create achievement unlocks and guidance scripts that reinforce classroom values and positive behaviour.</p></div>
            <div className="card"><div className="card-top v" /><h4>Facilitation scripts &amp; Classroom Quest</h4><p>Lesson-ready scripts plus mini-games like Math Relay, Word Forge and Science Lab Sprint. Feedback on curriculum standards and accessibility is actively invited.</p></div>
            <div className="card"><div className="card-top c" /><h4>Constellation view</h4><p>Visual analytics help teachers monitor class progress while keeping personal data local to student devices.</p></div>
          </div>
          <p className="lead reveal" style={{ marginTop: "20px", marginBottom: 0 }}>
            All materials and software remain the property of Blue Snake Studios. Schools receive a limited educational-use licence.
          </p>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="student">
        <div className="wrap">
          <span className="section-tag t-violet reveal">Student experience</span>
          <h2 className="reveal">What students see on the device.</h2>
          <div className="grid-3 reveal">
            <div className="card"><div className="card-top g" /><h4>Meta-Pet app</h4><p>A companion lives on the student tablet or Chromebook and evolves over weeks through care and learning.</p></div>
            <div className="card"><div className="card-top t" /><h4>Reflection prompts &amp; vitals</h4><p>Daily journaling and emotional-state check-ins help students practise metacognition and self-regulation.</p></div>
            <div className="card"><div className="card-top v" /><h4>Offline runtime</h4><p>Everything runs locally and nothing is sent to a server, reducing cyber risk and preserving student privacy.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="evidence">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Evidence and social proof</span>
          <h2 className="reveal">Signals of demand are already strong.</h2>
          <div className="grid-3 reveal">
            <div className="card"><div className="card-top g" /><h4>+58%</h4><p>Rise in parental preference for ad-free, safe children&apos;s content.</p></div>
            <div className="card"><div className="card-top t" /><h4>68%</h4><p>Of parents prioritise educational value when choosing children&apos;s digital experiences.</p></div>
            <div className="card"><div className="card-top v" /><h4>47%</h4><p>Of parents report concern about children&apos;s data privacy in apps and connected services.</p></div>
          </div>
          <p className="lead reveal" style={{ marginTop: "20px", marginBottom: 0 }}>
            Pilot teacher and parent quotes can be added here as soon as the first school pilots complete.
          </p>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="get-involved">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Get involved</span>
          <h2 className="reveal">Start a pilot or request policy documentation.</h2>
          <div className="grid-2 reveal">
            <div className="card">
              <div className="card-top g" />
              <h4>Teachers and principals</h4>
              <p>Start your free pilot. Setup takes about 10 minutes and requires no student accounts.</p>
              <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a className="btn btn-gold" href="https://bss-git-main-tom-s-projects-6a215d3d.vercel.app/" target="_blank" rel="noopener noreferrer">Start a free pilot</a>
                <a className="btn btn-ghost" href="mailto:themossman@bluesnakestudios.com?subject=Curriculum%20Pack%20Request">Request curriculum pack</a>
              </div>
            </div>
            <div className="card">
              <div className="card-top t" />
              <h4>District leaders and regulators</h4>
              <p>Review the technical brief, OAIC submission and implementation notes for privacy-first classroom deployment.</p>
              <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a className="btn btn-ghost" href="mailto:themossman@bluesnakestudios.com?subject=Technical%20Brief%20Request">See technical brief</a>
                <a className="btn btn-ghost" href="mailto:themossman@bluesnakestudios.com?subject=OAIC%20Submission%20Request">Read OAIC submission</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="about">
        <div className="wrap">
          <span className="section-tag t-violet reveal">About Blue Snake Studios</span>
          <h2 className="reveal">Dual timescale philosophy, rewritten for educators.</h2>
          <p className="lead reveal">
            We combine rigorous cryptography (<em>faster than lightning</em>) with long-term mathematical and artistic inquiry (<em>slower than moss</em>). Our founder is an Australian parent and mathematician who built Jewble for his child&apos;s classroom.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">Blue Snake <span>Studios</span></div>
        <div className="footer-tagline">Faster than lightning · Slower than moss</div>
        <div className="footer-links">
          <a href="mailto:themossman@bluesnakestudios.com">themossman@bluesnakestudios.com</a>
          <a href="https://bluesnakestudios.com" target="_blank" rel="noopener noreferrer">BlueSnakeStudios.com</a>
          <a href="https://teachers-meta-pet-mr-brand.vercel.app/" target="_blank" rel="noopener noreferrer">Teacher hub</a>
        </div>
        <p className="footer-legal">
          © 2026 Blue Snake Studios. All Jewble branding and IP remain the property of Blue Snake Studios.
          <br />
          Schools receive a limited educational-use licence.
        </p>
      </footer>
    </div>
  );
}
