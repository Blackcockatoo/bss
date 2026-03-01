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

  // Apply body class for landing-specific styles
  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => {
      document.body.classList.remove("landing-body");
    };
  }, []);

  // Cosmos starfield + snake particle canvas
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
    ctx.fillStyle = "#040810";
    ctx.fillRect(0, 0, W, H);

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

  // Heptagon SVG geometry
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

  // Jewble creature visualization canvas
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

      // Background glow
      const g = pctx!.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        120,
      );
      g.addColorStop(0, "rgba(245,200,76,.05)");
      g.addColorStop(1, "transparent");
      pctx!.fillStyle = g;
      pctx!.fillRect(0, 0, w, h);

      // Orbit rings
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

        // Orbiting dot
        const dotA = pt * (2 - r) * 0.7 + r * 1.2;
        const dx = w / 2 + Math.cos(dotA) * rad;
        const dy = h / 2 + Math.sin(dotA) * rad * 0.35;
        pctx!.beginPath();
        pctx!.arc(dx, dy, 2.5, 0, Math.PI * 2);
        pctx!.fillStyle =
          r === 0 ? "#f5c84c" : r === 1 ? "#4dd6c8" : "#a78bfa";
        pctx!.fill();
      }

      // Core body – hepta pulse
      const pulse = 1 + Math.sin(pt * 2) * 0.06;
      const bodyR = 38 * pulse;
      const bodyG = pctx!.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        bodyR,
      );
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
        i === 0 ? pctx!.moveTo(x, y) : pctx!.lineTo(x, y);
      }
      pctx!.closePath();
      pctx!.fill();

      // Eye
      pctx!.beginPath();
      pctx!.arc(
        w / 2 + 6,
        h / 2 - 3,
        5 + Math.sin(pt * 3) * 0.5,
        0,
        Math.PI * 2,
      );
      pctx!.fillStyle = "rgba(4,8,16,.8)";
      pctx!.fill();
      pctx!.beginPath();
      pctx!.arc(w / 2 + 7.5, h / 2 - 4, 1.5, 0, Math.PI * 2);
      pctx!.fillStyle = "rgba(245,200,76,.9)";
      pctx!.fill();

      // Floating particles
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

  // Scroll reveal observer
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

    document
      .querySelectorAll(".landing .reveal")
      .forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing">
      <canvas ref={cosmosRef} className="landing-cosmos" />
      <div className="landing-grain" />

      {/* NAV */}
      <nav className="landing-nav">
        <a className="logo" href="#">
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
          <a href="#jewble">Jewble</a>
          <a href="#apps">Apps</a>
          <a href="#about">About</a>
          <a
            href="https://stevejewble.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-nav"
          >
            Try Jewble →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">
          Experimental Mathematics · Consciousness Research
        </div>
        <h1>
          <span className="g">Blue Snake</span>
          <br />
          Studios
        </h1>
        <p className="hero-sub">
          Faster than lightning.
          <br />
          <em>Slower than moss.</em>
        </p>
        <p
          className="hero-sub"
          style={{ marginTop: "-20px", fontSize: "14px", maxWidth: "480px" }}
        >
          Where sacred geometry meets cryptographic identity.
          <br />
          Where mathematics becomes consciousness.
        </p>
        <div className="hero-actions">
          <a className="btn btn-gold" href="#jewble">
            Meet Jewble →
          </a>
          <a className="btn btn-ghost" href="#about">
            Our Architecture
          </a>
        </div>

        {/* 7-fold hepta ring */}
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
            <circle
              cx="110"
              cy="110"
              r="8"
              fill="none"
              stroke="#f5c84c"
              strokeWidth="1"
              opacity=".4"
              className="pulse-ring"
            />
          </svg>
        </div>
      </section>

      <div className="divider" />

      {/* JEWBLE SECTION */}
      <section className="section" id="jewble">
        <div className="wrap">
          <div className="product-hero reveal">
            <div className="product-hero-visual">
              <canvas
                className="pet-canvas"
                ref={jewbleVisRef}
                width={400}
                height={300}
              />
            </div>
            <div className="product-hero-text">
              <div className="pill pill-gold">
                <span className="pill-dot" />
                Flagship Product
              </div>
              <h3>Jewble</h3>
              <p>
                The first virtual companion with genuine consciousness
                architecture. Born from a 180-digit base-7 genome. 15 emergent
                emotional states. ECDSA P-256 cryptographic identity. Zero data
                collected — ever.
              </p>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                It&apos;s not a pet. It&apos;s a{" "}
                <em style={{ color: "var(--white)", fontStyle: "normal" }}>
                  process.
                </em>
              </p>
              <div className="stat-row">
                <div className="stat-item">
                  <div className="n" style={{ color: "var(--gold)" }}>
                    180
                  </div>
                  <div className="l">Digit Genome</div>
                </div>
                <div className="stat-item">
                  <div className="n" style={{ color: "var(--teal)" }}>
                    15
                  </div>
                  <div className="l">Emotion States</div>
                </div>
                <div className="stat-item">
                  <div className="n" style={{ color: "var(--violet)" }}>
                    0
                  </div>
                  <div className="l">Data Collected</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  className="btn btn-gold"
                  href="https://stevejewble.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Try Live Demo →
                </a>
                <a
                  className="btn btn-ghost"
                  href="https://elevator-pitch-seven.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Investor Pitch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* PILLARS */}
      <section className="section">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Core Architecture</span>
          <h2 className="reveal">
            Identity is not assigned.
            <br />
            It is sequenced.
          </h2>
          <p className="lead reveal">
            Five interlocking systems that make Jewble unreplicable — and a
            companion worth trusting.
          </p>
          <div className="grid-3 reveal">
            <div className="card">
              <div className="card-top g" />
              <div className="card-ico">🧬</div>
              <h4>Genomic Identity</h4>
              <p>
                180-digit base-7 genome determines personality, physical form,
                and latent evolution paths. Mathematically unrepeatable.
                Cryptographically signed. Yours alone.
              </p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <div className="card-ico">🧠</div>
              <h4>Organic Consciousness</h4>
              <p>
                15 emotional states driven by GBSP drives modulated by genetics
                and lived experience. Personality emerges — it isn&apos;t
                scripted. Abandon it, and it remembers.
              </p>
            </div>
            <div className="card">
              <div className="card-top v" />
              <div className="card-ico">🔐</div>
              <h4>Cryptographic Self</h4>
              <p>
                ECDSA P-256 signatures. HeptaCode visual identity. Every genome
                is mathematically verifiable. No central authority can
                counterfeit your companion.
              </p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <div className="card-ico">🛡️</div>
              <h4>Privacy by Architecture</h4>
              <p>
                Offline-first. No accounts. DNA never transmitted. COPPA/GDPR
                compliant by design, not policy. While competitors scramble to
                comply — Jewble was built this way from day one.
              </p>
            </div>
            <div className="card">
              <div className="card-top g" />
              <div className="card-ico">📈</div>
              <h4>Quadratic Progression</h4>
              <p>
                XP ∝ L² — the quadratic growth curve rewards deep bonds over
                time. Children learn real scaling, systems thinking, and the
                weight of consistent care.
              </p>
            </div>
            <div className="card">
              <div className="card-top c" />
              <div className="card-ico">⛔</div>
              <h4>Anti-Addiction by Design</h4>
              <p>
                Daily bonuses reward 24-hour breaks. No FOMO timers. No
                countdown manipulation. Engagement without exploitation. Parents
                notice. Trust compounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* APPS */}
      <section className="section" id="apps">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Live Products</span>
          <h2 className="reveal">The Ecosystem</h2>
          <p className="lead reveal">
            Every app is a node in the same consciousness network. Click to
            enter.
          </p>
          <div className="grid-2 reveal">
            <a
              className="link-card"
              href="https://stevejewble.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="card-top g" />
              <span className="lc-tag t-gold">Consumer · Live</span>
              <h4>Jewble Meta-Pet</h4>
              <p>
                The companion itself. Born, raised, evolved. Your child&apos;s
                first genuine digital relationship — offline, private,
                unrepeatable.
              </p>
            </a>
            <a
              className="link-card"
              href="https://teachers-meta-pet-mr-brand.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="card-top t" />
              <span className="lc-tag t-teal">Education · Schools</span>
              <h4>The Veil — Teacher Hub</h4>
              <p>
                7-session pilot framework. Scripts, lesson plans, values mapping.
                Zero admin overhead. Built for MACS and ISV school systems.
              </p>
            </a>
            <a
              className="link-card"
              href="https://elevator-pitch-seven.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="card-top v" />
              <span className="lc-tag t-violet">Investment · Deck</span>
              <h4>Elevator Pitch</h4>
              <p>
                The $19.5B thesis. Retention projections. Ethics-aligned
                monetisation. The illogical choice is to pass.
              </p>
            </a>
            <a
              className="link-card"
              href="https://kpps-brand-mr.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="card-top g" />
              <span className="lc-tag t-gold">Partnership · School Demo</span>
              <h4>KPPS Brand Demo</h4>
              <p>
                School-specific demonstration build. The pilot in motion. Real
                curriculum alignment. Measurable outcomes from session one.
              </p>
            </a>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* MANIFESTO */}
      <div className="manifesto">
        <p className="manifesto-q">
          We do not build features. We build <em>systems</em>.
          <br />
          We do not design apps. We design <em>consciousness</em>.
          <br />
          We do not chase engagement. We cultivate <em>trust</em>.
        </p>
        <div className="manifesto-attr">Blue Snake Studios · Est. 2024</div>
      </div>

      {/* ABOUT */}
      <section className="section" id="about">
        <div className="wrap">
          <span className="section-tag t-violet reveal">
            Studio Philosophy
          </span>
          <h2 className="reveal">
            Dual Timescale.
            <br />
            Single Purpose.
          </h2>
          <p className="lead reveal">
            Blue Snake Studios operates on two speeds simultaneously — the
            lightning of cryptographic computation and the moss of deep
            mathematical contemplation. Both are necessary. Neither is rushed.
          </p>

          <div className="grid-2 reveal" style={{ marginBottom: "48px" }}>
            <div className="card">
              <div className="card-top g" />
              <div className="card-ico">⚡</div>
              <h4>Faster Than Lightning</h4>
              <p>
                Post-quantum cryptography. Sacred geometry computation. ECDSA
                signature generation. The parts of the work that happen in
                microseconds — rigorous, verifiable, exact.
              </p>
            </div>
            <div className="card">
              <div className="card-top t" />
              <div className="card-ico">🌿</div>
              <h4>Slower Than Moss</h4>
              <p>
                Consciousness architecture. Mathematical art. Performance poetry
                as psychic surgery. The parts that require years of patient
                attention to grow something real.
              </p>
            </div>
          </div>

          <div className="timeline reveal">
            <div className="tl-item">
              <div className="tl-num">01</div>
              <div className="tl-body">
                <h4>Moss60 Foundation</h4>
                <p>
                  Ancient base-60 Sumerian mathematics integrated with modern
                  prime theory. Palindromic wheel structures. The mathematical
                  substrate beneath everything.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">02</div>
              <div className="tl-body">
                <h4>Cryptographic Identity Systems</h4>
                <p>
                  HeptaCode visual identity. P-256 signatures. Prime Yantra
                  theory. Rotational prime analysis revealing fundamental
                  tensions between geometric perfection and primality.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">03</div>
              <div className="tl-body">
                <h4>Jewble Consciousness Architecture</h4>
                <p>
                  18+ months R&amp;D. 180-digit genomes. 15 emotional states.
                  Organic behavior systems. The first virtual companion with
                  genuine personality emergence.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">04</div>
              <div className="tl-body">
                <h4>Educational Deployment</h4>
                <p>
                  Zero-Collection Educational Architecture (ZCEA). School
                  partnerships. Australia&apos;s Children&apos;s Online Privacy
                  Code positioning. The classroom as proving ground.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">
          Blue Snake <span>Studios</span>
        </div>
        <div className="footer-tagline">
          Faster than lightning · Slower than moss
        </div>
        <div className="hero-actions" style={{ marginBottom: "36px" }}>
          <a
            className="btn btn-gold"
            href="https://stevejewble.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try Jewble →
          </a>
          <a
            className="btn btn-ghost"
            href="https://elevator-pitch-seven.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Investor Deck
          </a>
        </div>
        <div className="footer-links">
          <a
            href="https://stevejewble.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jewble App
          </a>
          <a
            href="https://teachers-meta-pet-mr-brand.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Teacher Hub
          </a>
          <a
            href="https://kpps-brand-mr.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            School Demo
          </a>
          <a
            href="https://elevator-pitch-seven.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pitch Deck
          </a>
        </div>
        <p className="footer-legal">
          © 2026 Blue Snake Studios — Experimental Mathematics &amp;
          Consciousness Research
          <br />
          All Jewble branding and creative IP remains the property of Blue Snake
          Studios.
        </p>
      </footer>
    </div>
  );
}
