"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Map, Sparkles } from "lucide-react";
import { useState } from "react";
import { CosmeticsPanel } from "./CosmeticsPanel";
import { MiniGamesPanel } from "./MiniGamesPanel";
import { PatternRecognitionGame } from "./PatternRecognitionGame";
import { VimanaMap } from "./VimanaMap";

export function FeaturesDashboard() {
  const [activeTab, setActiveTab] = useState("vimana");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
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
        </TabsList>

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
      </Tabs>
    </div>
  );
}
