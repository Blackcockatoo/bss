"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Director } from "./director";

export function MoonlitGarden({ director }: { director: Director }) {
  const paused = useSyncExternalStore(director.subscribePolicy, director.isPaused, () => false);
  const [flight, setFlight] = useState(0);
  const [midnight, setMidnight] = useState(false);

  useEffect(() => {
    if (paused || director.isReduced()) return;
    let flightIndex = 0;
    let timer: ReturnType<typeof setTimeout>;
    let settle: ReturnType<typeof setTimeout>;
    let midnightTimer: ReturnType<typeof setTimeout>;
    function fly() {
      if (!director.isBlocked() && director.getMode() !== "calm" &&
        director.play("curious", { source: "ambient", intensity: .65, duration: 2300, direction: flightIndex % 2 ? -1 : 1 })) {
        setFlight(++flightIndex);
        settle = setTimeout(() => setFlight(0), 2350);
      }
      if (!document.hidden) timer = setTimeout(fly, 16_000);
    }
    function schedule() {
      clearTimeout(timer);
      clearTimeout(settle);
      clearTimeout(midnightTimer);
      setFlight(0);
      if (document.hidden) return;
      timer = setTimeout(fly, 900);
      midnightTimer = setTimeout(() => {
        if (director.isBlocked() || director.getMode() === "calm") return;
        setMidnight(true);
        director.play("stargazing", { source: "ambient", intensity: .6 });
      }, 36_000);
    }
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
      clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [director, paused]);

  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl"
    style={{ boxShadow: midnight ? "inset 0 0 110px #2e187b80" : "inset 0 0 85px #26367a55" }}>
    {flight > 0 && !paused && <div key={flight}
      className="absolute top-[19%] motion-reduce:hidden"
      style={{ [flight % 2 ? "right" : "left"]: "20%", animation: `pet-garden-moth-${flight % 2 ? "left" : "right"} 2.35s ease-in-out both` }}>
      <span className="inline-block h-3 w-4 rounded-[60%_15%] bg-violet-200 shadow-[0_0_12px_#c4b5fd]" />
      <span className="inline-block h-3 w-4 -scale-x-100 rounded-[60%_15%] bg-violet-200" />
    </div>}
    <style>{`
      @keyframes pet-garden-moth-left {
        0% { opacity: 0; transform: translate(22px, -12px) rotate(-18deg) }
        24% { opacity: 1 }
        58% { opacity: .9; transform: translate(-30px, 26px) rotate(19deg) }
        100% { opacity: 0; transform: translate(14px, -20px) rotate(-12deg) }
      }
      @keyframes pet-garden-moth-right {
        0% { opacity: 0; transform: translate(-22px, -12px) rotate(18deg) }
        24% { opacity: 1 }
        58% { opacity: .9; transform: translate(30px, 26px) rotate(-19deg) }
        100% { opacity: 0; transform: translate(-14px, -20px) rotate(12deg) }
      }
    `}</style>
  </div>;
}
