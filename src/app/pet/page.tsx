"use client";

import { EvolutionPanel } from "@/components/EvolutionPanel";
import { HUD, HUDAdvancedStats } from "@/components/HUD";
import { PetRegistryBootstrap } from "@/components/PetRegistryBootstrap";
import { PetResponseOverlay } from "@/components/PetResponseOverlay";
import { PetRuntimeStage } from "@/components/PetRuntimeStage";
import { BreedingChamber } from "@/components/BreedingChamber";
import { RouteProgressionCard } from "@/components/RouteProgressionCard";
import { RouteTutorialControls } from "@/components/RouteTutorialControls";
import { AddonInventoryPanel } from "@/components/addons/AddonInventoryPanel";
import { PetProfilePanel } from "@/components/addons/PetProfilePanel";
import { LivingWardrobe } from "@/components/wardrobe/LivingWardrobe";
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
import { usePetRegistryStore } from "@/lib/registry";
import { useStore, type PetType } from "@/lib/store";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Dna,
  GraduationCap,
  Move,
  Shield,
  Shirt,
  Sparkles,
  UserCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PET_FORM_LABELS: Record<PetType, string> = {
  auralia: "Auralia Companion",
  evolved: "Evolved / Body Forge",
  geometry: "Geometry / Sri Yantra",
};

const PET_FORM_ORDER: readonly PetType[] = ["auralia", "evolved", "geometry"];

// One neutral control style for every control on the page; a single cyan
// accent marks the active choice, so colour only ever means "selected".
const CONTROL_IDLE =
  "gap-2 border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white";
const CONTROL_ACTIVE =
  "gap-2 border-cyan-400/70 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 hover:text-white";

const controlClass = (active: boolean) =>
  active ? CONTROL_ACTIVE : CONTROL_IDLE;

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";

