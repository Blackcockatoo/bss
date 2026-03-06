import { useState, useEffect, useRef } from "react";

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
    color: "#38bdf8",
  },
  {
    level: "FLOOR 05",
    sublabel: "Ding.",
    headline: "Schools are desperate for this.",
    body: "MACS. ISV. The independent and Catholic school systems across Australia. They need digital tools that don't require consent forms, data processing agreements, or explaining to a parent why their 8-year-old has a behavioural advertising profile. We fit without friction.",
    stat: "1,200+ independent and Catholic schools. Zero friction onboarding.",
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

// 7-pointed star path (hepta) as SVG
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#04071a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Background geometry */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", transform: "rotate(13deg)" }}>
          <HeptaStar size={200} opacity={0.06} />
        </div>
        <div style={{ position: "absolute", bottom: "15%", right: "8%" }}>
          <OuroborosRing size={350} opacity={0.05} />
        </div>
        <div style={{ position: "absolute", top: "40%", right: "20%", transform: "rotate(-7deg)" }}>
          <HeptaStar size={120} color="#a78bfa" opacity={0.05} />
        </div>
        {/* Grid lines */}
        <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.03 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={i} x1={`${i * 5.26}%`} y1="0" x2={`${i * 5.26}%`} y2="100%" stroke="#FFD700" strokeWidth="1" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={i} x1="0" y1={`${i * 5.26}%`} x2="100%" y2={`${i * 5.26}%`} stroke="#FFD700" strokeWidth="1" />
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
        // Intro screen
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
        // Elevator
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
            {/* Corner brackets */}
            {[["0,0","20px,0","0,20px"],["0,0","0,20px","20px,0"].map(v=>v)].map((_, qi) => (
              ["top-left","top-right","bottom-left","bottom-right"].map(corner => (
                <div key={corner} style={{
                  position: "absolute",
                  [corner.includes("top") ? "top" : "bottom"]: 0,
                  [corner.includes("left") ? "left" : "right"]: 0,
                  width: "20px", height: "20px",
                  borderTop: corner.includes("top") ? `2px solid ${floor.color}` : "none",
                  borderBottom: corner.includes("bottom") ? `2px solid ${floor.color}` : "none",
                  borderLeft: corner.includes("left") ? `2px solid ${floor.color}` : "none",
                  borderRight: corner.includes("right") ? `2px solid ${floor.color}` : "none",
                  opacity: 0.6,
                  transition: "border-color 0.5s",
                  zIndex: 5,
                  pointerEvents: "none",
                }} />
              ))
            ))}

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
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: "10px",
              }}>
                {!doorsOpen && (
                  <div style={{ opacity: 0.2 }}>
                    <HeptaStar size={60} />
                  </div>
                )}
              </div>
              <div style={{
                width: "50%", height: "100%",
                background: "linear-gradient(225deg, #0d1433 0%, #060c24 100%)",
                borderLeft: "1px solid rgba(255,215,0,0.1)",
                transform: doorsOpen ? "translateX(100%)" : "translateX(0)",
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex", alignItems: "center", justifyContent: "flex-start",
                paddingLeft: "10px",
              }}>
                {!doorsOpen && (
                  <div style={{ opacity: 0.2 }}>
                    <HeptaStar size={60} />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: "clamp(1.5rem, 5vw, 2.5rem)",
              minHeight: "320px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}>
              <div>
                <div style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                  opacity: revealed ? 1 : 0,
                  transition: "opacity 0.4s 0.1s",
                }}>
                  {floor.sublabel}
                </div>

                <h2 style={{
                  color: floor.color,
                  fontSize: "clamp(1.2rem, 4vw, 1.7rem)",
                  fontWeight: 900,
                  lineHeight: 1.2,
                  margin: 0,
                  marginBottom: "1rem",
                  textShadow: `0 0 30px ${floor.color}60`,
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(10px)",
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
                </div>
              )}

              {/* CTA */}
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
                      onMouseEnter={e => {
                        e.target.style.borderColor = "rgba(255,215,0,0.6)";
                        e.target.style.color = "rgba(255,255,255,0.7)";
                      }}
                      onMouseLeave={e => {
                        e.target.style.borderColor = "rgba(255,215,0,0.3)";
                        e.target.style.color = "rgba(255,255,255,0.4)";
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
                    onMouseEnter={e => {
                      if (!traveling) {
                        e.target.style.background = floor.color;
                        e.target.style.color = "#04071a";
                      }
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = "transparent";
                      e.target.style.color = floor.color;
                    }}
                  >
                    {traveling ? "▲  Moving..." : "▲  Next Floor"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Floor sublabel */}
          <div style={{
            textAlign: "center",
            marginTop: "0.75rem",
            color: "rgba(255,255,255,0.2)",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}>
            Blue Snake Studios · Jewble Meta-Pet Platform · Melbourne
          </div>
        </div>
      )}
    </div>
  );
}
