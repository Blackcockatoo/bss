'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Button } from './ui/button';
import { Swords, ShieldHalf, ChevronLeft, Zap } from 'lucide-react';
import {
  OPPONENTS,
  OPPONENT_LORE,
  OPPONENT_TYPES,
  TYPE_COLORS,
  derivePlayerType,
  derivePlayerStats,
  getOpponentStats,
  getPlayerMoves,
  getOpponentMoveset,
  executeTurn,
  getArenaChapter,
  type BattleMove,
  type ConsciousnessType,
  type StatusCondition,
} from '@/lib/battle';

type Phase = 'idle' | 'opponentSelect' | 'battling' | 'result';

const STATUS_COLORS: Record<StatusCondition, string> = {
  Phased:       'text-indigo-300 bg-indigo-900/50',
  Crystallized: 'text-violet-300 bg-violet-900/50',
  Resonant:     'text-emerald-300 bg-emerald-900/50',
  Voided:       'text-gray-300 bg-gray-900/50',
};

function TypeBadge({ type }: { type: ConsciousnessType }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: TYPE_COLORS[type] + '33', color: TYPE_COLORS[type], border: `1px solid ${TYPE_COLORS[type]}66` }}
    >
      {type}
    </span>
  );
}

function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  const barColor = pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-300 w-16 text-right shrink-0">
        {Math.max(0, hp)}/{maxHp}
      </span>
    </div>
  );
}

