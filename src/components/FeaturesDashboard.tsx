"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Gamepad2, Map, Sparkles, Swords, Trophy } from "lucide-react";
import { useState } from "react";
import { AchievementsPanel } from "./AchievementsPanel";
import { BattleArena } from "./BattleArena";
import { CosmeticsPanel } from "./CosmeticsPanel";
import { MiniGamesPanel } from "./MiniGamesPanel";
import { PatternRecognitionGame } from "./PatternRecognitionGame";
import { SteeringWheel } from "./steering";
import { VimanaMap } from "./VimanaMap";

type FeaturesDashboardTab =
  | "navigator"
  | "battle"
  | "vimana"
  | "games"
  | "cosmetics"
  | "achievements";

interface FeaturesDashboardProps {
  includeNavigator?: boolean;
  initialTab?: FeaturesDashboardTab;
}

export function FeaturesDashboard({
  includeNavigator = false,
  initialTab,
}: FeaturesDashboardProps) {
  const defaultTab =
    initialTab === "navigator" && !includeNavigator
      ? "battle"
      : (initialTab ?? (includeNavigator ? "navigator" : "battle"));
  const [activeTab, setActiveTab] = useState<FeaturesDashboardTab>(defaultTab);
  const handleTabChange = (value: string) => {
    setActiveTab(value as FeaturesDashboardTab);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={`grid w-full grid-cols-2 gap-2 mb-6 h-auto ${
            includeNavigator ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-5"
          }`}
        >
          {includeNavigator && (
            <TabsTrigger
              value="navigator"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
            >
              <Compass className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-sm">Navigator</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="battle"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Swords className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Battle</span>
          </TabsTrigger>
          <TabsTrigger
            value="vimana"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Map className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Explore</span>
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Gamepad2 className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Games</span>
          </TabsTrigger>
          <TabsTrigger
            value="cosmetics"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Style</span>
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Trophy className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Achievements</span>
          </TabsTrigger>
        </TabsList>

        {includeNavigator && (
          <TabsContent value="navigator" className="mt-0">
            <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
              <SteeringWheel />
            </div>
          </TabsContent>
        )}

        <TabsContent value="battle" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
            <BattleArena />
          </div>
        </TabsContent>

        <TabsContent value="vimana" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
            <VimanaMap />
          </div>
        </TabsContent>

        <TabsContent value="games" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
            <div className="space-y-6">
              <MiniGamesPanel />

              <div className="border-t border-zinc-700 pt-6">
                <PatternRecognitionGame />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cosmetics" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
            <CosmeticsPanel />
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800">
            <AchievementsPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
