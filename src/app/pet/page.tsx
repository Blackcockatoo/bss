'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { HUD, HUDAdvancedStats } from '@/components/HUD';
import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { Button } from '@/components/ui/button';
import { PetResponseOverlay } from '@/components/PetResponseOverlay';
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';
import { PetProfilePanel } from '@/components/addons/PetProfilePanel';
import { initializeStarterAddons } from '@/lib/addons/starter';
import { Sparkles, Shield, Move, UserCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function PetPage() {
  const startTick = useStore(s => s.startTick);
  const stopTick = useStore(s => s.stopTick);
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [addonEditMode, setAddonEditMode] = useState(false);
  const [addonsInitialized, setAddonsInitialized] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    startTick();
    return () => stopTick();
  }, [startTick, stopTick]);

  // Initialize starter addons on first load
  useEffect(() => {
    if (!addonsInitialized) {
      initializeStarterAddons().then((result) => {
        if (result.success) {
          console.log(`Addon system initialized! Created ${result.addonsCreated} starter addons.`);
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
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col overflow-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Real-time Response Overlay */}
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      {/* Main Pet Window - Full Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full h-full max-w-4xl bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
          {/* Pet Display Area */}
          <div className="flex-1 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 relative">
            <AuraliaMetaPet
              addonEditMode={addonEditMode}
              onAddonEditModeChange={setAddonEditMode}
              showAdvanced={showAdvanced}
            />
          </div>

          {/* Controls Bar */}
          <div className="p-6 bg-slate-900/90 border-t border-slate-700/50 flex-shrink-0">
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
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddonEditMode(!addonEditMode)}
                      className={`gap-2 ${addonEditMode
                        ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-slate-700 bg-slate-900/80 text-zinc-300 hover:bg-slate-800'}`}
                    >
                      <Move className="w-4 h-4" />
                      {addonEditMode ? 'Editing' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleProfilePanel}
                      className={`gap-2 ${showProfilePanel
                        ? 'border-amber-500 bg-amber-600 text-white hover:bg-amber-700'
                        : 'border-amber-700 bg-amber-900/80 text-amber-200 hover:bg-amber-800'}`}
                    >
                      <Shield className="w-4 h-4" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleAddonPanel}
                      className={`gap-2 ${showAddonPanel
                        ? 'border-purple-500 bg-purple-600 text-white hover:bg-purple-700'
                        : 'border-purple-700 bg-purple-900/80 text-purple-200 hover:bg-purple-800'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Addons
                    </Button>
                  </div>

                  {addonEditMode && (
                    <div className="rounded-lg border border-blue-500/50 bg-blue-600/20 px-3 py-2 text-xs text-blue-100">
                      <span className="font-semibold">Edit Mode Active</span> — Drag addons to reposition, hover for controls.
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
                      <div className="rounded-lg border border-dashed border-slate-700/60 p-4 text-xs text-slate-400">
                        Use the controls above to open the profile or addon panels.
                      </div>
                    )}
                  </div>

                  <HUDAdvancedStats />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
