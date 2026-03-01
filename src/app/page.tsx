"use client";

import { useEffect, useRef } from "react";
import "./landing.css";

export default function LandingPage() {
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
          <a href="#for-schools">For Schools</a>
          <a href="#teacher-hub">Teacher Hub</a>
          <a href="#student-app">Student App</a>
          <a href="#privacy">Privacy</a>
          <a href="#pilot">Pilot</a>
          <a className="cta-nav" href="#pilot">Start a Pilot</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-eyebrow">For Australian classrooms</div>
        <h1>
          A classroom-safe digital companion.
          <br />
          Offline-first. Zero accounts. Zero data collected.
        </h1>
        <p className="hero-sub">
          Jewble Meta-Pet is built for Australian classrooms: a calm learning companion + teacher hub that works without student logins and without cloud collection.
        </p>
        <div className="hero-actions">
          <a className="btn btn-gold" href="#pilot">Start a School Pilot</a>
          <a className="btn btn-ghost" href="https://teachers-meta-pet-mr-brand.vercel.app/" target="_blank" rel="noopener noreferrer">Watch 2-min Demo</a>
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
          Designed for schools that need safer tools under rising privacy expectations and device-policy change.
        </p>
      </section>

      <div className="divider" />

      <section className="section" id="for-schools">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Proof bar</span>
          <h2 className="reveal">Built to be safe by default.</h2>
          <div className="grid-3 reveal">
            <div className="card"><div className="card-top g" /><h4>Offline-first</h4><p>Runs without internet. No always-on services.</p></div>
            <div className="card"><div className="card-top t" /><h4>No accounts</h4><p>No student emails, passwords, or logins.</p></div>
            <div className="card"><div className="card-top v" /><h4>Zero data collected</h4><p>Nothing transmitted. Nothing sold. Nothing to breach.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="why-this-exists">
        <div className="wrap">
          <span className="section-tag t-teal reveal">Why this exists</span>
          <h2 className="reveal">Schools are being asked to prove digital tools are safe, useful, and worth class time.</h2>
          <p className="lead reveal" style={{ marginBottom: "20px" }}>Jewble was built to meet that bar by architecture, not policy.</p>
          <div className="card reveal"><div className="card-top g" /><h4>If there&apos;s no central collection, there&apos;s no central breach.</h4></div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="student-app">
        <div className="wrap">
          <span className="section-tag t-violet reveal">What Jewble is</span>
          <h2 className="reveal">Jewble is two connected experiences.</h2>
          <div className="grid-2 reveal">
            <div className="card"><div className="card-top g" /><h4>1) The Student Companion (Meta-Pet App)</h4><p>A calm companion students care for over time, with guided reflection and classroom activities.</p></div>
            <div className="card"><div className="card-top t" /><h4>2) The Teacher Hub (&ldquo;The Veil&rdquo;)</h4><p>A dashboard for pairing, facilitation scripts, and classroom mini-games that reinforce learning outcomes.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="how-it-works">
        <div className="wrap">
          <span className="section-tag t-gold reveal">How it works</span>
          <h2 className="reveal">1–2–3 classroom rollout.</h2>
          <div className="timeline reveal">
            <div className="tl-item"><div className="tl-num">1</div><div className="tl-body"><h4>Teacher opens the Hub</h4><p>Generate pairing cards in minutes.</p></div></div>
            <div className="tl-item"><div className="tl-num">2</div><div className="tl-body"><h4>Students pair by QR</h4><p>No accounts. No identity system.</p></div></div>
            <div className="tl-item"><div className="tl-num">3</div><div className="tl-body"><h4>Learning runs locally</h4><p>Reflection prompts, classroom mini-games, and wellbeing routines live on device.</p></div></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="teacher-hub">
        <div className="wrap">
          <span className="section-tag t-teal reveal">The Teacher Hub (The Veil)</span>
          <h2 className="reveal">Built for teacher control, minimal admin.</h2>
          <div className="grid-3 reveal">
            <div className="card"><div className="card-top g" /><h4>QR Pairing</h4><p>Fast setup without accounts.</p></div>
            <div className="card"><div className="card-top t" /><h4>Facilitation Scripts</h4><p>Short, repeatable lesson flows.</p></div>
            <div className="card"><div className="card-top v" /><h4>Blessings</h4><p>Positive nudges + classroom rewards.</p></div>
            <div className="card"><div className="card-top t" /><h4>Constellation View</h4><p>Class overview at a glance.</p></div>
            <div className="card"><div className="card-top g" /><h4>Classroom Quest mini-games</h4><p>School-friendly rounds that support current learning goals.</p></div>
            <div className="card"><div className="card-top c" /><h4>Micro-line</h4><p>Teacher-guided. Student-owned. Device-local.</p></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="privacy">
        <div className="wrap">
          <span className="section-tag t-gold reveal">Privacy by architecture</span>
          <h2 className="reveal">Jewble eliminates common school risks.</h2>
          <div className="grid-2 reveal">
            <div className="card"><div className="card-top g" /><h4>No accounts</h4><p>No password resets or student identity datastore.</p></div>
            <div className="card"><div className="card-top t" /><h4>Offline-first</h4><p>No tracking dependency and fewer attack surfaces.</p></div>
            <div className="card"><div className="card-top v" /><h4>Zero collection by default</h4><p>No central database of student information.</p></div>
            <div className="card"><div className="card-top c" /><h4>QR pairing</h4><p>Setup without emails or profiles.</p></div>
          </div>
          <p className="lead reveal" style={{ marginTop: "20px", marginBottom: 0 }}>We don&apos;t &ldquo;handle data carefully.&rdquo; We don&apos;t collect it.</p>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="pilot">
        <div className="wrap">
          <span className="section-tag t-violet reveal">The pilot</span>
          <h2 className="reveal">Start with one class. One week. One teacher.</h2>
          <div className="grid-2 reveal">
            <div className="card"><div className="card-top g" /><h4>Pilot format</h4><p>7 sessions (30–45 minutes).</p><h4 style={{ marginTop: "14px" }}>Setup time</h4><p>~10 minutes.</p><h4 style={{ marginTop: "14px" }}>What you get</h4><p>Teacher scripts + classroom activities + simple rollout guide.</p></div>
            <div className="card"><div className="card-top t" /><h4>What you don&apos;t need</h4><p>Accounts, student emails, cloud dashboards.</p><div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}><a className="btn btn-gold" href="mailto:hello@bluesnakestudios.com.au?subject=Start%20School%20Pilot">Start a Pilot →</a><a className="btn btn-ghost" href="mailto:hello@bluesnakestudios.com.au?subject=Book%2012-minute%20Call">Book a 12-minute Call</a></div></div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="faq">
        <div className="wrap">
          <span className="section-tag t-teal reveal">FAQ</span>
          <h2 className="reveal">Short + direct.</h2>
          <div className="grid-2 reveal">
            <div className="card"><div className="card-top g" /><h4>Does it collect student data?</h4><p>No by default. The core experience runs locally.</p></div>
            <div className="card"><div className="card-top t" /><h4>Do students need accounts?</h4><p>No. Pairing is via QR.</p></div>
            <div className="card"><div className="card-top v" /><h4>Does it need internet?</h4><p>No. Offline-first.</p></div>
            <div className="card"><div className="card-top c" /><h4>Is it curriculum-aligned?</h4><p>It&apos;s designed to reinforce classroom learning outcomes and can be mapped to your current units.</p></div>
            <div className="card"><div className="card-top g" /><h4>What does it cost?</h4><p>School pilots are offered with a simple educational-use licence. (Pricing available after pilot.)</p></div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">Ready to pilot a safer classroom tool?</div>
        <div className="footer-tagline">Start a free pilot with one class.</div>
        <div className="footer-links">
          <a href="#pilot">Start Pilot</a>
          <a href="https://teachers-meta-pet-mr-brand.vercel.app/" target="_blank" rel="noopener noreferrer">Watch Demo</a>
          <a href="mailto:hello@bluesnakestudios.com.au">Contact</a>
        </div>
        <p className="footer-legal">© 2026 Blue Snake Studios — School receives a limited educational-use licence during pilot. Blue Snake Studios retains IP.</p>
      </footer>
    </div>
  );
}
