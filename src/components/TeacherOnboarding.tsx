"use client";

import {
  completeTeacherOnboarding,
  hasCompletedTeacherOnboarding,
} from "@/lib/education/teacher-onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Monitor,
  Rocket,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    icon: GraduationCap,
    title: "What is MetaPet Schools?",
    lines: [
      "A digital companion for Years 3-6 classrooms.",
      "Students explore systems thinking, digital responsibility, and emotional regulation.",
      "7 teacher-led sessions, each 20 minutes.",
      "No accounts, no data collection, everything on this device.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Privacy and safety",
    lines: [
      "No student accounts or sign-up required.",
      "Students use teacher-assigned aliases only.",
      "All data stays on this device — no cloud sync.",
      "No chat, social features, or open-ended AI.",
      "Clearing the browser removes all data.",
    ],
  },
  {
    icon: Users,
    title: "Set up your classroom",
    lines: [
      "Create an alias roster with pseudonyms for each student.",
      "Use the Classroom Manager to add and manage aliases.",
      "Aliases keep sessions private — no real names stored.",
      "You can reset the roster at any time.",
    ],
  },
  {
    icon: BookOpen,
    title: "Choose your first lesson",
    lines: [
      "Start with Session 1: \"Meet the Digital Companion\".",
      "Each lesson card includes an outcome, activity, and teacher prompt.",
      "Add lessons to the queue from the lesson planner.",
      "Sessions fit into a 30 or 50 minute block.",
    ],
  },
  {
    icon: ClipboardList,
    title: "Review before you start",
    lines: [
      "Read the safeguarding page for escalation and supervision guidance.",
      "Check the parent note if families need information.",
      "Review the teacher guide for pacing and deletion instructions.",
      "Visit /schools/safeguarding for the full summary.",
    ],
  },
  {
    icon: Rocket,
    title: "Ready to go!",
    lines: [
      "Open the classroom runtime to start your first session.",
      "Project it on the board and guide students through the lesson.",
      "Use the pre and post prompts shown on screen.",
      "You can re-run this setup wizard from the Classroom Manager.",
    ],
  },
] as const;

export function TeacherOnboarding() {
  const [visible, setVisible] = useState(() => !hasCompletedTeacherOnboarding());
  const [step, setStep] = useState(0);

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
