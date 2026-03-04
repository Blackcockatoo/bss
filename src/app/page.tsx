"use client";

import "./landing.css";

type SnakeHue = "gold" | "teal";

class Snake {
  x = 0;
  y = 0;
  angle = 0;
  speed = 0;
  life = 0;
  maxLife = 0;
  hue: SnakeHue = "gold";
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

export default function LandingPage() {
  const adCards = [
    {
      platform: "Meta / Instagram",
      audience: "Parents",
      headline: "A digital pet that never sells your child.",
      body:
        "Meta-Pet is an offline-first companion app with no ads, no surveillance, and no account setup. Kids grow a calm creature while building reflection habits and systems thinking.",
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
        "Meta-Pet combines privacy-by-design architecture, education distribution, and retention-led product loops in a market where regulation is accelerating differentiation.",
      cta: "Request the investor briefing packet.",
    },
  ];

  const kppsDocs = [
    {
      title: "Package index",
      tag: "Start here",
      href: "https://bluesnakestudios.com",
      description:
        "Overview of the full KPPS Teacher Hub package, audience pathways, and rollout steps.",
    },
    {
      title: "Teacher Hub welcome",
      tag: "Document 1",
      href: "https://bluesnakestudios.com",
      description:
        "Strategic framing of The Veil model, mission fit, and the pilot context for schools.",
    },
    {
      title: "Implementation guide",
      tag: "Document 2",
      href: "https://bluesnakestudios.com",
      description:
        "Seven-session classroom roadmap aligned to the KPPS gradual release structure.",
    },
    {
      title: "Facilitation scripts",
      tag: "Document 3",
      href: "https://bluesnakestudios.com",
      description:
        "Plug-and-play teacher language and transition cues for each pilot session.",
    },
    {
      title: "Reflection prompts",
      tag: "Document 4",
      href: "https://bluesnakestudios.com",
      description:
        "Printable and digital prompt bank across wellbeing, systems thinking, and values.",
    },
    {
      title: "Values integration map",
      tag: "Document 5",
      href: "https://bluesnakestudios.com",
      description:
        "Leadership-level alignment to KPPS values, policy intent, and success metrics.",
    },
    {
      title: "Parent communication kit",
      tag: "Document 6",
      href: "https://bluesnakestudios.com",
      description:
        "Ready-to-send Sentral and newsletter templates for pre, mid, and post-pilot updates.",
    },
    {
      title: "Privacy & safety brief",
      tag: "Document 7",
      href: "https://bluesnakestudios.com",
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
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const h7Ref = useRef<SVGPolygonElement>(null);
  const h7bRef = useRef<SVGPolygonElement>(null);
  const h7cRef = useRef<SVGPolygonElement>(null);
  const spokesRef = useRef<SVGGElement>(null);
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);

  function openPilotModal() {
    setIsPilotModalOpen(true);
  }

  function closePilotModal() {
    setIsPilotModalOpen(false);
  }

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
    if (!isPilotModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePilotModal();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    modalPanelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isPilotModalOpen]);

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
