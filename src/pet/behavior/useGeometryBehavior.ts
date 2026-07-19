"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { DerivedTraits } from "@/lib/genome";
import type { HeptaProfileV2 } from "@/lib/heptaProfile";
import { hashSeed } from "@/pet/movement/movementScheduler";

import {
  decideGeometryBehavior,
  deriveGeometryBehaviorSpec,
  greetingDecision,
  nextGeometryBehaviorDelayMs,
  type GeometryMovement,
} from "./geometryBehavior";

interface UseGeometryBehaviorOptions {
  identityKey: string;
  profile: HeptaProfileV2;
  personality: DerivedTraits["personality"];
  critical?: boolean;
  sleeping?: boolean;
  reduceMotion?: boolean;
  lastAction?: string | null;
  lastActionAt?: number;
  paused?: boolean;
}

const ACTION_MOVEMENT: Record<string, GeometryMovement> = {
  feed: "lotus",
  clean: "shuffle",
  play: "dance",
  sleep: "lotus",
  love: "wave",
};

export function useGeometryBehavior({
  identityKey,
  profile,
  personality,
  critical = false,
  sleeping = false,
  reduceMotion = false,
  lastAction = null,
  lastActionAt = 0,
  paused = false,
}: UseGeometryBehaviorOptions): {
  movement: GeometryMovement;
  intent: string;
  temperament: string;
} {
  const seed = useMemo(() => hashSeed(identityKey), [identityKey]);
  const spec = useMemo(
    () => deriveGeometryBehaviorSpec(profile, personality),
    [personality, profile],
  );
  const [movement, setMovement] = useState<GeometryMovement>("idle");
  const [intent, setIntent] = useState("Listening through the lattice");
  const counterRef = useRef(0);
  const previousRef = useRef<GeometryMovement>("idle");
  const actionUntilRef = useRef(0);
  const lastActionAtRef = useRef(0);

  useEffect(() => {
    if (paused) return;
    if (
      !lastAction ||
      !lastActionAt ||
      lastActionAt === lastActionAtRef.current
    ) {
      return;
    }
    lastActionAtRef.current = lastActionAt;
    if (reduceMotion) return;
    const next =
      critical || sleeping ? "lotus" : (ACTION_MOVEMENT[lastAction] ?? "wave");
    const responseDuration = Math.round(
      2_800 + spec.touchResponse * 900 + spec.reactionStrength * 900,
    );
    actionUntilRef.current = Date.now() + responseDuration;
    previousRef.current = next;
    const respond = window.setTimeout(() => {
      setMovement(next);
      setIntent(`Responding to ${lastAction}`);
    }, 0);
    const settle = window.setTimeout(() => {
      setMovement("idle");
      setIntent("Settling after your care");
    }, responseDuration);
    return () => {
      window.clearTimeout(respond);
      window.clearTimeout(settle);
    };
  }, [
    critical,
    lastAction,
    lastActionAt,
    paused,
    reduceMotion,
    sleeping,
    spec.reactionStrength,
    spec.touchResponse,
  ]);

  useEffect(() => {
    if (paused || reduceMotion || critical || sleeping) return;

    let nextTimer = 0;
    let settleTimer = 0;
    let cancelled = false;

    const schedule = (delay?: number) => {
      if (cancelled) return;
      const wait =
        delay ?? nextGeometryBehaviorDelayMs(spec, seed, counterRef.current);
      nextTimer = window.setTimeout(() => {
        if (Date.now() < actionUntilRef.current) {
          schedule(1_000);
          return;
        }
        counterRef.current += 1;
        const decision = decideGeometryBehavior(
          spec,
          seed,
          counterRef.current,
          {
            critical,
            sleeping,
            reduceMotion,
            previousMovement: previousRef.current,
          },
        );
        previousRef.current = decision.movement;
        setMovement(decision.movement);
        setIntent(decision.intent);
        settleTimer = window.setTimeout(() => {
          setMovement("idle");
          setIntent("Listening through the lattice");
          const recoveryDelay = Math.round(700 * (1 - spec.recoverySpeed));
          schedule(
            nextGeometryBehaviorDelayMs(spec, seed, counterRef.current) +
              recoveryDelay,
          );
        }, decision.durationMs);
      }, wait);
    };

    const greeting = greetingDecision(spec, seed);
    if (greeting && !critical && !sleeping) {
      nextTimer = window.setTimeout(() => {
        previousRef.current = greeting.movement;
        setMovement(greeting.movement);
        setIntent(greeting.intent);
        settleTimer = window.setTimeout(() => {
          setMovement("idle");
          setIntent("Listening through the lattice");
          schedule();
        }, greeting.durationMs);
      }, 1_200);
    } else {
      schedule();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(nextTimer);
      window.clearTimeout(settleTimer);
    };
  }, [critical, paused, reduceMotion, seed, sleeping, spec]);

  const expressed = paused
    ? { movement: "idle" as const, intent: "Animation paused" }
    : reduceMotion
      ? { movement: "idle" as const, intent: "Resting with reduced motion" }
      : critical || sleeping
        ? {
            movement: "lotus" as const,
            intent: "Conserving energy in the bindu",
          }
        : { movement, intent };

  return { ...expressed, temperament: spec.temperament };
}
