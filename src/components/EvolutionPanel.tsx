"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildEvolutionContext, useStore } from "@/lib/store";
import {
  getEvolutionProgress,
  getTimeUntilNextEvolution,
  getNextEvolutionRequirement,
  getRequirementProgress,
  getEvolutionBranch,
  getStageVisuals,
  getStageDisplayTitle,
  getUnlockedAbilities,
  describeEvolutionUpgrade,
  EVOLUTION_ORDER,
  EVOLUTION_STAGE_INFO,
  type EvolutionState,
} from "@/lib/evolution";
import {
  Zap,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getCumulativeEvolutionUpgrade } from "@/evolution/stageUpgrades";

import { EvolutionCeremony } from "./EvolutionCeremony";
import { StageSigil } from "./evolution/StageSigil";
import { Button } from "./ui/button";

export function EvolutionPanel() {
  const evolution = useStore((state) => state.evolution);
  const vitals = useStore((state) => state.vitals);
  const tryEvolve = useStore((state) => state.tryEvolve);
  const traits = useStore((state) => state.traits);
  const battle = useStore((state) => state.battle);
  const miniGames = useStore((state) => state.miniGames);
  const essence = useStore((state) => state.essence);
  const [ceremonyStage, setCeremonyStage] = useState<EvolutionState | null>(
    null,
  );
  const prefersReducedMotion = useReducedMotion();

  const evolutionContext = useMemo(
    () => buildEvolutionContext({ traits, battle, miniGames, essence }),
    [traits, battle, miniGames, essence],
  );

  const branch = useMemo(() => getEvolutionBranch(traits), [traits]);
  const unlockedAbilities = useMemo(
    () => getUnlockedAbilities(traits, evolution.state),
    [traits, evolution.state],
  );
  const totalAbilities = traits?.latent.rareAbilities.length ?? 0;

  const vitalsAverage = useMemo(
    () => (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4,
    [vitals.energy, vitals.hunger, vitals.hygiene, vitals.mood],
  );

  const stageIndex = useMemo(
    () => EVOLUTION_ORDER.indexOf(evolution.state),
    [evolution.state],
  );

  const visuals = getStageVisuals(evolution.state, branch);
  const stageInfo = EVOLUTION_STAGE_INFO[evolution.state];
  // Header keeps the raw stage code until the apex, where the branch's
  // apex form takes over.
  const stageDisplayTitle = getStageDisplayTitle(
    evolution.state,
    branch,
    evolution.state,
  );

  const progress = useMemo(
    () => getEvolutionProgress(evolution, vitalsAverage),
    [evolution, vitalsAverage],
  );

  const timeRemaining = useMemo(
    () => getTimeUntilNextEvolution(evolution),
    [evolution],
  );

  const requirementSnapshot = useMemo(
    () => getNextEvolutionRequirement(evolution),
    [evolution],
  );

  const requirementProgress = useMemo(
    () =>
      requirementSnapshot
        ? getRequirementProgress(
            evolution,
            vitalsAverage,
            requirementSnapshot,
            evolutionContext,
          )
        : null,
    [evolution, vitalsAverage, requirementSnapshot, evolutionContext],
  );

  const nextStageInfo = requirementSnapshot
    ? EVOLUTION_STAGE_INFO[requirementSnapshot.state]
    : null;

  const formatDuration = useCallback((milliseconds: number) => {
    if (milliseconds < 0) return "Max level";
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }

    return `${hours}h ${minutes}m`;
  }, []);

  const [ageElapsed, setAgeElapsed] = useState(
    () => Date.now() - evolution.lastEvolutionTime,
  );
  const [totalAge, setTotalAge] = useState(
    () => Date.now() - evolution.birthTime,
  );
  useEffect(() => {
    const update = () => {
      setAgeElapsed(Date.now() - evolution.lastEvolutionTime);
      setTotalAge(Date.now() - evolution.birthTime);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [evolution.lastEvolutionTime, evolution.birthTime]);

  const handleEvolve = useCallback(() => {
    const targetStage = requirementSnapshot?.state ?? evolution.state;
    const evolved = tryEvolve();
    if (evolved) {
      console.info("[evolution] advanced to", targetStage);
      setCeremonyStage(targetStage);
    }
  }, [evolution.state, requirementSnapshot, tryEvolve]);

  const experiencePercent = Math.round(evolution.experience);
  const nextStageLabel =
    stageIndex >= 0
      ? `Evolution Stage ${stageIndex + 1}/${EVOLUTION_ORDER.length}`
      : "Evolution";
  const accent = visuals.colors[1] ?? visuals.colors[0];
  const tertiary =
    visuals.colors[visuals.colors.length - 1] ?? visuals.colors[0];

  return (
    <div className="space-y-4">
      {ceremonyStage && (
        <EvolutionCeremony
          stage={ceremonyStage}
          reduceMotion={prefersReducedMotion}
          onComplete={() => setCeremonyStage(null)}
          accentColors={
            getStageVisuals(ceremonyStage, branch).colors as [
              string,
              string,
              string,
            ]
          }
          displayTitle={getStageDisplayTitle(
            ceremonyStage,
            branch,
            EVOLUTION_STAGE_INFO[ceremonyStage].title,
          )}
        />
      )}
      <header className="text-center space-y-2">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2"
          style={{
            borderColor: visuals.colors[0],
            backgroundColor: `${visuals.colors[0]}20`,
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: visuals.colors[0] }} />
          <span className="font-bold text-white text-lg">
            {stageDisplayTitle}
          </span>
        </div>
        <p className="text-zinc-400 text-sm">{nextStageLabel}</p>
        <p className="text-zinc-300 text-xs">{stageInfo.tagline}</p>
        {traits && (
          <p className="text-xs" style={{ color: branch.accentColors[0] }}>
            {branch.label} path — {branch.motto}
          </p>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <TrendingUp className="w-4 h-4" />
            <span>Experience</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${experiencePercent}%`,
                  backgroundColor: visuals.colors[0],
                }}
              />
            </div>
            <span className="text-white font-medium">{experiencePercent}%</span>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Zap className="w-4 h-4" />
            <span>Interactions</span>
          </div>
          <div className="text-white font-medium text-lg">
            {evolution.totalInteractions}
          </div>
        </div>
      </section>

      {requirementSnapshot !== null && (
        <section className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Next evolution</span>
            <span className="text-white font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${visuals.colors[0]}, ${accent})`,
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Time remaining: {formatDuration(timeRemaining)}</span>
          </div>
        </section>
      )}

      {requirementSnapshot && requirementProgress && (
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Next Stage: {requirementSnapshot.state}</span>
            <span>{EVOLUTION_STAGE_INFO[requirementSnapshot.state].title}</span>
          </div>
          <div className="space-y-3 text-xs">
            <RequirementBar
              label="Age"
              value={requirementProgress.ageProgress}
              helper={formatRequirementValue(
                ageElapsed,
                requirementSnapshot.requirements.minAge,
                "time",
                formatDuration,
              )}
              color={visuals.colors[0]}
            />
            <RequirementBar
              label="Interactions"
              value={requirementProgress.interactionsProgress}
              helper={formatRequirementValue(
                evolution.totalInteractions,
                requirementSnapshot.requirements.minInteractions,
                "number",
              )}
              color={accent}
            />
            <RequirementBar
              label="Vitals avg"
              value={requirementProgress.vitalsProgress}
              helper={formatRequirementValue(
                vitalsAverage,
                requirementSnapshot.requirements.minVitalsAverage,
                "number",
              )}
              color={tertiary}
            />
            {requirementProgress.specialDescription && (
              <div className="flex items-start gap-2 text-xs">
                {requirementProgress.specialMet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                )}
                <span className="text-zinc-400">
                  {requirementProgress.specialDescription}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* What evolving actually did to the creature on screen, and what the
          next stage will do — the visible payoff, not just stage lore. */}
      <section className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-3 text-xs text-zinc-300">
        <p className="font-semibold text-white text-sm">Body Upgrades</p>
        {/* The sigil is the one upgrade you can point at, so draw it rather
            than only naming it. Same geometry the body wears — this is the
            mark etched on the creature, at legible size. */}
        <div className="flex items-start gap-4">
          <StageMark
            state={evolution.state}
            color={visuals.colors[0]}
            accentColor={accent}
          />
          <ul className="flex-1 space-y-1">
            {describeEvolutionUpgrade(evolution.state).map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2
                  className="w-3 h-3 shrink-0 mt-0.5"
                  style={{ color: visuals.colors[0] }}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        {requirementSnapshot && (
          <div className="pt-2 border-t border-zinc-800 space-y-1">
            <p className="text-zinc-500">
              Reaching {requirementSnapshot.state} adds:
            </p>
            <div className="flex items-start gap-4">
              <StageMark
                state={requirementSnapshot.state}
                color="#71717a"
                accentColor="#a1a1aa"
                dimmed
              />
              <ul className="flex-1 space-y-1 text-zinc-400">
                {describeEvolutionUpgrade(requirementSnapshot.state).map(
                  (line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-zinc-600" />
                      <span>{line}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-3 text-xs text-zinc-300">
        <p className="font-semibold text-white text-sm">Stage Focus</p>
        <ul className="list-disc list-inside space-y-1">
          {stageInfo.focus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {totalAbilities > 0 && (
        <section className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-3 text-xs text-zinc-300">
          <p className="font-semibold text-white text-sm">Rare Abilities</p>
          {unlockedAbilities.length > 0 ? (
            <ul className="space-y-1">
              {unlockedAbilities.map((ability) => (
                <li key={ability} className="flex items-center gap-2">
                  <Sparkles
                    className="w-3 h-3"
                    style={{ color: branch.accentColors[0] }}
                  />
                  <span>{ability}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">
              Latent abilities sleep in the genome, waiting for evolution.
            </p>
          )}
          {unlockedAbilities.length < totalAbilities && (
            <p className="text-zinc-500">
              {totalAbilities - unlockedAbilities.length} more awaken as your
              companion evolves.
            </p>
          )}
        </section>
      )}

      {evolution.canEvolve && requirementSnapshot !== null && (
        <section className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-100 text-xs rounded-lg px-3 py-2">
            {nextStageInfo ? nextStageInfo.celebration : stageInfo.celebration}
          </div>
          <Button
            onClick={handleEvolve}
            className="w-full gap-2 font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${visuals.colors[0]}, ${accent})`,
              boxShadow: `0 0 20px ${visuals.colors[0]}50`,
            }}
          >
            <Sparkles className="w-5 h-5" />
            Evolve Now!
          </Button>
        </section>
      )}

      <footer className="text-center text-xs text-zinc-500 space-y-1">
        <p>Age: {formatDuration(totalAge)}</p>
        <p className="text-zinc-700">
          {evolution.state === "GENETICS" &&
            "Genetics — where traits are first expressed, just like embryonic development."}
          {evolution.state === "NEURO" &&
            "Neuro — personality emerges as neural pathways form through interaction."}
          {evolution.state === "QUANTUM" &&
            "Quantum — latent potential activates, mirroring quantum biology in nature."}
          {evolution.state === "SPECIATION" &&
            "Speciation — fully differentiated. Ready to pass traits to the next generation."}
        </p>
      </footer>
    </div>
  );
}

const MARK_NAMES: Record<string, string> = {
  helix: "Genome helix",
  lattice: "Synapse lattice",
  phase: "Phase rings",
  crown: "Crown of rays",
};

interface StageMarkProps {
  state: EvolutionState;
  color: string;
  accentColor: string;
  /** A stage not yet reached, drawn as a muted preview. */
  dimmed?: boolean;
}

/**
 * The stage's surface sigil at readable size. Uses the same `StageSigil`
 * painter as the body renderers, so what the panel shows is exactly the mark
 * the creature is wearing.
 */
function StageMark({
  state,
  color,
  accentColor,
  dimmed = false,
}: StageMarkProps) {
  const upgrade = getCumulativeEvolutionUpgrade(state);
  const label = MARK_NAMES[upgrade.mark] ?? upgrade.mark;

  return (
    <figure className="shrink-0 space-y-1 text-center">
      <svg
        viewBox="0 0 84 84"
        className="h-20 w-20 rounded-lg border border-zinc-800 bg-zinc-950/70"
        role="img"
        aria-label={`${label} — the mark etched on the body at ${state}`}
      >
        <StageSigil
          shape={upgrade.mark}
          count={upgrade.markCount}
          cx={42}
          cy={42}
          rx={28}
          ry={26}
          color={color}
          accentColor={accentColor}
          underlayColor="#09090b"
          width={1.8}
          opacity={dimmed ? 0.5 : Math.min(0.95, upgrade.markIntensity + 0.2)}
        />
      </svg>
      <figcaption className="text-[10px] text-zinc-500">{label}</figcaption>
    </figure>
  );
}

interface RequirementBarProps {
  label: string;
  value: number;
  helper: string;
  color: string;
}

function RequirementBar({ label, value, helper, color }: RequirementBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const width = Math.round(clampedValue * 100);
  const isMet = clampedValue >= 0.999;
  const helperText =
    isMet && helper !== "Met" && helper !== "Ready"
      ? `Met • ${helper}`
      : helper;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-zinc-400">
        <span>{label}</span>
        <span
          className={`text-zinc-300 font-medium ${isMet ? "text-emerald-200" : ""}`}
        >
          {isMet && helper === "Met" ? "Met" : helperText}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

type RequirementMode = "time" | "number";

function formatRequirementValue(
  current: number,
  required: number,
  mode: RequirementMode,
  formatDuration?: (value: number) => string,
): string {
  if (required <= 0) {
    return "Ready";
  }

  if (mode === "time") {
    const remaining = Math.max(0, required - current);
    if (remaining === 0) {
      return "Met";
    }
    if (formatDuration) {
      return `${formatDuration(remaining)} left`;
    }
    return `${Math.round(remaining / (1000 * 60))}m left`;
  }

  return `${Math.round(current)}/${required}`;
}
