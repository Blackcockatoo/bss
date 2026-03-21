"use client";

import { useState } from "react";

import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { Button } from "@/components/ui/button";
import type { OnboardingScope } from "@/lib/onboarding";

export function RouteTutorialControls({
  scope,
  buttonLabel = "Replay tutorial",
  className = "",
}: {
  scope: OnboardingScope;
  buttonLabel?: string;
  className?: string;
}) {
  const [forceShowToken, setForceShowToken] = useState(0);

  return (
    <>
      <OnboardingTutorial scope={scope} forceShowToken={forceShowToken} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setForceShowToken((current) => current + 1)}
        className={className}
      >
        {buttonLabel}
      </Button>
    </>
  );
}
