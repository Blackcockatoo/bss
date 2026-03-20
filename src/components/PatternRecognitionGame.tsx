"use client";

import { triggerHaptic } from "@/lib/haptics";
import { generateMeditationPattern, validatePattern } from "@/lib/minigames";
import { useStore } from "@/lib/store";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Brain } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

const DIRECTION_ICONS = {
  0: ArrowUp,
  1: ArrowRight,
  2: ArrowDown,
  3: ArrowLeft,
};

const DIRECTION_COLORS = {
  0: "bg-blue-500",
  1: "bg-green-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
};

export function PatternRecognitionGame() {
  const genome = useStore((s) => s.genome);
  const vitals = useStore((s) => s.vitals);
  const updateMiniGameScore = useStore((s) => s.updateMiniGameScore);

  const [gameState, setGameState] = useState<
    "ready" | "showing" | "input" | "result"
  >("ready");
  const [pattern, setPattern] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficulty, setDifficulty] = useState(4);
  const [result, setResult] = useState<{
    correct: boolean;
    accuracy: number;
  } | null>(null);
  const [combo, setCombo] = useState(0);
  const [showTime, setShowTime] = useState(800);

  const generateNewPattern = useCallback(() => {
    if (!genome) return;

    const genomeSeed = genome.red60
      .slice(0, 10)
      .reduce((sum, val) => sum + val, 0);
    const newPattern = generateMeditationPattern(
      genomeSeed + Date.now(),
      difficulty,
    );

    setPattern(newPattern);
    setUserInput([]);
    setCurrentIndex(0);
    setResult(null);
    setShowTime(800);
    setGameState("showing");
    triggerHaptic("light");
  }, [genome, difficulty]);

  useEffect(() => {
    if (gameState === "showing" && currentIndex < pattern.length) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        triggerHaptic("selection");
      }, showTime);
      return () => clearTimeout(timer);
    } else if (gameState === "showing" && currentIndex >= pattern.length) {
      setTimeout(() => {
        setGameState("input");
        setCurrentIndex(0);
      }, 500);
    }
  }, [gameState, currentIndex, pattern.length, showTime]);

  const handleDirectionInput = (direction: number) => {
    if (gameState !== "input") return;

    const newInput = [...userInput, direction];
    const isCorrect = pattern[userInput.length] === direction;

    // Haptic feedback based on correctness
    if (isCorrect) {
      triggerHaptic("light");
    } else {
      triggerHaptic("warning");
    }

    setUserInput(newInput);

    if (newInput.length === pattern.length) {
      const validation = validatePattern(pattern, newInput);
      setResult(validation);
      setGameState("result");

      if (validation.correct) {
        // Success!
        const newCombo = combo + 1;
        setCombo(newCombo);

        // Calculate score with calm, non-time-based bonuses.
        const baseScore = difficulty * 2;
        const moodBonus = Math.floor(vitals.mood / 10);

        const totalScore = baseScore + moodBonus;
        updateMiniGameScore("memory", totalScore);

        triggerHaptic("success");
      } else {
        // Failed
        setCombo(0);
        triggerHaptic("error");
      }
    }
  };

  const handleReset = () => {
    setGameState("ready");
    setPattern([]);
    setUserInput([]);
    setCurrentIndex(0);
    setResult(null);
  };

  if (!genome) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Generate a pet first to play</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          Pattern Recognition
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Watch the pattern, then repeat it from memory at a calm pace
        </p>
      </div>

      {/* Difficulty Selector */}
      {gameState === "ready" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm text-zinc-400 block">
              Difficulty Level
            </label>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5, 6, 7, 8].map((level) => (
                <Button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  variant={difficulty === level ? "default" : "outline"}
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pattern Display */}
      <div className="bg-zinc-900/60 rounded-lg p-6 border border-zinc-700 min-h-[200px] flex items-center justify-center">
        {gameState === "ready" && (
          <Button onClick={generateNewPattern} size="lg">
            Start Game
          </Button>
        )}

        {gameState === "showing" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 text-center">
              Watch carefully...
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {pattern.map((dir, idx) => {
                const Icon =
                  DIRECTION_ICONS[dir as keyof typeof DIRECTION_ICONS];
                const isActive = idx === currentIndex - 1;
                return (
                  <div
                    key={idx}
                    className={`
                      w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-300
                      ${isActive ? DIRECTION_COLORS[dir as keyof typeof DIRECTION_COLORS] : "bg-zinc-800"}
                      ${isActive ? "scale-110 shadow-lg" : "scale-100 opacity-40"}
                    `}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gameState === "input" && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Your turn. Repeat the pattern when ready.
              </p>
              <span className="text-xs text-cyan-400">No timer</span>
            </div>

            {/* User Input Display */}
            <div className="flex gap-2 justify-center flex-wrap min-h-[80px]">
              {userInput.map((dir, idx) => {
                const Icon =
                  DIRECTION_ICONS[dir as keyof typeof DIRECTION_ICONS];
                return (
                  <div
                    key={idx}
                    className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${DIRECTION_COLORS[dir as keyof typeof DIRECTION_COLORS]}
                    `}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                );
              })}
              {Array.from({ length: pattern.length - userInput.length }).map(
                (_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-zinc-700"
                  />
                ),
              )}
            </div>

            {/* Input Buttons - Touch optimized */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div />
              <Button
                onClick={() => handleDirectionInput(0)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDirectionInput(0);
                }}
                className="w-full h-20 sm:h-16 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition-all touch-none"
              >
                <ArrowUp className="w-10 h-10 sm:w-8 sm:h-8" />
              </Button>
              <div />

              <Button
                onClick={() => handleDirectionInput(3)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDirectionInput(3);
                }}
                className="w-full h-20 sm:h-16 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 active:scale-95 transition-all touch-none"
              >
                <ArrowLeft className="w-10 h-10 sm:w-8 sm:h-8" />
              </Button>
              <Button
                onClick={() => handleDirectionInput(2)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDirectionInput(2);
                }}
                className="w-full h-20 sm:h-16 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 active:scale-95 transition-all touch-none"
              >
                <ArrowDown className="w-10 h-10 sm:w-8 sm:h-8" />
              </Button>
              <Button
                onClick={() => handleDirectionInput(1)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDirectionInput(1);
                }}
                className="w-full h-20 sm:h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 active:scale-95 transition-all touch-none"
              >
                <ArrowRight className="w-10 h-10 sm:w-8 sm:h-8" />
              </Button>
            </div>
          </div>
        )}

        {gameState === "result" && result && (
          <div className="text-center space-y-4">
            {result.correct ? (
              <>
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-green-400">Perfect!</h3>
                <p className="text-zinc-300">
                  You remembered the entire pattern!
                </p>
                {combo > 1 && (
                  <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 animate-pulse">
                    <p className="text-lg font-bold text-purple-400">
                      Calm flow: {combo}
                    </p>
                    <p className="text-xs text-purple-300">
                      A steady rhythm helps recall settle in.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💭</div>
                <h3 className="text-2xl font-bold text-yellow-400">Almost!</h3>
                <p className="text-zinc-300">
                  Accuracy: {result.accuracy.toFixed(0)}%
                </p>
                {combo > 0 && (
                  <p className="text-xs text-zinc-500">
                    Flow reset for a fresh round.
                  </p>
                )}
              </>
            )}

            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={handleReset} variant="outline">
                New Game
              </Button>
              <Button onClick={generateNewPattern}>Same Level</Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-zinc-800/40 rounded-lg p-3">
          <p className="text-xs text-zinc-500">Length</p>
          <p className="text-lg font-bold text-white">{pattern.length}</p>
        </div>
        <div className="bg-zinc-800/40 rounded-lg p-3">
          <p className="text-xs text-zinc-500">Progress</p>
          <p className="text-lg font-bold text-white">{userInput.length}</p>
        </div>
        <div className="bg-zinc-800/40 rounded-lg p-3">
          <p className="text-xs text-zinc-500">Difficulty</p>
          <p className="text-lg font-bold text-white">{difficulty}</p>
        </div>
        <div className="bg-zinc-800/40 rounded-lg p-3">
          <p className="text-xs text-zinc-500">Flow</p>
          <p className="text-lg font-bold text-purple-400">
            {combo > 0 ? `${combo}x` : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
