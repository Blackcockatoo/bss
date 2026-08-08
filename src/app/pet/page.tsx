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
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

const PET_FORM_LABELS: Record<PetType, string> = {
  auralia: "Auralia Companion",
  evolved: "Evolved / Body Forge",
  geometry: "Geometry / Sri Yantra",
};

type AdvancedTab = "form" | "systems" | "stats" | "links";

const ADVANCED_TABS: Array<{ id: AdvancedTab; label: string; hint: string }> = [
  { id: "form", label: "Form", hint: "Pick which body renders your companion" },
  {
    id: "systems",
    label: "Systems",
    hint: "Profile, addons, evolution, breeding",
  },
  { id: "stats", label: "Stats", hint: "Raw vitals and runtime numbers" },
  {
    id: "links",
    label: "Links",
    hint: "Other routes that read this companion",
  },
];

// One neutral control style for the whole lab; a single cyan accent marks the
// active choice so the panel reads as one system instead of a colour grid.
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
  const [advancedTab, setAdvancedTab] = useState<AdvancedTab>("form");
  const tabRefs = useRef<
    Partial<Record<AdvancedTab, HTMLButtonElement | null>>
  >({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [showWellnessSync, setShowWellnessSync] = useState(false);
  useJourneyProgressTracker("pet", { completeOnVisit: true });

  // Deep links from the B$S product map must land on the feature they name,
  // not merely on the pet route with Evolution still buried in a closed lab.
  useEffect(() => {
    const panel = new URLSearchParams(window.location.search).get("panel");
    if (panel !== "evolution") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setShowAdvanced(true);
      setAdvancedTab("systems");
      setShowEvolutionPanel(true);
      setShowAddonPanel(false);
      setShowProfilePanel(false);
      setShowBreedingPanel(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const closePanels = () => {
    setShowAddonPanel(false);
    setShowProfilePanel(false);
    setShowEvolutionPanel(false);
    setShowBreedingPanel(false);
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

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const last = ADVANCED_TABS.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft")
      nextIndex = index === 0 ? last : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = last;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = ADVANCED_TABS[nextIndex].id;
    setAdvancedTab(nextTab);
    tabRefs.current[nextTab]?.focus();
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
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
                  <div
                    role="tablist"
                    aria-label="Mechanics Lab sections"
                    className="flex gap-1 overflow-x-auto border-b border-slate-800/80 bg-slate-950/80 p-1"
                  >
                    {ADVANCED_TABS.map((tab, index) => {
                      const active = advancedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          id={`mechanics-tab-${tab.id}`}
                          aria-controls={`mechanics-panel-${tab.id}`}
                          aria-selected={active}
                          tabIndex={active ? 0 : -1}
                          ref={(node) => {
                            tabRefs.current[tab.id] = node;
                          }}
                          onClick={() => setAdvancedTab(tab.id)}
                          onKeyDown={(event) => handleTabKeyDown(event, index)}
                          className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                            active
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4">
                    <p className="mb-4 text-xs text-slate-500">
                      {
                        ADVANCED_TABS.find((tab) => tab.id === advancedTab)
                          ?.hint
                      }
                    </p>

                    {advancedTab === "form" && (
                      <div
                        role="tabpanel"
                        id="mechanics-panel-form"
                        aria-labelledby="mechanics-tab-form"
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <p className={SECTION_LABEL}>Active body engine</p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectPetRuntime("auralia")}
                              className={controlClass(petType === "auralia")}
                            >
                              Auralia Companion
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectPetRuntime("evolved")}
                              className={controlClass(petType === "evolved")}
                            >
                              Evolved / Body Forge
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectPetRuntime("geometry")}
                              className={controlClass(petType === "geometry")}
                            >
                              Geometry / Sri Yantra
                            </Button>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-400">
                            These are three forms of the same companion. Body
                            Forge returns here in Evolved form, where the Moss60
                            movement and identity layer performs on the
                            inherited body; Geometry is the separate Sri Yantra
                            manifestation of the same genome; Auralia is the
                            default form.
                          </p>
                        </div>

                        <div className="space-y-2 border-t border-slate-800/80 pt-4">
                          <p className={SECTION_LABEL}>Build a new body</p>
                          <Link href="/body-forge" className="inline-block">
                            <Button
                              variant="outline"
                              size="sm"
                              className={CONTROL_IDLE}
                            >
                              Open Body Forge
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {advancedTab === "systems" && (
                      <div
                        role="tabpanel"
                        id="mechanics-panel-systems"
                        aria-labelledby="mechanics-tab-systems"
                        className="space-y-4"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
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
                            onClick={handleToggleEvolutionPanel}
                            className={controlClass(showEvolutionPanel)}
                          >
                            <Zap className="h-4 w-4" />
                            Evolution
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleBreedingPanel}
                            className={controlClass(showBreedingPanel)}
                          >
                            <Dna className="h-4 w-4" />
                            Breed Geometry
                          </Button>
                          {petType === "auralia" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddonEditMode(!addonEditMode)}
                              className={controlClass(addonEditMode)}
                            >
                              <Move className="h-4 w-4" />
                              {addonEditMode ? "Editing" : "Edit Auralia"}
                            </Button>
                          )}
                          <CertificateButton
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCertificate(true)}
                            className={CONTROL_IDLE}
                          />
                        </div>

                        {petType === "auralia" && addonEditMode && (
                          <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                            <span className="font-semibold">
                              Edit Mode Active
                            </span>{" "}
                            — Drag addons to reposition, hover for controls.
                          </div>
                        )}

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
                          {!showProfilePanel &&
                            !showAddonPanel &&
                            !showEvolutionPanel &&
                            !showBreedingPanel && (
                              <p className="rounded-lg border border-dashed border-slate-700/60 p-4 text-xs text-slate-500 md:col-span-2">
                                Auralia, Evolved, and Geometry share one
                                identity, progression record, vitals system, and
                                canonical pet route. Pick a system above to
                                inspect it.
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {advancedTab === "stats" && (
                      <div
                        role="tabpanel"
                        id="mechanics-panel-stats"
                        aria-labelledby="mechanics-tab-stats"
                      >
                        <HUDAdvancedStats />
                      </div>
                    )}

                    {advancedTab === "links" && (
                      <div
                        role="tabpanel"
                        id="mechanics-panel-links"
                        aria-labelledby="mechanics-tab-links"
                        className="flex flex-wrap gap-2"
                      >
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
                    )}
                  </div>
                </div>
              )}

              <RouteProgressionCard route="pet" className="mt-4" />
            </div>
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
