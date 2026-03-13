import { useState, useEffect, useRef } from "react";

const SOURCE_ENTRIES = {
  dataSharing: {
    id: "S1",
    claim: "94% of top children's apps share data with third parties.",
    title: "How Many Apps on Children's Smartphones Are Privacy Label Compliant?",
    publication: "JMIR Pediatrics and Parenting",
    date: "2022-09-22",
    url: "https://pediatrics.jmir.org/2022/3/e37173",
  },
  copcConsultation: {
    id: "S2",
    claim: "Australia's Children's Online Privacy Code consultation is open.",
    title: "Children's Online Privacy Code consultation",
    publication: "eSafety Commissioner (Australia)",
    date: "2025",
    url: "https://www.esafety.gov.au/industry/tech-trends-and-challenges/childrens-online-privacy-code",
  },
  schoolMarket: {
    id: "S3",
    claim: "1,200+ independent and Catholic schools in Australia.",
    title: "Non-Government Schools Census Collection",
    publication: "Australian Curriculum, Assessment and Reporting Authority (ACARA)",
    date: "2024",
    url: "https://www.acara.edu.au/reporting/national-report-on-schooling-in-australia/non-government-schools-census-collection",
  },
};

const FLOORS = [
  {
    level: "LOBBY",
    sublabel: "Ground floor. Doors opening.",
    headline: "There's an app being built.",
    body: "It doesn't know your name. It doesn't want your data. It can't sell your kid to an algorithm. You're already intrigued. You just don't know it yet.",
    stat: null,
    color: "#FFD700",
  },
  {
    level: "FLOOR 01",
    sublabel: "Ding.",
    headline: "Big Tech has been farming your children.",
    body: "Every click. Every dwell time. Every emotional reaction. Packaged, sold, optimised against. The entire kids app market is a data extraction operation dressed in primary colours.",
    stat: "94% of top children's apps share data with third parties.",
    claimSources: ["dataSharing"],
    color: "#ff6b35",
  },
  {
    level: "FLOOR 02",
    sublabel: "Ding.",
    headline: "We built the opposite.",
    body: "Zero-Collection Educational Architecture. No account. No server. No profile. The app runs entirely on-device. The only thing it knows about your kid is what your kid chooses to tell it — and that never leaves the phone.",
    stat: "ZCEA: Zero data collected. Full stop.",
    color: "#7fffb2",
  },
  {
    level: "FLOOR 03",
    sublabel: "Ding.",
    headline: "The pet has a 180-digit genome.",
    body: "Every Jewble is genetically unique. Cryptographically born. Its personality, appearance, and growth emerge from a mathematical signature that belongs to the child who hatched it. No two have ever existed. No two ever will.",
    stat: "180-digit genetic architecture. More combinations than atoms in the observable universe.",
    color: "#a78bfa",
  },
  {
    level: "FLOOR 04",
    sublabel: "Ding.",
    headline: "The regulators are writing the rules right now.",
    body: "Australia's Children's Online Privacy Code consultation is open. We're not scrambling to comply — we're the reference implementation. We wrote a compliance framework before the law exists. When the law catches up, we're already the answer.",
    stat: "COPC 2025. We're not a case study. We're the blueprint.",
    claimSources: ["copcConsultation"],
    color: "#38bdf8",
  },
  {
    level: "FLOOR 05",
    sublabel: "Ding.",
    headline: "Schools are desperate for this.",
    body: "MACS. ISV. The independent and Catholic school systems across Australia. They need digital tools that don't require consent forms, data processing agreements, or explaining to a parent why their 8-year-old has a behavioural advertising profile. We fit without friction.",
    stat: "1,200+ independent and Catholic schools. Zero friction onboarding.",
    claimSources: ["schoolMarket"],
    color: "#fb923c",
  },
  {
    level: "FLOOR 06",
    sublabel: "Ding.",
    headline: "It teaches. It heals. It remembers.",
    body: "The Mirror System reflects emotional patterns back to children through their pet's behaviour. Dream Archaeology. Genome Sonification. Constellation Mapping. This isn't a game — it's a consciousness development tool wearing the disguise of something adorable.",
    stat: "Therapeutic framework embedded in gameplay loop.",
    color: "#f472b6",
  },
  {
    level: "PENTHOUSE",
    sublabel: "End of the line.",
    headline: "You're not investing in an app.",
    body: "You're investing in the idea that children deserve digital companions who are loyal to them — not to the platform. Blue Snake Studios built something that couldn't exist inside a VC model. Now you get to be part of how it reaches the world.",
    stat: "Jewble. The first companion that keeps its mouth shut.",
    color: "#FFD700",
  },
];

