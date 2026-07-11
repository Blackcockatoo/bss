"use client";

import { AnxietyAnchor, EmergencyGroundingButton } from "./AnxietyAnchor";
import { HabitTracker } from "./HabitTracker";
import { HydrationQuickButton, HydrationTracker } from "./HydrationTracker";
import { InsightsPanel } from "./InsightsPanel";
import { MemoryTimeline } from "./MemoryTimeline";
import { MoodCheckIn } from "./MoodCheckIn";
import { MoodGraph } from "./MoodGraph";
import { SleepStatusButton, SleepTracker } from "./SleepTracker";
import { WellnessSettings, WellnessSettingsButton } from "./WellnessSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBondStore } from "@/lib/bond/store";
import { useBond } from "@/lib/bond/useBond";
import {
  BookHeart,
  Brain,
  Droplets,
  HeartPulse,
  Settings,
} from "lucide-react";
import { useState } from "react";

type WellnessTab = "checkin" | "body" | "mind" | "story" | "settings";

const PET_ID = "auralia-main";

export function WellnessDashboard() {
  const [activeTab, setActiveTab] = useState<WellnessTab>("checkin");
  const [showHydration, setShowHydration] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    bond,
    memory,
    insights,
    checkInMood,
    createHabit,
    completeHabit,
    deleteHabit,
  } = useBond({ petId: PET_ID });
  const pinMoment = useBondStore((state) => state.pinMoment);

  const totalDaysTogether = Math.max(
    1,
    Math.floor((Date.now() - bond.bondStartedAt) / 86400000),
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as WellnessTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 mb-6 h-auto sm:grid-cols-5">
          <TabsTrigger
            value="checkin"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <HeartPulse className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Check-in</span>
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Droplets className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Body</span>
          </TabsTrigger>
          <TabsTrigger
            value="mind"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Brain className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Mind</span>
          </TabsTrigger>
          <TabsTrigger
            value="story"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <BookHeart className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Story</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 touch-manipulation"
          >
            <Settings className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-0 space-y-4">
          <MoodCheckIn
            onCheckIn={checkInMood}
            currentMood={bond.currentMood}
            lastCheckIn={bond.lastMoodCheckIn}
          />
          <MoodGraph moodHistory={bond.moodHistory} />
        </TabsContent>

        <TabsContent value="body" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-cyan-400">Hydration</h2>
              <HydrationQuickButton onClick={() => setShowHydration(true)} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-indigo-400">Sleep</h2>
              <SleepStatusButton onClick={() => setShowSleep(true)} />
            </div>
          </div>
          <HydrationTracker
            isOpen={showHydration}
            onClose={() => setShowHydration(false)}
          />
          <SleepTracker isOpen={showSleep} onClose={() => setShowSleep(false)} />
        </TabsContent>

        <TabsContent value="mind" className="mt-0 space-y-4">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800 space-y-2">
            <h2 className="text-sm font-medium text-purple-400">
              Feeling overwhelmed?
            </h2>
            <p className="text-xs text-zinc-500">
              A short grounding ritual with your companion can help you settle.
            </p>
            <EmergencyGroundingButton onClick={() => setShowGrounding(true)} />
          </div>
          <HabitTracker
            habits={bond.habits}
            onCreateHabit={createHabit}
            onCompleteHabit={completeHabit}
            onDeleteHabit={deleteHabit}
          />
          <AnxietyAnchor
            isOpen={showGrounding}
            onClose={() => setShowGrounding(false)}
          />
        </TabsContent>

        <TabsContent value="story" className="mt-0 space-y-4">
          <InsightsPanel
            insights={insights}
            bondLevel={bond.bondLevel}
            bondPoints={bond.bondPoints}
            currentStreak={bond.patterns.currentStreak}
            totalDaysTogether={totalDaysTogether}
          />
          <MemoryTimeline
            moments={memory.moments}
            onPinMoment={pinMoment}
            maxItems={20}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="bg-zinc-900/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-zinc-800 space-y-2">
            <h2 className="text-sm font-medium text-zinc-300">
              Wellness preferences
            </h2>
            <p className="text-xs text-zinc-500">
              Choose which trackers are active and how your companion reminds
              you to look after yourself.
            </p>
            <WellnessSettingsButton onClick={() => setShowSettings(true)} />
          </div>
          <WellnessSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
