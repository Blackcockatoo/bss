"use client";

import AuraliaMetaPet from "@/components/AuraliaMetaPet";
import { HUD, HUDAdvancedStats } from "@/components/HUD";
import { PetResponseOverlay } from "@/components/PetResponseOverlay";
import { RouteProgressionCard } from "@/components/RouteProgressionCard";
import { RouteTutorialControls } from "@/components/RouteTutorialControls";
import { AddonInventoryPanel } from "@/components/addons/AddonInventoryPanel";
import { PetProfilePanel } from "@/components/addons/PetProfilePanel";
import { Button } from "@/components/ui/button";
import { initializeStarterAddons } from "@/lib/addons/starter";
import { useDnaImprint } from "@/lib/dnaImprint";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";
import { useJourneyProgressTracker } from "@/lib/journeyProgress";
import { useStore } from "@/lib/store";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Move,
  Shield,
  Sparkles,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PetPage() {
  const startTick = useStore((s) => s.startTick);
  const stopTick = useStore((s) => s.stopTick);
  const dnaImprint = useDnaImprint();
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [addonEditMode, setAddonEditMode] = useState(false);
  const [addonsInitialized, setAddonsInitialized] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  // Initialize starter addons on first load
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
      }
      return next;
    });
  };

  const handleToggleAddonPanel = () => {
    setShowAddonPanel((prev) => {
      const next = !prev;
      if (next) {
        setShowProfilePanel(false);
      }
      return next;
    });
  };

  const closePanels = () => {
    setShowAddonPanel(false);
    setShowProfilePanel(false);
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

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 ${imprintAccentClass} to-slate-900 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]`}
    >
      {/* Real-time Response Overlay */}
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      {/* Main Pet Window - Full Screen */}
      <div className="flex min-h-[calc(100dvh-11rem)] flex-col items-center justify-start p-3 sm:p-4">
        <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-sm sm:rounded-3xl">
          <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                  Bond Layer
                </p>
                <p className="text-sm text-zinc-200">
                  Care is the first step in the main ladder. Bond with the pet
                  here, then carry that context into school, identity, and DNA.
                </p>
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

          {/* Pet Display Area */}
          <div className={`flex-1 bg-gradient-to-br from-slate-900 ${imprintAccentClass} to-slate-900 relative`}>
            <AuraliaMetaPet
              addonEditMode={addonEditMode}
              onAddonEditModeChange={setAddonEditMode}
              showAdvanced={showAdvanced}
            />
          </div>

          {/* Controls Bar */}
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
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap gap-2">
                    {!ENABLE_CHILD_SAFE_BASELINE && (
                      <>
                        <Link href="/app/activities">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-cyan-700 bg-cyan-900/80 text-cyan-200 hover:bg-cyan-800"
                          >
                            <Compass className="w-4 h-4" />
                            Compass Wheel
                          </Button>
                        </Link>
                        <Link href="/identity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-indigo-700 bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800"
                          >
                            <UserCircle className="w-4 h-4" />
                            Identity
                          </Button>
                        </Link>
                      </>
                    )}
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
                      <Move className="w-4 h-4" />
                      {addonEditMode ? "Editing" : "Edit"}
                    </Button>
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
                      <Shield className="w-4 h-4" />
                      Profile
                    </Button>
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
                      <Sparkles className="w-4 h-4" />
                      Addons
                    </Button>
                  </div>

                  {addonEditMode && (
                    <div className="rounded-lg border border-blue-500/50 bg-blue-600/20 px-3 py-2 text-xs text-blue-100">
                      <span className="font-semibold">Edit Mode Active</span> —
                      Drag addons to reposition, hover for controls.
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {showProfilePanel && (
                      <PetProfilePanel
                        petId="auralia-main"
                        petName="Auralia"
                        editMode={addonEditMode}
                        onEditModeChange={setAddonEditMode}
                      />
                    )}
                    {showAddonPanel && <AddonInventoryPanel />}
                    {!showProfilePanel && !showAddonPanel && (
                      <div className="space-y-2 rounded-lg border border-dashed border-slate-700/60 p-4 text-xs text-slate-400 md:col-span-2">
                        <p>
                          Use the controls above to open the profile or addon
                          panels.
                        </p>
                        <p className="text-slate-500">
                          Every addon is cryptographically signed with ECDSA —
                          the same standard used in banking and blockchain. We
                          believe digital items should be truly owned, not
                          rented.
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
    </div>
  );
}
