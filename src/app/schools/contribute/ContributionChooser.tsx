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
 * Optional contribution amounts, deliberately rendered as a plain list.
 *
 * They were previously bordered cards in a grid, which read as a pricing table
 * with free access as the cheapest column. A list of suggestions cannot be
 * mistaken for a set of plans: there is nothing to compare, nothing to unlock
 * and no column marked as the better choice.
 *
 * Nothing is preselected, and submitting does not open a checkout — there is no
 * payment processor connected, and the form says so rather than staging a
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
      <fieldset>
        <legend className="text-base font-semibold text-foreground">
          Suggested annual contributions
        </legend>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Suggestions, not products. None of them changes what any school or any
          child receives.
        </p>

        <ul className="mt-4 space-y-3">
          {CONTRIBUTION_OPTIONS.map((option) => {
            const inputId = `${groupId}-${option.id}`;
            return (
              <li key={option.id}>
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-baseline gap-3"
                >
                  <input
                    type="radio"
                    id={inputId}
                    name={groupId}
                    value={option.id}
                    checked={selected === option.id}
                    onChange={() => {
                      setSelected(option.id);
                      setResult(null);
                    }}
                    className="h-5 w-5 shrink-0 self-center"
                  />
                  <span className="text-base text-foreground">
                    <span className="font-semibold">{option.label}</span>
                    {" — "}
                    <span className="text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
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
        className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-border px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:opacity-50"
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
              if you would like to arrange it.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
