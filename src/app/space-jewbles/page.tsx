"use client";

import { PatternRecognitionGame } from "@/components/PatternRecognitionGame";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ChevronLeft, Rocket, Stars } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function SpaceJewblesPage() {
  const startTick = useStore((s) => s.startTick);
  const stopTick = useStore((s) => s.stopTick);
  const genome = useStore((s) => s.genome);

  useEffect(() => {
    startTick();
    return () => stopTick();
  }, [startTick, stopTick]);

  return (
    <div className="min-h-screen bg-[#050a12] text-white flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` 
          }} 
        />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-4">
          <Link href="/compass">
            <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
              Back to Compass
            </Button>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-tight uppercase text-sm">Space Jewbles</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/pet">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
              My Pet
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          {/* Decorative Corner Stars */}
          <Stars className="absolute top-4 left-4 w-4 h-4 text-purple-400/40" />
          <Stars className="absolute bottom-4 right-4 w-4 h-4 text-blue-400/40" />

          {!genome ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Rocket className="w-10 h-10 text-zinc-600" />
              </div>
              <h2 className="text-2xl font-bold">No Pet Detected</h2>
              <p className="text-zinc-400 max-w-sm mx-auto">
                Space Jewbles uses your companion's unique genetic code to generate patterns. 
                Please wake your pet first.
              </p>
              <Link href="/pet">
                <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-none px-8">
                  Wake My Pet
                </Button>
              </Link>
            </div>
          ) : (
            <PatternRecognitionGame />
          )}
        </div>

        {/* Game Footer / Info */}
        <div className="mt-12 max-w-md text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-xs text-cyan-400">
            <Stars className="w-3 h-3" />
            Genome-Synchronized Session
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Every pattern you see is mathematically derived from your pet's 
            unique 180-digit DNA sequence. High accuracy scores help 
            stabilize your pet's mood and boost their energy levels.
          </p>
        </div>
      </main>
    </div>
  );
}