export default function PetPage() {
  const startTick = useStore((s) => s.startTick);
  const stopTick = useStore((s) => s.stopTick);
  const evolution = useStore((s) => s.evolution);
  const lastAction = useStore((s) => s.lastAction);
  const lastActionAt = useStore((s) => s.lastActionAt);
  const petType = useStore((s) => s.petType);
  const setPetType = useStore((s) => s.setPetType);
  const activeRecord = usePetRegistryStore((state) => state.activeRecord);
  const dnaImprint = useDnaImprint();
  const petStep = getRouteProgression("pet");
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showEvolutionPanel, setShowEvolutionPanel] = useState(false);
  const [showBreedingPanel, setShowBreedingPanel] = useState(false);
  const [addonEditMode, setAddonEditMode] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
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
        setShowBreedingPanel(false);
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
        setShowBreedingPanel(false);
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
        setShowBreedingPanel(false);
      }
      return next;
    });
  };

  const handleToggleBreedingPanel = () => {
    setShowBreedingPanel((prev) => {
      const next = !prev;
      if (next) {
        setShowProfilePanel(false);
        setShowAddonPanel(false);
        setShowEvolutionPanel(false);
      }
      return next;
    });
  };

  const anyPanelOpen =
    showProfilePanel ||
    showAddonPanel ||
    showEvolutionPanel ||
    showBreedingPanel;

  // The companion panels live on the page now, so collapsing the advanced
  // drawer no longer closes them.
  const handleToggleAdvanced = () => {
    setShowAdvanced((prev) => !prev);
  };

  const selectPetRuntime = (nextPetType: PetType) => {
    setPetType(nextPetType);
    if (nextPetType !== "auralia") {
      setAddonEditMode(false);
      setShowAddonPanel(false);
    }
  };

  // Switching form changes the renderer, never the companion identity.
  const petName = activeRecord?.name ?? "Awakening Meta-Pet";
  const petId = activeRecord?.petId ?? "registration-pending";

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 ${imprintAccentClass} to-slate-900 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]`}
    >
      <PetRegistryBootstrap />
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      <div
        className={`flex min-h-[calc(100dvh-11rem)] flex-col items-center justify-start p-3 transition-[padding] sm:p-4 ${wardrobeOpen ? "lg:pr-[480px]" : ""}`}
      >
        <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-sm sm:rounded-3xl">
          <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                  Bond Layer · {PET_FORM_LABELS[petType]}
                </p>
                <p className="text-sm text-zinc-200">{petStep.summary}</p>
                {dnaImprint ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    Latest DNA imprint:{" "}
                    <strong>{dnaImprint.resonanceClass}</strong> from the{" "}
                    <strong>{dnaImprint.selectedSeed}</strong> strand, last
                    explored in <strong>{dnaImprint.completedMode}</strong>{" "}
                    mode.
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

              <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <Button
                  type="button"
                  onClick={() => setWardrobeOpen(true)}
                  className="gap-2 border border-cyan-400/40 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white hover:from-cyan-500 hover:to-fuchsia-500"
                >
                  <Shirt className="h-4 w-4" />
                  Open Wardrobe
                </Button>
                <RouteTutorialControls
                  scope="pet"
                  className="self-start text-cyan-200 hover:text-white sm:self-end"
                />
              </div>
            </div>
          </div>

          <div
            className={`relative flex-1 bg-gradient-to-br from-slate-900 ${imprintAccentClass} to-slate-900 ${wardrobeOpen ? "max-h-[38vh] overflow-hidden lg:max-h-none" : ""}`}
          >
            <PetRuntimeStage
              addonEditMode={addonEditMode}
              onAddonEditModeChange={setAddonEditMode}
              showAdvanced={showAdvanced}
            />
          </div>

          <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/90 p-4 sm:p-6">
            {/* Form sits against the stage: it changes the creature you are
                looking at, so it does not belong behind a drawer. */}
            <section aria-labelledby="pet-form-label" className="space-y-2">
              <p id="pet-form-label" className={SECTION_LABEL}>
                Companion form
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PET_FORM_ORDER.map((form) => (
                  <Button
                    key={form}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={petType === form}
                    onClick={() => selectPetRuntime(form)}
                    className={controlClass(petType === form)}
                  >
                    {PET_FORM_LABELS[form]}
                  </Button>
                ))}
              </div>
            </section>

            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <HUD mode="simple" />
            </div>

            {/* The companion's own systems. These are the reason people open
                this page, so they stay on it. */}
            <section
              aria-labelledby="pet-systems-label"
              className="mt-6 space-y-3 border-t border-slate-800/80 pt-4"
            >
              <p id="pet-systems-label" className={SECTION_LABEL}>
                Companion systems
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={showEvolutionPanel}
                  onClick={handleToggleEvolutionPanel}
                  className={controlClass(showEvolutionPanel)}
                >
                  <Zap className="h-4 w-4" />
                  Evolution
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={showProfilePanel}
                  onClick={handleToggleProfilePanel}
                  className={controlClass(showProfilePanel)}
                >
                  <Shield className="h-4 w-4" />
                  Profile
                </Button>
                {petType === "auralia" && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={showAddonPanel}
                    onClick={handleToggleAddonPanel}
                    className={controlClass(showAddonPanel)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Addons
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={showBreedingPanel}
                  onClick={handleToggleBreedingPanel}
                  className={controlClass(showBreedingPanel)}
                >
                  <Dna className="h-4 w-4" />
                  Breed Geometry
                </Button>
                <CertificateButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCertificate(true)}
                  className={CONTROL_IDLE}
                />
              </div>

              {anyPanelOpen && (
                <div className="grid gap-4 md:grid-cols-2">
                  {showProfilePanel && (
                    <PetProfilePanel
                      petId={petId}
                      petName={petName}
                      record={activeRecord}
                      editMode={petType === "auralia" && addonEditMode}
                      onEditModeChange={setAddonEditMode}
                    />
                  )}
                  {petType === "auralia" && showAddonPanel && (
                    <AddonInventoryPanel />
                  )}
                  {showEvolutionPanel && (
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 md:col-span-2">
                      <EvolutionPanel />
                    </div>
                  )}
                  {showBreedingPanel && (
                    <div className="md:col-span-2">
                      <BreedingChamber />
                    </div>
                  )}
                </div>
              )}
            </section>

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
                  — raw runtime numbers, body-building tools, and the other
                  routes that read this companion
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <section className="space-y-2">
                    <p className={SECTION_LABEL}>Runtime stats</p>
                    <HUDAdvancedStats />
                  </section>

                  <section className="space-y-2 border-t border-slate-800/80 pt-4">
                    <p className={SECTION_LABEL}>Body tools</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/body-forge">
                        <Button
                          variant="outline"
                          size="sm"
                          className={CONTROL_IDLE}
                        >
                          Open Body Forge
                        </Button>
                      </Link>
                      {petType === "auralia" && (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-pressed={addonEditMode}
                          onClick={() => setAddonEditMode(!addonEditMode)}
                          className={controlClass(addonEditMode)}
                        >
                          <Move className="h-4 w-4" />
                          {addonEditMode ? "Editing" : "Edit Auralia"}
                        </Button>
                      )}
                    </div>
                    {petType === "auralia" && addonEditMode && (
                      <p className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                        <span className="font-semibold">Edit Mode Active</span>{" "}
                        — Drag addons to reposition, hover for controls.
                      </p>
                    )}
                    <p className="text-xs leading-relaxed text-slate-400">
                      Body Forge returns here in Evolved form, where the Moss60
                      movement and identity layer performs on the inherited
                      body. All three forms share one identity, progression
                      record, and vitals system.
                    </p>
                  </section>

                  <section className="space-y-2 border-t border-slate-800/80 pt-4">
                    <p className={SECTION_LABEL}>Other routes</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/teachers">
                        <Button
                          variant="outline"
                          size="sm"
                          className={CONTROL_IDLE}
                        >
                          <GraduationCap className="h-4 w-4" />
                          Teacher Hub
                        </Button>
                      </Link>
                      {!ENABLE_CHILD_SAFE_BASELINE && (
                        <>
                          <Link href="/app/activities">
                            <Button
                              variant="outline"
                              size="sm"
                              className={CONTROL_IDLE}
                            >
                              <Compass className="h-4 w-4" />
                              Compass Wheel
                            </Button>
                          </Link>
                          <Link href="/identity">
                            <Button
                              variant="outline"
                              size="sm"
                              className={CONTROL_IDLE}
                            >
                              <UserCircle className="h-4 w-4" />
                              Identity
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>

            <RouteProgressionCard route="pet" className="mt-4" />
          </div>
        </div>
      </div>

      <RegistrationCertificate
        record={activeRecord}
        petId={petId}
        petName={petName}
        crest={activeRecord?.crest ?? null}
        heptaCode={activeRecord?.heptaCode?.digits ?? null}
        createdAt={activeRecord?.createdAt ?? evolution.birthTime}
        evolutionState={activeRecord?.evolution.state ?? evolution.state}
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />

      <WellnessSync
        isOpen={showWellnessSync}
        onClose={() => setShowWellnessSync(false)}
        lastAction={lastAction}
      />

      <LivingWardrobe
        isOpen={wardrobeOpen}
        onClose={() => setWardrobeOpen(false)}
        form={petType}
      />
    </div>
  );
}