const HeptaStar = ({ size = 120, color = "#FFD700", opacity = 0.07 }) => {
  const points = [];
  const cx = size / 2, cy = size / 2, r = size * 0.45, r2 = size * 0.2;
  for (let i = 0; i < 7; i++) {
    const a1 = (Math.PI * 2 * i) / 7 - Math.PI / 2;
    const a2 = (Math.PI * 2 * (i + 0.5)) / 7 - Math.PI / 2;
    points.push(`${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`);
    points.push(`${cx + r2 * Math.cos(a2)},${cy + r2 * Math.sin(a2)}`);
  }
  return (
    <svg width={size} height={size} style={{ position: "absolute", opacity }}>
      <polygon points={points.join(" ")} fill={color} />
    </svg>
  );
};

const OuroborosRing = ({ size = 300, color = "#FFD700", opacity = 0.04 }) => (
  <svg width={size} height={size} style={{ position: "absolute", opacity }}>
    <circle cx={size/2} cy={size/2} r={size*0.44} fill="none" stroke={color} strokeWidth={size*0.08}
      strokeDasharray={`${size*0.12} ${size*0.04}`} />
    <circle cx={size/2} cy={size/2} r={size*0.3} fill="none" stroke={color} strokeWidth={2}
      strokeDasharray={`${size*0.06} ${size*0.02}`} />
  </svg>
);

