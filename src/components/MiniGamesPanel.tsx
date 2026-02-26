'use client';

import { useMemo, useState } from 'react';
import { BrainCircuit, Gamepad2, Lock, Music4, Rocket } from 'lucide-react';

import { useStore } from '@/lib/store';

import { SafeCrackMini } from './SafeCrackMini';
import { VimanaTetris } from './VimanaTetris';
import { Button } from './ui/button';

interface MiniGamesPanelProps {
  petName?: string;
}

const MEMORY_HINT = 'Solve memory puzzles to raise temperament.';
const RHYTHM_HINT = 'Sync to cosmic beats for energy surges.';
const VIMANA_HINT = 'Navigate the Vimana grid to channel focus.';

export function MiniGamesPanel({ petName }: MiniGamesPanelProps) {
  const miniGames = useStore(state => state.miniGames);
  const vitals = useStore(state => state.vitals);
  const updateScore = useStore(state => state.updateMiniGameScore);
  const recordVimanaRun = useStore(state => state.recordVimanaRun);
  const recordReward = useStore(state => state.recordReward);
  const genome = useStore(state => state.genome);

  const genomeSeed = useMemo(() => {
    if (!genome) return undefined;
    const slices = [
      ...genome.red60.slice(0, 12),
      ...genome.blue60.slice(0, 12),
      ...genome.black60.slice(0, 12),
    ];
    return slices.reduce((total, value, index) => total + value * (index + 5), 0);
  }, [genome]);

  const [memoryLog, setMemoryLog] = useState<string>(MEMORY_HINT);
  const [rhythmLog, setRhythmLog] = useState<string>(RHYTHM_HINT);
  const [vimanaLog, setVimanaLog] = useState<string>(VIMANA_HINT);
  const [vimanaOpen, setVimanaOpen] = useState<boolean>(false);
  const [safeCrackLog, setSafeCrackLog] = useState<string>('Crack the vault to earn rewards.');
  const [safeCrackOpen, setSafeCrackOpen] = useState<boolean>(false);
  const [safeCrackHighScore, setSafeCrackHighScore] = useState<number>(0);
  const [safeCrackAttempts, setSafeCrackAttempts] = useState<number>(0);

  const playMemory = () => {
    const base = Math.round((vitals.mood + vitals.energy) / 20);
    const noise = Math.floor(Math.random() * 4);
    const score = base + noise;
    const isNewBest = score > miniGames.memoryHighScore;
    updateScore('memory', score);
    const best = Math.max(score, miniGames.memoryHighScore);
    setMemoryLog(`Pattern recall score: ${score}. High score: ${best}.`);
    recordReward({
      source: 'minigame',
      title: 'Memory Session Complete',
      description: `Pattern recall score: ${score}.`,
      reward: {
        type: 'score',
        value: score,
      },
    });
    if (isNewBest) {
      recordReward({
        source: 'minigame',
        title: 'New Memory High Score',
        description: `New best score: ${score}.`,
        reward: {
          type: 'score',
          value: score,
        },
      });
    }
  };

  const playRhythm = () => {
    const base = Math.round((vitals.energy + vitals.hygiene) / 18);
    const noise = Math.floor(Math.random() * 5);
    const score = base + noise;
    const isNewBest = score > miniGames.rhythmHighScore;
    updateScore('rhythm', score);
    const best = Math.max(score, miniGames.rhythmHighScore);
    setRhythmLog(`Rhythm alignment score: ${score}. High score: ${best}.`);
    recordReward({
      source: 'minigame',
      title: 'Rhythm Session Complete',
      description: `Rhythm alignment score: ${score}.`,
      reward: {
        type: 'score',
        value: score,
      },
    });
    if (isNewBest) {
      recordReward({
        source: 'minigame',
        title: 'New Rhythm High Score',
        description: `New best score: ${score}.`,
        reward: {
          type: 'score',
          value: score,
        },
      });
    }
  };

  const handleLaunchVimana = () => {
    setVimanaOpen(true);
    setVimanaLog('Vimana grid engaged. Maintain focus to stabilize the run.');
  };

  const handleCloseVimana = () => {
    setVimanaOpen(false);
    setVimanaLog(VIMANA_HINT);
  };

  const handleVimanaGameOver = (score: number, lines: number, level: number) => {
    const isNewBest = score > miniGames.vimanaHighScore;
    recordVimanaRun(score, lines, level);
    setVimanaLog(`Run collapsed at level ${level}. Score ${score} with ${lines} lines cleared.`);
    recordReward({
      source: 'minigame',
      title: 'Vimana Run Complete',
      description: `Level ${level}, Score ${score}, Lines ${lines}.`,
      reward: {
        type: 'score',
        value: { score, lines, level },
      },
    });
    if (isNewBest) {
      recordReward({
        source: 'minigame',
        title: 'New Vimana High Score',
        description: `New best Vimana score: ${score}.`,
        reward: {
          type: 'score',
          value: score,
        },
      });
    }
  };

  const handleLaunchSafeCrack = () => {
    setSafeCrackOpen(true);
    setSafeCrackLog('Safe lock engaged. Match the combo to unlock.');
  };

  const handleCloseSafeCrack = () => {
    setSafeCrackOpen(false);
    setSafeCrackLog('Crack the vault to earn rewards.');
  };

  const handleSafeCrackGameOver = (success: boolean, score: number, attempts: number) => {
    const isNewBest = success && score > safeCrackHighScore;
    setSafeCrackAttempts(prev => prev + 1);
    if (success) {
      const multiplier = score.toFixed(2);
      setSafeCrackHighScore(prev => Math.max(prev, score));
      setSafeCrackLog(`Vault cracked! Multiplier: ${multiplier}x. Attempts: ${safeCrackAttempts + 1}.`);
      recordReward({
        source: 'minigame',
        title: 'Safe Crack Success',
        description: `Multiplier ${multiplier}x after ${attempts} attempts.`,
        reward: {
          type: 'score',
          value: score,
        },
      });
      if (isNewBest) {
        recordReward({
          source: 'minigame',
          title: 'New Safe Crack High Score',
          description: `New best multiplier: ${multiplier}x.`,
          reward: {
            type: 'score',
            value: score,
          },
        });
      }
    } else {
      setSafeCrackLog(`Lock jammed after ${attempts} strikes. Try again with steadier hands.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-emerald-300" />
          Conscious Mini-Games
        </h2>
        <div className="text-xs text-zinc-400">
          Focus streak: <span className="font-semibold text-emerald-300">{miniGames.focusStreak}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <BrainCircuit className="w-4 h-4 text-emerald-300" />
            Memory Sequence
          </div>
          <p className="text-xs text-zinc-400">Higher mood and energy produce better recall performance.</p>
          <Button onClick={playMemory} className="gap-2">
            <BrainCircuit className="w-4 h-4" />
            Attempt Memory Shuffle
          </Button>
          <p className="text-xs text-zinc-400 italic">{memoryLog}</p>
          <p className="text-xs text-zinc-500">
            Best score: <span className="text-emerald-300 font-semibold">{miniGames.memoryHighScore}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Music4 className="w-4 h-4 text-pink-300" />
            Rhythm Weave
          </div>
          <p className="text-xs text-zinc-400">Energy and cleanliness align to keep tempo steady.</p>
          <Button onClick={playRhythm} className="gap-2">
            <Music4 className="w-4 h-4" />
            Play Rhythm Pulse
          </Button>
          <p className="text-xs text-zinc-400 italic">{rhythmLog}</p>
          <p className="text-xs text-zinc-500">
            Best score: <span className="text-pink-300 font-semibold">{miniGames.rhythmHighScore}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Rocket className="w-4 h-4 text-cyan-300" />
            Vimana Tetris Field
          </div>
          <p className="text-xs text-zinc-400">
            Clear lines to stabilize the craft. Hard drops accelerate anomaly resolution.
          </p>
          <Button onClick={handleLaunchVimana} className="gap-2">
            <Rocket className="w-4 h-4" />
            Launch Simulation
          </Button>
          <p className="text-xs text-zinc-400 italic">{vimanaLog}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              High Score
              <div className="text-emerald-300 font-semibold">{miniGames.vimanaHighScore}</div>
            </div>
            <div>
              Max Lines
              <div className="text-cyan-300 font-semibold">{miniGames.vimanaMaxLines}</div>
            </div>
            <div>
              Max Level
              <div className="text-purple-300 font-semibold">{miniGames.vimanaMaxLevel}</div>
            </div>
            <div>
              Last Run
              <div className="text-amber-200 font-semibold">
                {miniGames.vimanaLastScore} / {miniGames.vimanaLastLines}L • Lv {miniGames.vimanaLastLevel}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Lock className="w-4 h-4 text-amber-300" />
            Safe Crack Challenge
          </div>
          <p className="text-xs text-zinc-400">
            Match the 3-number combo by rotating the dial. Precision and patience unlock rewards.
          </p>
          <Button onClick={handleLaunchSafeCrack} className="gap-2">
            <Lock className="w-4 h-4" />
            Attempt Crack
          </Button>
          <p className="text-xs text-zinc-400 italic">{safeCrackLog}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              High Score
              <div className="text-amber-300 font-semibold">{safeCrackHighScore.toFixed(2)}x</div>
            </div>
            <div>
              Attempts
              <div className="text-slate-300 font-semibold">{safeCrackAttempts}</div>
            </div>
          </div>
        </div>
      </div>

      {vimanaOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-2 sm:p-4 sm:items-center sm:justify-center">
          <div className="flex justify-end py-2 sm:w-full sm:max-w-3xl shrink-0">
            <Button size="sm" variant="outline" onClick={handleCloseVimana} className="touch-manipulation">
              Close
            </Button>
          </div>
          <div className="flex-1 min-h-0 w-full sm:max-w-3xl">
            <VimanaTetris
              petName={petName}
              genomeSeed={genomeSeed}
              onExit={handleCloseVimana}
              onGameOver={handleVimanaGameOver}
            />
          </div>
        </div>
      )}

      {safeCrackOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-2 sm:p-4 sm:items-center sm:justify-center">
          <div className="flex justify-end py-2 sm:w-full sm:max-w-3xl shrink-0">
            <Button size="sm" variant="outline" onClick={handleCloseSafeCrack} className="touch-manipulation">
              Close
            </Button>
          </div>
          <div className="flex-1 min-h-0 w-full sm:max-w-3xl">
            <SafeCrackMini
              petName={petName}
              genomeSeed={genomeSeed}
              onExit={handleCloseSafeCrack}
              onGameOver={handleSafeCrackGameOver}
            />
          </div>
        </div>
      )}
    </div>
  );
}