export function BattleArena() {
  const battle  = useStore(s => s.battle);
  const vitals  = useStore(s => s.vitals);
  const recordBattle = useStore(s => s.recordBattle);

  const [phase, setPhase]           = useState<Phase>('idle');
  const [opponent, setOpponent]     = useState('');
  const [playerHp, setPlayerHp]     = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [opponentHp, setOpponentHp] = useState(0);
  const [opponentMaxHp, setOpponentMaxHp] = useState(0);
  const [playerStatus, setPlayerStatus]   = useState<StatusCondition | null>(null);
  const [opponentStatus, setOpponentStatus] = useState<StatusCondition | null>(null);
  const [playerMoves, setPlayerMoves]   = useState<BattleMove[]>([]);
  const [opponentMoves, setOpponentMoves] = useState<BattleMove[]>([]);
  const [playerType, setPlayerType] = useState<ConsciousnessType>('Echo');
  const [opponentType, setOpponentType] = useState<ConsciousnessType>('Echo');
  const [playerAtk, setPlayerAtk]   = useState(10);
  const [playerDef, setPlayerDef]   = useState(10);
  const [playerSpd, setPlayerSpd]   = useState(10);
  const [opponentAtk, setOpponentAtk] = useState(10);
  const [opponentDef, setOpponentDef] = useState(10);
  const [opponentSpd, setOpponentSpd] = useState(10);
  const [battleLog, setBattleLog]   = useState<string[]>([]);
  const [resultMsg, setResultMsg]   = useState('');
  const [resolving, setResolving]   = useState(false);
  const chapter = getArenaChapter(battle.wins);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  function startBattle(opponentName: string) {
    const pType = derivePlayerType(battle.energyShield);
    const pStats = derivePlayerStats(vitals, battle.energyShield, battle.streak);
    const oStats = getOpponentStats(opponentName, battle.wins);

    setOpponent(opponentName);
    setPlayerType(pType);
    setOpponentType(oStats.type);
    setPlayerHp(pStats.maxHp);
    setPlayerMaxHp(pStats.maxHp);
    setOpponentHp(oStats.maxHp);
    setOpponentMaxHp(oStats.maxHp);
    setPlayerAtk(pStats.attack);
    setPlayerDef(pStats.defense);
    setPlayerSpd(pStats.speed);
    setOpponentAtk(oStats.attack);
    setOpponentDef(oStats.defense);
    setOpponentSpd(oStats.speed);
    setPlayerStatus(null);
    setOpponentStatus(null);
    setPlayerMoves(getPlayerMoves(pType));
    setOpponentMoves(getOpponentMoveset(opponentName));
    const lore = OPPONENT_LORE[opponentName];
    setBattleLog([
      `${chapter}`,
      lore ? `${lore.title}: ${lore.legend}` : `A wild ${opponentName} appeared!`,
      `Go, Your Pet! [${pType}]`,
    ]);
    setPhase('battling');
  }

  const handleMoveSelect = useCallback((moveIndex: number) => {
    if (resolving) return;

    const chosenMove = playerMoves[moveIndex];
    if (chosenMove.pp <= 0) return;

    // Decrement player PP
    const updatedMoves = playerMoves.map((m, i) =>
      i === moveIndex ? { ...m, pp: m.pp - 1 } : m,
    );
    setPlayerMoves(updatedMoves);

    // Opponent picks a random move with PP > 0
    const availableOpp = opponentMoves.filter(m => m.pp > 0);
    const oppMove = availableOpp.length > 0
      ? availableOpp[Math.floor(Math.random() * availableOpp.length)]
      : opponentMoves[0]; // fallback (struggle)

    // Decrement opponent PP
    setOpponentMoves(prev =>
      prev.map(m => m.name === oppMove.name ? { ...m, pp: Math.max(0, m.pp - 1) } : m),
    );

    setResolving(true);

    const outcome = executeTurn({
      playerName: 'Your Pet',
      playerHp,
      playerAtk,
      playerDef,
      playerSpd,
      playerType,
      playerStatus,
      playerMove: chosenMove,
      opponentName: opponent,
      opponentHp,
      opponentAtk,
      opponentDef,
      opponentSpd,
      opponentType,
      opponentStatus,
      opponentMove: oppMove,
    });

    setBattleLog(prev => [...prev, '─────────', ...outcome.messages]);
    setPlayerHp(outcome.playerHpAfter);
    setOpponentHp(outcome.opponentHpAfter);
    setPlayerStatus(outcome.playerStatusAfter);
    setOpponentStatus(outcome.opponentStatusAfter);

    if (outcome.battleOver && outcome.winner) {
      const won = outcome.winner === 'player';
      recordBattle(won ? 'win' : 'loss', opponent);
      setResultMsg(won
        ? `Victory! ${opponent} yielded to your resonance!`
        : `Defeated! ${opponent} was too strong — rest and return.`);
      setPhase('result');
    }

    setResolving(false);
  }, [resolving, playerMoves, opponentMoves, playerHp, playerAtk, playerDef, playerSpd, playerType, playerStatus, opponent, opponentHp, opponentAtk, opponentDef, opponentSpd, opponentType, opponentStatus, recordBattle]);

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const pType = derivePlayerType(battle.energyShield);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-pink-300" />
              Consciousness Arena
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Turn-based duels — type match-ups, moves and status conditions.</p>
            <p className="text-[11px] text-indigo-300/80 mt-1">{chapter}</p>
          </div>
          <div className="text-xs text-zinc-400 text-right space-y-0.5">
            <p>W <span className="text-emerald-300 font-semibold">{battle.wins}</span> / L <span className="text-rose-300 font-semibold">{battle.losses}</span></p>
            <p>Streak <span className="text-amber-300 font-semibold">{battle.streak}</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldHalf className="w-5 h-5 text-cyan-300 shrink-0" />
            <div>
              <p className="text-sm text-zinc-300">
                Energy Shield: <strong className="text-cyan-200">{Math.round(battle.energyShield)}%</strong>
              </p>
              <p className="text-xs text-zinc-500">Your type this battle: <TypeBadge type={pType} /></p>
            </div>
          </div>
          <Button onClick={() => setPhase('opponentSelect')} className="w-full gap-2">
            <Swords className="w-4 h-4" />
            Enter Arena
          </Button>
        </div>
      </div>
    );
  }

  // ── Opponent Select ───────────────────────────────────────────────────────
  if (phase === 'opponentSelect') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('idle')} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-white">Choose Your Opponent</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OPPONENTS.map(name => {
            const t = OPPONENT_TYPES[name] ?? 'Echo';
            const lore = OPPONENT_LORE[name];
            return (
              <button
                key={name}
                onClick={() => startBattle(name)}
                className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-left hover:border-slate-500 hover:bg-slate-800/60 transition-all"
              >
                <p className="text-sm font-semibold text-white mb-1">{name}</p>
                <TypeBadge type={t} />
                {lore && (
                  <p className="text-[10px] text-zinc-400 mt-2 leading-snug">
                    <span className="text-zinc-300">{lore.title}:</span> {lore.legend}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Battle ────────────────────────────────────────────────────────────────
  if (phase === 'battling') {
    return (
      <div className="space-y-3">
        {/* Opponent row */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{opponent}</span>
              <TypeBadge type={opponentType} />
            </div>
            {opponentStatus && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[opponentStatus]}`}>
                {opponentStatus}
              </span>
            )}
          </div>
          <HpBar hp={opponentHp} maxHp={opponentMaxHp} color="#f87171" />
        </div>

        {/* Player row */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Your Pet</span>
              <TypeBadge type={playerType} />
            </div>
            {playerStatus && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[playerStatus]}`}>
                {playerStatus}
              </span>
            )}
          </div>
          <HpBar hp={playerHp} maxHp={playerMaxHp} color="#34d399" />
        </div>

        {/* Battle log */}
        <div
          ref={logRef}
          className="rounded-xl border border-slate-800 bg-zinc-950/80 p-3 h-28 overflow-y-auto space-y-0.5 font-mono"
        >
          {battleLog.map((line, i) => (
            <p key={i} className={`text-xs ${line === '─────────' ? 'text-zinc-700' : 'text-zinc-300'}`}>
              {line === '─────────' ? line : `> ${line}`}
            </p>
          ))}
        </div>

        {/* Move buttons */}
        <div className="grid grid-cols-2 gap-2">
          {playerMoves.map((move, i) => (
            <button
              key={i}
              onClick={() => handleMoveSelect(i)}
              disabled={resolving || move.pp <= 0}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-2.5 text-left hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{move.name}</span>
                <Zap className="w-3 h-3 shrink-0" style={{ color: TYPE_COLORS[move.type] }} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ backgroundColor: TYPE_COLORS[move.type] + '22', color: TYPE_COLORS[move.type] }}
                >
                  {move.type}
                </span>
                <span className="text-[10px] text-zinc-400">{move.power}pw</span>
                <span className="text-[10px] text-zinc-500 ml-auto">PP {move.pp}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setPhase('idle')}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-full text-center"
        >
          Forfeit
        </button>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-center py-4">
      <div className={`text-2xl font-bold ${resultMsg.startsWith('Victory') ? 'text-emerald-300' : 'text-rose-300'}`}>
        {resultMsg.startsWith('Victory') ? '🏆 Victory!' : '💀 Defeated'}
      </div>
      <p className="text-sm text-zinc-400">{resultMsg}</p>
      <div className="flex justify-center gap-3 pt-2">
        <Button onClick={() => startBattle(opponent)} variant="outline" className="gap-2">
          <Swords className="w-4 h-4" />
          Rematch
        </Button>
        <Button onClick={() => setPhase('opponentSelect')} className="gap-2">
          New Opponent
        </Button>
      </div>
      <button
        onClick={() => setPhase('idle')}
        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors block mx-auto"
      >
        Back to Arena
      </button>
    </div>
  );
}