export default function JewbleElevator() {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);
  const [scanline, setScanline] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setScanline(s => (s + 1) % 100);
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goToNextFloor = () => {
    if (traveling) return;
    setDoorsOpen(false);
    setRevealed(false);
    setShowSources(false);
    setTraveling(true);
    setTimeout(() => {
      setCurrentFloor(f => Math.min(f + 1, FLOORS.length - 1));
      setTraveling(false);
      setTimeout(() => {
        setDoorsOpen(true);
        setTimeout(() => setRevealed(true), 400);
      }, 300);
    }, 800);
  };

  const restart = () => {
    setDoorsOpen(false);
    setRevealed(false);
    setShowSources(false);
    setCurrentFloor(0);
    setTimeout(() => {
      setDoorsOpen(true);
      setTimeout(() => setRevealed(true), 400);
    }, 500);
  };

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      setDoorsOpen(true);
      setTimeout(() => setRevealed(true), 400);
    }, 600);
  };

  const floor = FLOORS[currentFloor];
  const isLast = currentFloor === FLOORS.length - 1;
  const floorSources = (floor.claimSources || []).map((sourceKey) => SOURCE_ENTRIES[sourceKey]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 20% 30%, #0f172a 0%, #04071a 55%, #000 100%)",
      color: "#fff",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "1rem",
    }}>
      {/* Background ambience */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <HeptaStar size={180} color="#FFD700" opacity={0.03} style={{ top: "10%", left: "8%" }} />
        <HeptaStar size={120} color="#7fffb2" opacity={0.04} style={{ top: "70%", right: "12%" }} />
        <OuroborosRing size={360} color="#FFD700" opacity={0.03} style={{ top: "15%", right: "5%" }} />
        <OuroborosRing size={280} color="#ff6b35" opacity={0.02} style={{ bottom: "10%", left: "12%" }} />
        {/* subtle animated scan lines */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <line key={i} x1="0" y1={`${i * 2}%`} x2="100%" y2={`${i * 2}%`} stroke="#FFD700" strokeWidth="1" />
          ))}
        </svg>
        {/* Scanline */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: "2px",
          top: `${scanline}%`,
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.08), transparent)",
          transition: "top 0.05s linear",
        }} />
      </div>

      {!started ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "2rem", padding: "2rem", textAlign: "center", zIndex: 10,
        }}>
          <div style={{ color: "#FFD700", fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", opacity: 0.6 }}>
            Blue Snake Studios presents
          </div>
          <div style={{
            fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 900,
            color: "#FFD700", letterSpacing: "-0.02em", lineHeight: 1,
            textShadow: "0 0 60px rgba(255,215,0,0.4)",
            fontFamily: "'Courier New', monospace",
          }}>
            JEWBLE
          </div>
          <div style={{ color: "#fff", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", opacity: 0.7, maxWidth: "400px", lineHeight: 1.6 }}>
            An elevator pitch.<br />
            Except the doors keep opening.<br />
            And each floor makes you feel<br />
            <span style={{ color: "#ff6b35" }}>stupider for not already being in.</span>
          </div>
          <button
            onClick={handleStart}
            style={{
              marginTop: "1rem",
              padding: "1rem 2.5rem",
              background: "transparent",
              border: `2px solid #FFD700`,
              color: "#FFD700",
              fontSize: "0.85rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.target.style.background = "#FFD700";
              e.target.style.color = "#04071a";
            }}
            onMouseLeave={e => {
              e.target.style.background = "transparent";
              e.target.style.color = "#FFD700";
            }}
          >
            Enter The Building
          </button>
        </div>
      ) : (
        <div style={{
          width: "min(520px, 95vw)",
          position: "relative",
          zIndex: 10,
        }}>
          {/* Floor indicator display */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "0.5rem", padding: "0 4px",
          }}>
            <div style={{
              color: floor.color, fontSize: "0.65rem", letterSpacing: "0.4em",
              textTransform: "uppercase", opacity: 0.9,
              textShadow: `0 0 20px ${floor.color}`,
              transition: "color 0.5s, text-shadow 0.5s",
            }}>
              {floor.level}
            </div>
            <div style={{
              display: "flex", gap: "4px",
            }}>
              {FLOORS.map((_, i) => (
                <div key={i} style={{
                  width: i === currentFloor ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === currentFloor ? floor.color : i < currentFloor ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.1)",
                  transition: "all 0.4s",
                }} />
              ))}
            </div>
          </div>

          {/* Elevator shaft */}
          <div style={{
            border: `1px solid rgba(255,215,0,0.15)`,
            borderTop: `3px solid ${floor.color}`,
            background: "rgba(4,7,26,0.95)",
            position: "relative",
            overflow: "hidden",
            transition: "border-top-color 0.5s",
            boxShadow: `0 0 40px rgba(4,7,26,0.8), inset 0 0 80px rgba(0,0,0,0.5)`,
          }}>
            {/* Door panels - slide left and right */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
              display: "flex",
            }}>
              <div style={{
                width: "50%", height: "100%",
                background: "linear-gradient(135deg, #0d1433 0%, #060c24 100%)",
                borderRight: "1px solid rgba(255,215,0,0.1)",
                transform: doorsOpen ? "translateX(-100%)" : "translateX(0)",
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
              <div style={{
                width: "50%", height: "100%",
                background: "linear-gradient(225deg, #0d1433 0%, #060c24 100%)",
                borderLeft: "1px solid rgba(255,215,0,0.1)",
                transform: doorsOpen ? "translateX(100%)" : "translateX(0)",
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>

            {/* Floor content */}
            <div style={{
              padding: "1.5rem",
              minHeight: "420px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1rem",
            }}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}>
                  {floor.sublabel}
                </div>

                <h2 style={{
                  color: floor.color,
                  fontSize: "clamp(1.5rem, 4.5vw, 2.15rem)",
                  lineHeight: 1.15,
                  margin: 0,
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.5s 0.2s, transform 0.5s 0.2s, color 0.5s, text-shadow 0.5s",
                }}>
                  {floor.headline}
                </h2>

                <p style={{
                  color: "rgba(255,255,255,0.82)",
                  fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
                  lineHeight: 1.75,
                  margin: 0,
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.5s 0.35s, transform 0.5s 0.35s",
                }}>
                  {floor.body}
                </p>
              </div>

              {floor.stat && (
                <div style={{
                  borderLeft: `3px solid ${floor.color}`,
                  paddingLeft: "1rem",
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateX(0)" : "translateX(-8px)",
                  transition: `opacity 0.5s 0.55s, transform 0.5s 0.55s, border-color 0.5s`,
                }}>
                  <p style={{
                    color: floor.color,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    margin: 0,
                    textShadow: `0 0 20px ${floor.color}40`,
                    transition: "color 0.5s",
                  }}>
                    {floor.stat}
                  </p>
                  {floorSources.length > 0 && (
                    <div style={{ marginTop: "0.7rem" }}>
                      <button
                        type="button"
                        onClick={() => setShowSources((open) => !open)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${floor.color}77`,
                          color: floor.color,
                          fontSize: "0.62rem",
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          padding: "0.4rem 0.65rem",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                      >
                        {showSources ? "Hide Sources" : "Show Sources"}
                      </button>
                      {showSources && (
                        <div style={{ marginTop: "0.7rem", display: "grid", gap: "0.6rem" }}>
                          {floorSources.map((source) => (
                            <div key={source.id} style={{
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: "6px",
                              padding: "0.6rem",
                            }}>
                              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.67rem", marginBottom: "0.25rem" }}>
                                [{source.id}] {source.title}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.58)", fontSize: "0.62rem", marginBottom: "0.25rem" }}>
                                {source.publication} · {source.date}
                              </div>
                              <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: floor.color, fontSize: "0.64rem" }}>
                                {source.url}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.5s 0.7s, transform 0.5s 0.7s",
              }}>
                {isLast ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{
                      color: "#FFD700",
                      fontSize: "clamp(1rem, 3vw, 1.2rem)",
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      textAlign: "center",
                      textShadow: "0 0 40px rgba(255,215,0,0.6)",
                      padding: "1rem 0",
                    }}>
                      — JEWBLE.APP —
                    </div>
                    <a
                      href="/references"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "center",
                        background: "rgba(56,189,248,0.08)",
                        border: "1px solid rgba(56,189,248,0.35)",
                        color: "#7dd3fc",
                        fontSize: "0.65rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        borderRadius: "4px",
                      }}
                    >
                      View Evidence & Sources
                    </a>
                    <button
                      onClick={restart}
                      style={{
                        width: "100%",
                        padding: "0.9rem",
                        background: "transparent",
                        border: "1px solid rgba(255,215,0,0.3)",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.7rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                    >
                      Ride Again
                    </button>
                    <a
                      href="/"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "center",
                        background: "transparent",
                        border: "1px solid rgba(77,214,200,0.3)",
                        color: "rgba(77,214,200,0.6)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        borderRadius: "4px",
                      }}
                    >
                      ← Back to Campaign
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={goToNextFloor}
                    disabled={traveling || !revealed}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      background: traveling ? "rgba(255,215,0,0.05)" : "transparent",
                      border: `1px solid ${floor.color}`,
                      color: floor.color,
                      fontSize: "0.75rem",
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      cursor: traveling ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.3s",
                      opacity: traveling ? 0.5 : 1,
                    }}
                  >
                    {traveling ? "▲  Moving..." : "▲  Next Floor"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{
            textAlign: "center",
            marginTop: "0.75rem",
            color: "rgba(255,255,255,0.35)",
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            {floor.sublabel}
          </div>
        </div>
      )}
    </div>
  );
}
