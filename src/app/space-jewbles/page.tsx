'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ArrowLeft, Trophy, Zap, Target, Skull, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkSpaceJewblesRewards } from '@/lib/addons/starter';
import { createDefaultMiniGameProgress } from '@/lib/progression/types';

// Dynamic import of PhaserGame to avoid SSR issues
const PhaserGame = dynamic(
  () => import('./game/PhaserGame').then((mod) => ({ default: mod.PhaserGame })),
  { ssr: false }
);

interface GameResult {
  score: number;
  wave: number;
  bossesDefeated: number;
  mythicDrops: number;
}

export default function SpaceJewblesPage() {
  const [gameStarted, setGameStarted] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Get pet data from store
  const traits = useStore((s) => s.traits);
  const genome = useStore((s) => s.genome);
  const miniGames = useStore((s) => s.miniGames);
  const safeMiniGames = useMemo(
    () => miniGames ?? createDefaultMiniGameProgress(),
    [miniGames]
  );
  const recordSpaceJewblesRun = useStore((s) => s.recordSpaceJewblesRun);

  // Generate genome seed for consistency
  const genomeSeed = useMemo(() => {
    if (!genome) return undefined;
    const slices = [
      ...genome.red60.slice(0, 12),
      ...genome.blue60.slice(0, 12),
      ...genome.black60.slice(0, 12),
    ];
    return slices.reduce((total, value, index) => total + value * (index + 5), 0);
  }, [genome]);

  // Build pet data to send to the game
  const petData = useMemo(() => {
    if (!traits?.physical) {
      return {
        bodyType: 'Spherical',
        primaryColor: '#00FFFF',
        secondaryColor: '#FF00FF',
        pattern: 'Solid',
        texture: 'Smooth',
        size: 1,
        features: [],
        genomeSeed,
        genome,
      };
    }
    return {
      bodyType: traits.physical.bodyType,
      primaryColor: traits.physical.primaryColor,
      secondaryColor: traits.physical.secondaryColor,
      pattern: traits.physical.pattern,
      texture: traits.physical.texture,
      size: traits.physical.size,
      features: traits.physical.features,
      genomeSeed,
      genome,
    };
  }, [traits, genomeSeed, genome]);

  const handleGameEnd = useCallback(
    async (stats: GameResult) => {
      setLastResult(stats);
      setGameStarted(false);

      // Record the run in the store
      recordSpaceJewblesRun(
        stats.score,
        stats.wave,
        stats.bossesDefeated,
        stats.mythicDrops
      );

      // Check for addon rewards with updated totals
      const updatedStats = {
        maxWave: Math.max(safeMiniGames.spaceJewblesMaxWave, stats.wave),
        bossesDefeated:
          safeMiniGames.spaceJewblesBossesDefeated + stats.bossesDefeated,
        mythicDrops:
          safeMiniGames.spaceJewblesMythicDrops + stats.mythicDrops,
      };

      const rewards = await checkSpaceJewblesRewards(updatedStats);
      if (rewards.newUnlocks.length > 0) {
        setNewUnlocks(rewards.newUnlocks);
        setShowUnlockAnimation(true);
        setTimeout(() => setShowUnlockAnimation(false), 5000);
      }
    },
    [recordSpaceJewblesRun, safeMiniGames]
  );

  // Reset for new game
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setLastResult(null);
    setNewUnlocks([]);
  }, []);

  // Calculate progress towards rewards
  const rewardProgress = useMemo(
    () => ({
      badge: {
        current: safeMiniGames.spaceJewblesMaxWave,
        target: 10,
        label: 'Champion Badge',
      },
      banana: {
        current: safeMiniGames.spaceJewblesBossesDefeated,
        target: 5,
        label: 'Cosmic Banana',
      },
      mythic: {
        current: safeMiniGames.spaceJewblesMythicDrops,
        target: 3,
        label: 'Mythic Aura',
      },
    }),
    [safeMiniGames]
  );

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col overflow-hidden">
      {/* Unlock Animation Overlay */}
      {showUnlockAnimation && newUnlocks.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
          aria-live="polite"
          role="status"
        >
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 border-2 border-amber-400 shadow-2xl animate-bounce-in">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-amber-400 mb-2">
                Addon Unlocked!
              </h2>
              {newUnlocks.map((name, i) => (
                <p key={i} className="text-xl text-white">
                  {name}
                </p>
              ))}
              <p className="text-slate-400 mt-4 text-sm">
                Check your addon inventory!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <Link href="/pet">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pet
          </Button>
        </Link>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Space Jewbles
        </h1>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span aria-live="polite">
              High: {safeMiniGames.spaceJewblesHighScore.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" />
            <span aria-live="polite">
              Wave: {safeMiniGames.spaceJewblesMaxWave}
            </span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative">
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 text-center">
              {/* Animated title */}
              <div className="text-6xl mb-6 animate-bounce">
                <span className="text-cyan-400">S</span>
                <span className="text-purple-400">P</span>
                <span className="text-pink-400">A</span>
                <span className="text-amber-400">C</span>
                <span className="text-emerald-400">E</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">JEWBLES</h2>
              <p className="text-slate-400 mb-6">
                Defend the cosmos with your pet and absurd weaponry!
              </p>

              {lastResult && (
                <div
                  className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3"
                  aria-live="polite"
                  role="status"
                >
                  <h3 className="text-lg font-semibold text-cyan-300">
                    Last Run
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 justify-center">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span className="text-white">
                        {lastResult.score.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-white">
                        Wave {lastResult.wave}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Skull className="w-4 h-4 text-red-400" />
                      <span className="text-white">
                        {lastResult.bossesDefeated} Bosses
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-pink-400 text-lg">*</span>
                      <span className="text-white">
                        {lastResult.mythicDrops} Mythic
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-amber-400 font-bold text-xl">
                    {safeMiniGames.spaceJewblesHighScore.toLocaleString()}
                  </div>
                  <div className="text-slate-500">High Score</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-cyan-400 font-bold text-xl">
                    {safeMiniGames.spaceJewblesMaxWave}
                  </div>
                  <div className="text-slate-500">Max Wave</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-red-400 font-bold text-xl">
                    {safeMiniGames.spaceJewblesBossesDefeated}
                  </div>
                  <div className="text-slate-500">Bosses</div>
                </div>
              </div>

              {/* Addon Reward Progress */}
              <div className="bg-slate-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-300">
                    Earnable Addons
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(rewardProgress).map(([key, prog]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>{prog.label}</span>
                          <span>
                            {Math.min(prog.current, prog.target)}/{prog.target}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              prog.current >= prog.target
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                : 'bg-purple-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (prog.current / prog.target) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {prog.current >= prog.target && (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weapon preview */}
              <div className="flex justify-center gap-2 mb-6 text-2xl">
                <span title="Banana - Slip!">&#x1F34C;</span>
                <span title="Boot - Stomp!">&#x1F97E;</span>
                <span title="Book - Smart!">&#x1F4DA;</span>
                <span title="Rubber Chicken - Squeak!">&#x1F414;</span>
                <span title="Donut - Sticky!">&#x1F369;</span>
                <span title="Toilet Paper - Pierce!">&#x1F9FB;</span>
                <span title="Cosmic Sock - Stink Bomb!">&#x1F9E6;</span>
              </div>

              <Button
                onClick={handleStartGame}
                className="w-full py-6 text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
              >
                {lastResult ? 'Play Again' : 'Start Game'}
              </Button>

              <p className="text-slate-500 text-xs mt-4">
                Tap to attack | 1-7 to switch weapons | U for upgrades
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <PhaserGame petData={petData} onGameEnd={handleGameEnd} />
          </div>
        )}
      </div>

      {/* Bottom padding for nav */}
      <div className="h-20" />
    </div>
  );
}
