"use client";

import {
  completeTeacherOnboarding,
  hasCompletedTeacherOnboarding,
} from "@/lib/education/teacher-onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Monitor,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  {
    icon: BookOpen,
    title: "A 15-20 minute classroom tool",
    lines: [
      "Each session takes 15-20 minutes.",
      "Fits into a 30 or 50 minute block.",
      "No marking required. No login. No tracking.",
      "No ongoing maintenance or homework.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safe and predictable",
    lines: [
      "No chat or messaging between students.",
      "No internet interaction — runs on-device.",
      "No accounts or sign-ups needed.",
      "No AI content generation.",
      "Nothing follows students home.",
    ],
  },
  {
    icon: Monitor,
    title: "First time? Start here",
    lines: [
      "1. Open the site and project it on the board.",
      "2. Pick Lesson #1 — \"Meet Your Pattern\".",
      "3. Follow the script step by step.",
      "4. Ask the 3 questions shown on screen.",
      "5. Done in 15 minutes.",
    ],
  },
] as const;

export function TeacherOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasCompletedTeacherOnboarding()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    completeTeacherOnboarding();
    setVisible(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step indicator */}
          <div className="mb-4 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-emerald-400" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {current.title}
              </h2>
            </div>

            <ul className="space-y-2">
              {current.lines.map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Skip intro
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
