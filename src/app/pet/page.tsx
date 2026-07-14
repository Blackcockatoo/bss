"use client";

import { EvolutionPanel } from "@/components/EvolutionPanel";
import { HUD, HUDAdvancedStats } from "@/components/HUD";
import { PetResponseOverlay } from "@/components/PetResponseOverlay";
import { PetRuntimeStage } from "@/components/PetRuntimeStage";
import { RouteProgressionCard } from "@/components/RouteProgressionCard";
import { RouteTutorialControls } from "@/components/RouteTutorialControls";
import { AddonInventoryPanel } from "@/components/addons/AddonInventoryPanel";
import { PetProfilePanel } from "@/components/addons/PetProfilePanel";
import {
  CertificateButton,
  RegistrationCertificate,
} from "@/components/RegistrationCertificate";
import { WellnessSync } from "@/components/WellnessSync";
import { Button } from "@/components/ui/button";
import { initializeStarterAddons } from "@/lib/addons/starter";
import { useDnaImprint } from "@/lib/dnaImprint";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";
import { useJourneyProgressTracker } from "@/lib/journeyProgress";
import { getRouteProgression } from "@/lib/routeProgression";
import { useStore, type PetType } from "@/lib/store";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Move,
  Shield,
  Sparkles,
  UserCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PetPage() {
  const startTick = useStore((s) => s.startTick);
  const stopTick = useStore((s) => s.stopTick);
  const evolution = useStore((s) => s.evolution);
  const lastAction = useStore((s) => s.lastAction);
  const lastActionAt = useStore((s) => s.lastActionAt);
  const petType = useStore((s) => s.petType);
  const setPetType = useStore((s) => s.setPetType);
  const dnaImprint = useDnaImprint();
  const petStep = getRouteProgression("pet");
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showEvolutionPanel, setShowEvolutionPanel] = useState(false);
  const [addonEditMode, setAddonEditMode] = useState(false);
  const [addonsInitialized, setAddonsInitialized] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showWellnessSync, setShowWellnessSync] = useState(false);
  useJourneyProgressTracker("pet", { completeOnVisit: true });

  const imprintAccentClass =
    dnaImprint?.selectedSeed === "red"
      ? "via-rose-950/50"
      : dnaImprint?.selectedSeed === "blue"
        ? "via-cyan-950/45"
        : dnaImprint?.selectedSeed === "black"
          ? "via-emerald-950/35"
          : "via-purple-950/30";

  useEffect(() => {
    startTick();
    return () => stopTick();
  }, [startTick, stopTick]);

  // Caring for the pet gently prompts the user's own self-care, at most
  // once per hour.
  useEffect(() => {
    if (!lastAction || !lastActionAt) return;
    const PROMPT_KEY = "metapet-wellness-sync-prompted-at";
    const lastPrompt = Number(window.localStorage.getItem(PROMPT_KEY) ?? 0);
    if (lastActionAt - lastPrompt < 60 * 60 * 1000) return;
    window.localStorage.setItem(PROMPT_KEY, String(lastActionAt));
    const id = requestAnimationFrame(() => setShowWellnessSync(true));
    return () => cancelAnimationFrame(id);
  }, [lastAction, lastActionAt]);

  // Initialize starter addons on first load.
  useEffect(() => {
    if (!addonsInitialized) {
      initializeStarterAddons().then((result) => {
        if (result.success) {
          console.log(
            `Addon system initialized! Created ${result.addonsCreated} starter addons.`,
          );
          setAddonsInitialized(true);
        }
      });
    }
  }, [addonsInitialized]);

  const handleToggleProfilePanel = () => {
    setShowProfilePanel((prev) => {
      const next = !prev;
      if (next) {
        setShowAddonPanel(false);
        setShowEvolutionPanel(false);
      }
      return next;
    });
  };

  const handleToggleAddonPanel = () => {
    setShowAddonPanel((prev) => {
      const next = !prev;
      if (next) {
        setShowProfilePanel(false);
        setShowEvolutionPanel(false);
      }
      return next;
    });
  };

  const handleToggleEvolutionPanel = () => {
    setShowEvolutionPanel((prev) => {
      const next = !prev;
      if (next) {
        setShowProfilePanel(false);
        setShowAddonPanel(false);
      }
      return next;
    });
  };

  const closePanels = () => {
    setShowAddonPanel(false);
    setShowProfilePanel(false);
    setShowEvolutionPanel(false);
  };

  const handleToggleAdvanced = () => {
    setShowAdvanced((prev) => {
      const next = !prev;
      if (!next) {
        closePanels();
      }
      return next;
    });
  };

  const selectPetRuntime = (nextPetType: PetType) => {
    setPetType(nextPetType);
    if (nextPetType !== "auralia") {
      setAddonEditMode(false);
      setShowAddonPanel(false);
    }
  };

  const petName = petType === "auralia" ? "Auralia" : "Meta-Pet";
  const petId = petType === "auralia" ? "auralia-main" : "visual-dna-main";
  const formLabel =
    petType === "auralia"
      ? "Auralia Guardian"
      : petType === "geometry"
        ? "Geometry · Sri Yantra"
        : "Evolved · DNA / Forge Body";

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 ${imprintAccentClass} to-slate-900 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]`}
    >
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      <div className="flex min-h-[calc(100dvh-11rem)] flex-col items-center justify-start p-3 sm:p-4">
        <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-sm sm:rounded-3xl">
          <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                  Bond Layer · {formLabel}
                </p>
                <p className="text-sm text-zinc-200">{petStep.summary}</p>
                {dnaImprint ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    Latest DNA imprint:{" "}
                    <strong>{dnaImprint.resonanceClass}</strong> from the{" "}
                    <strong>{dnaImprint.selectedSeed}</strong> strand, last
                    explored in <strong>{dnaImprint.completedMode}</strong> mode.
                    <Link
                      href="/digital-dna"
                      className="ml-2 font-semibold text-cyan-200 underline underline-offset-4"
                    >
                      Re-open DNA Hub
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No DNA imprint yet. Visit the DNA route after bonding here
                    to unlock a genome readback.
                  </p>
                )}
              </div>

              <RouteTutorialControls
                scope="pet"
                className="self-start text-cyan-200 hover:text-white"
              />
            </div>
          </div>

          <div
            className={`relative flex-1 bg-gradient-to-br from-slate-900 ${imprintAccentClass} to-slate-900`}
          >
            <PetRuntimeStage
              addonEditMode={addonEditMode}
              onAddonEditModeChange={setAddonEditMode}
              showAdvanced={showAdvanced}
            />
          </div>

          <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/90 p-4 sm:p-6">
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Visual form — one pet, three bodies
              </p>
              <div
                role="group"
                aria-label="Pet visual form"
                className="grid grid-cols-3 gap-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectPetRuntime("auralia")}
                  aria-pressed={petType === "auralia"}
                  className={
                    petType === "auralia"
                      ? "border-amber-400 bg-amber-500/20 text-amber-100"
                      : "border-slate-700 bg-slate-900/80 text-zinc-300"
                  }
                >
                  Auralia
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectPetRuntime("evolved")}
                  aria-pressed={petType === "evolved"}
                  className={
                    petType === "evolved"
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                      : "border-slate-700 bg-slate-900/80 text-zinc-300"
                  }
                >
                  Evolved
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectPetRuntime("geometry")}
                  aria-pressed={petType === "geometry"}
                  className={
                    petType === "geometry"
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100"
                      : "border-slate-700 bg-slate-900/80 text-zinc-300"
                  }
                >
                  Geometry
                </Button>
              </div>
              {petType === "evolved" && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    The Evolved body inherits the live 180-digit genome. Shape
                    it in the Body Forge.
                  </p>
                  <Link href="/body-forge">
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap border-fuchsia-700 bg-fuchsia-950/50 text-fuchsia-200 hover:bg-fuchsia-900/60"
                    >
                      Open Body Forge
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <HUD mode="simple" />
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleAdvanced}
                className="w-full justify-between border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                aria-expanded={showAdvanced}
              >
                <span className="font-semibold">Advanced / Mechanics Lab</span>
                <span className="sr-only">
                  {" "}
                  — peek under the hood to see identity, addons, and the crypto
                  systems that keep your companion secure
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      Active body engine
                    </p>
                    <p className="text-xs text-slate-400">
                      Auralia, Evolved and Geometry are three renderers over
                      the same pet — switch them with the Visual Form selector
                      above. Body Forge shapes the Evolved body and always
                      returns here. Vimana and the Navigator return to this
                      same pet runtime instead of a separate pet page.
                    </p>
                    <Link href="/body-forge" className="mt-2 inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-fuchsia-700 bg-fuchsia-950/50 text-fuchsia-200 hover:bg-fuchsia-900/60"
                      >
                        Open Body Forge
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!ENABLE_CHILD_SAFE_BASELINE && (
                      <>
                        <Link href="/app/activities">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-cyan-700 bg-cyan-900/80 text-cyan-200 hover:bg-cyan-800"
                          >
                            <Compass className="h-4 w-4" />
                            Compass Wheel
                          </Button>
                        </Link>
                        <Link href="/identity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-indigo-700 bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800"
                          >
                            <UserCircle className="h-4 w-4" />
                            Identity
                          </Button>
                        </Link>
                      </>
                    )}
                    {petType === "auralia" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddonEditMode(!addonEditMode)}
                        className={`gap-2 ${
                          addonEditMode
                            ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
                            : "border-slate-700 bg-slate-900/80 text-zinc-300 hover:bg-slate-800"
                        }`}
                      >
                        <Move className="h-4 w-4" />
                        {addonEditMode ? "Editing" : "Edit Auralia"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleProfilePanel}
                      className={`gap-2 ${
                        showProfilePanel
                          ? "border-amber-500 bg-amber-600 text-white hover:bg-amber-700"
                          : "border-amber-700 bg-amber-900/80 text-amber-200 hover:bg-amber-800"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      Profile
                    </Button>
                    {petType === "auralia" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAddonPanel}
                        className={`gap-2 ${
                          showAddonPanel
                            ? "border-purple-500 bg-purple-600 text-white hover:bg-purple-700"
                            : "border-purple-700 bg-purple-900/80 text-purple-200 hover:bg-purple-800"
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                        Addons
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleEvolutionPanel}
                      className={`gap-2 ${
                        showEvolutionPanel
                          ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border-emerald-700 bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800"
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      Evolution
                    </Button>
                    <CertificateButton
                      onClick={() => setShowCertificate(true)}
                    />
                  </div>

                  {petType === "auralia" && addonEditMode && (
                    <div className="rounded-lg border border-blue-500/50 bg-blue-600/20 px-3 py-2 text-xs text-blue-100">
                      <span className="font-semibold">Edit Mode Active</span> —
                      Drag addons to reposition, hover for controls.
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {showProfilePanel && (
                      <PetProfilePanel
                        petId={petId}
                        petName={petName}
                        editMode={petType === "auralia" && addonEditMode}
                        onEditModeChange={setAddonEditMode}
                      />
                    )}
                    {petType === "auralia" && showAddonPanel && (
                      <AddonInventoryPanel />
                    )}
                    {showEvolutionPanel && (
                      <div className="rounded-lg border border-emerald-800/60 bg-zinc-950/60 p-4 md:col-span-2">
                        <EvolutionPanel />
                      </div>
                    )}
                    {!showProfilePanel &&
                      !showAddonPanel &&
                      !showEvolutionPanel && (
                        <div className="space-y-2 rounded-lg border border-dashed border-slate-700/60 p-4 text-xs text-slate-400 md:col-span-2">
                          <p>
                            Use the controls above to open the profile or
                            evolution panels.
                          </p>
                          <p className="text-slate-500">
                            The DNA / Forge body is the canonical inherited body
                            renderer. Auralia remains available as a specialist
                            Guardian form instead of a second hidden pet route.
                          </p>
                        </div>
                      )}
                  </div>

                  <HUDAdvancedStats />
                </div>
              )}

              <RouteProgressionCard route="pet" className="mt-4" />
            </div>
          </div>
        </div>
      </div>

      <RegistrationCertificate
        petId={petId}
        petName={petName}
        crest={null}
        heptaCode={null}
        createdAt={evolution.birthTime}
        evolutionState={evolution.state}
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />

      <WellnessSync
        isOpen={showWellnessSync}
        onClose={() => setShowWellnessSync(false)}
        lastAction={lastAction}
      />
    </div>
  );
}
