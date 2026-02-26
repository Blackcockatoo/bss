'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import type { Insight, WeeklySummary } from '@/lib/insights';
import type { BondLevel } from '@/lib/bond';

interface InsightsPanelProps {
  insights: Insight[];
  bondLevel?: BondLevel;
  bondPoints?: number;
  currentStreak?: number;
  totalDaysTogether?: number;
  className?: string;
}

const BOND_LEVEL_INFO: Record<BondLevel, { label: string; color: string; progress: number }> = {
  stranger: { label: 'Stranger', color: 'bg-gray-400', progress: 0 },
  acquaintance: { label: 'Acquaintance', color: 'bg-blue-400', progress: 20 },
  companion: { label: 'Companion', color: 'bg-purple-400', progress: 40 },
  friend: { label: 'Friend', color: 'bg-pink-400', progress: 70 },
  soulmate: { label: 'Soulmate', color: 'bg-amber-400', progress: 100 },
};

export function InsightsPanel({
  insights,
  bondLevel = 'stranger',
  bondPoints = 0,
  currentStreak = 0,
  totalDaysTogether = 0,
  className,
}: InsightsPanelProps) {
  const bondInfo = BOND_LEVEL_INFO[bondLevel];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span></span>
          Insights
        </CardTitle>
        <CardDescription>What your companion has learned about you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bond status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bond Level</span>
            <span className="font-medium">{bondInfo.label}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', bondInfo.color)}
              initial={{ width: 0 }}
              animate={{ width: `${bondInfo.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{bondPoints} bond points</span>
            <span>{totalDaysTogether} days together</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-2xl block">{currentStreak}</span>
            <span className="text-xs text-muted-foreground">Day streak</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-2xl block">{totalDaysTogether}</span>
            <span className="text-xs text-muted-foreground">Days total</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-2xl block">{bondPoints}</span>
            <span className="text-xs text-muted-foreground">Bond pts</span>
          </div>
        </div>

        {/* Insights list */}
        {insights.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Observations</h4>
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  insight.priority >= 4 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                )}
              >
                <span className="text-lg flex-shrink-0">{insight.icon || ''}</span>
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>Keep interacting to unlock insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WeeklySummaryPanelProps {
  summary: WeeklySummary;
  className?: string;
}

export function WeeklySummaryPanel({ summary, className }: WeeklySummaryPanelProps) {
  const moodTrendEmoji = {
    improving: '',
    declining: '',
    stable: '',
    unknown: '',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span></span>
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span>{summary.totalVisits}</span>
              <span className="text-xs text-muted-foreground">visits</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span>{moodTrendEmoji[summary.moodTrend]}</span>
              <span className="text-xs text-muted-foreground capitalize">{summary.moodTrend}</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span>{summary.habitsCompleted}</span>
              <span className="text-xs text-muted-foreground">habits done</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span>+{summary.bondPointsGained}</span>
              <span className="text-xs text-muted-foreground">bond pts</span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        {summary.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Highlights</h4>
            <ul className="space-y-1">
              {summary.highlights.map((highlight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-500"></span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top insights */}
        {summary.insights.slice(0, 2).map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-2 text-sm"
          >
            <span>{insight.icon}</span>
            <span className="text-muted-foreground">{insight.description}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
