"use client";

import { useId, useState } from "react";

import {
  CONTRIBUTION_CONTACT_EMAIL,
  CONTRIBUTION_INTEGRATION_POINT,
  CONTRIBUTION_OPTIONS,
  DEFAULT_CONTRIBUTION_SELECTION,
  type ContributionIntentResult,
} from "@/lib/schools/contribution";

/**
 * The adult-only contribution chooser.
 *
 * Nothing is preselected, no option is badged, and choosing A$0 is a complete,
 * unremarkable answer. Submitting does not open a checkout: there is no payment
 * processor connected, and the form says so plainly rather than staging a
 * transaction that cannot happen.
 */
export function ContributionChooser() {
  const groupId = useId();
  const [selected, setSelected] = useState<string | null>(
    DEFAULT_CONTRIBUTION_SELECTION,
  );
  const [customAmount, setCustomAmount] = useState("");
  const [result, setResult] = useState<ContributionIntentResult | null>(null);

  const chosen = CONTRIBUTION_OPTIONS.find((option) => option.id === selected);
  const isCustom = chosen?.amount === null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen) return;

    const parsed = Number.parseFloat(customAmount);
    setResult(
      CONTRIBUTION_INTEGRATION_POINT({
        optionId: chosen.id,
        amount: isCustom
          ? Number.isFinite(parsed) && parsed >= 0
            ? parsed
            : null
          : chosen.amount,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-foreground">
          Choose an annual contribution
        </legend>
        <p className="text-sm leading-6 text-muted-foreground">
          Every option below gives your school exactly the same thing. Nothing
          is selected for you.
        </p>

        <div className="grid gap-3">
          {CONTRIBUTION_OPTIONS.map((option) => {
            const inputId = `${groupId}-${option.id}`;
            const isSelected = selected === option.id;
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-800 ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-600/10"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={groupId}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => {
                    setSelected(option.id);
                    setResult(null);
                  }}
                  className="mt-1 h-5 w-5 shrink-0"
                />
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {isCustom ? (
        <div className="space-y-2">
          <label
            htmlFor={`${groupId}-amount`}
            className="block text-sm font-semibold text-foreground"
          >
            Amount in Australian dollars
          </label>
          <input
            id={`${groupId}-amount`}
            type="number"
            min={0}
            step="1"
            inputMode="decimal"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="min-h-12 w-full max-w-xs rounded-xl border border-border bg-card px-3 text-base text-foreground"
            placeholder="e.g. 400"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!chosen}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        Record this choice
      </button>

      <div aria-live="polite">
        {result ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-200">
            <p className="font-semibold">{result.message}</p>
            <p className="mt-2">
              Email{" "}
              <a
                className="font-semibold underline underline-offset-2"
                href={`mailto:${CONTRIBUTION_CONTACT_EMAIL}?subject=MetaPet%20School%20contribution`}
              >
                {CONTRIBUTION_CONTACT_EMAIL}
              </a>{" "}
              if you would like to arrange it. If you chose A$0, there is
              nothing to arrange — just start teaching.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
