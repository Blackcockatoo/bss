"use client";

import { useId } from "react";
import { Check } from "lucide-react";

import { PetBodyRenderer } from "@/components/body-forge/PetBodyRenderer";
import { Button } from "@/components/ui/button";
import type { LessonPetConfig, LessonStepDefinition } from "@/lib/teacher-lessons";
import { configToBodySpec, describePetConfig } from "./petSpec";

/** Plain-language label for each canonical investigation stage. */
export const STEP_KIND_LABEL: Record<LessonStepDefinition["kind"], string> = {
  notice: "Notice",
  predict: "Predict",
  act: "Act",
  observe: "Observe",
  explain: "Explain",
  create: "Create",
  reflect: "Reflect",
};

/**
 * A classroom-sized pet stage. Renders the real Body Forge pet, respects
 * reduced-motion (falls back to a static pose), and always exposes a text
 * description so animated state changes are captioned for every learner.
 */
export function PetStage({
  config,
  reducedMotion,
  size = "md",
  caption,
}: {
  config: LessonPetConfig;
  reducedMotion: boolean;
  size?: "sm" | "md" | "lg";
  caption?: string;
}) {
  const dimension =
    size === "lg" ? "h-64 w-64" : size === "sm" ? "h-32 w-32" : "h-48 w-48";
  const description = caption ?? describePetConfig(config);

  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className={`${dimension} flex items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-900/50`}
      >
        <PetBodyRenderer
          spec={configToBodySpec(config)}
          animate={!reducedMotion}
          className="h-full w-full"
        />
      </div>
      <figcaption className="max-w-xs text-center text-xs text-slate-400">
        {description}
      </figcaption>
    </figure>
  );
}

export interface ChoiceOption {
  id: string;
  label: string;
  hint?: string;
}

/**
 * A large, keyboard- and touch-friendly single-select grid. Selection is shown
 * with a check icon + ring (not colour alone).
 */
export function ChoiceGrid({
  legend,
  options,
  value,
  onChange,
  columns = 3,
  disabled = false,
}: {
  legend: string;
  options: readonly ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
  disabled?: boolean;
}) {
  const colClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-medium text-slate-200">{legend}</legend>
      <div className={`grid gap-2 ${colClass}`} role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                selected
                  ? "border-amber-300 bg-amber-300/15 text-amber-100"
                  : "border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {selected ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {option.label}
              </span>
              {option.hint ? (
                <span className="text-[0.7rem] font-normal text-slate-400">
                  {option.hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A labelled short-text evidence field. */
export function EvidenceText({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 2,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 disabled:opacity-60"
      />
    </div>
  );
}

/**
 * A common frame for a step's activity body. Shows the step kind label, the
 * main instruction (student-facing) and the activity content. Keeps every
 * activity visually consistent and screen-reader friendly.
 */
export function StepShell({
  kindLabel,
  instruction,
  children,
  footer,
}: {
  kindLabel: string;
  instruction: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      {/* Only the stage label + instruction are in the live region, so typing
          in a field inside `children` never re-triggers an announcement. */}
      <div className="space-y-1" aria-live="polite">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
          {kindLabel}
        </h2>
        <p className="text-lg leading-7 text-slate-100">{instruction}</p>
      </div>
      <div className="space-y-4">{children}</div>
      {footer ? <div className="pt-1">{footer}</div> : null}
    </section>
  );
}

/** Small "Save response" confirmation button used by activities. */
export function SaveButton({
  onClick,
  saved,
  disabled = false,
  label = "Save response",
}: {
  onClick: () => void;
  saved: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
    >
      {saved ? <Check className="mr-1.5 h-5 w-5" aria-hidden="true" /> : null}
      {saved ? "Saved" : label}
    </Button>
  );
}
