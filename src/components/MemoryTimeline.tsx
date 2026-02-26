'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import type { Moment, MomentImportance } from '@/lib/memory';

interface MemoryTimelineProps {
  moments: Moment[];
  onPinMoment?: (momentId: string) => void;
  onAddNote?: (momentId: string, note: string) => void;
  maxItems?: number;
  className?: string;
}

const IMPORTANCE_ICONS: Record<MomentImportance, string> = {
  minor: '',
  notable: '',
  significant: '',
  milestone: '',
};

const IMPORTANCE_STYLES: Record<MomentImportance, string> = {
  minor: 'border-l-gray-300 dark:border-l-gray-600',
  notable: 'border-l-blue-400 dark:border-l-blue-500',
  significant: 'border-l-purple-400 dark:border-l-purple-500',
  milestone: 'border-l-amber-400 dark:border-l-amber-500',
};

const TYPE_ICONS: Record<string, string> = {
  first_meeting: '',
  first_feed: '',
  first_play: '',
  evolution: '',
  achievement: '',
  streak_milestone: '',
  breeding: '',
  bond_level_up: '',
  mood_checkin: '',
  habit_completed: '',
  note: '',
  photo_moment: '',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MemoryTimeline({
  moments,
  onPinMoment,
  onAddNote,
  maxItems = 20,
  className,
}: MemoryTimelineProps) {
  const [selectedMoment, setSelectedMoment] = React.useState<string | null>(null);
  const [noteInput, setNoteInput] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);

  // Group moments by date
  const groupedMoments = React.useMemo(() => {
    const groups = new Map<string, Moment[]>();
    const sorted = [...moments].sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems);

    for (const moment of sorted) {
      const dateKey = formatDate(moment.timestamp);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(moment);
    }

    return groups;
  }, [moments, maxItems]);

  const handleSaveNote = (momentId: string) => {
    if (noteInput.trim() && onAddNote) {
      onAddNote(momentId, noteInput.trim());
    }
    setEditingNoteId(null);
    setNoteInput('');
  };

  if (moments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <span className="text-4xl block mb-2"></span>
            <p>Your memories will appear here as you spend time together</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span></span>
          Your Journey
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {moments.length} memories
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-6">
          {Array.from(groupedMoments.entries()).map(([dateKey, dateMoments]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-card py-1">
                {dateKey}
              </div>

              {/* Moments for this date */}
              <div className="space-y-2 pl-2">
                {dateMoments.map((moment) => (
                  <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'border-l-2 pl-4 py-2 relative cursor-pointer hover:bg-muted/50 rounded-r-lg transition-colors',
                      IMPORTANCE_STYLES[moment.importance],
                      selectedMoment === moment.id && 'bg-muted/50'
                    )}
                    onClick={() => setSelectedMoment(
                      selectedMoment === moment.id ? null : moment.id
                    )}
                  >
                    {/* Dot indicator */}
                    <div
                      className={cn(
                        'absolute left-[-5px] top-3 w-2 h-2 rounded-full',
                        moment.importance === 'milestone'
                          ? 'bg-amber-500'
                          : moment.importance === 'significant'
                          ? 'bg-purple-500'
                          : moment.importance === 'notable'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      )}
                    />

                    {/* Content */}
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {TYPE_ICONS[moment.type] || ''}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {moment.title}
                          </span>
                          {moment.pinned && (
                            <span className="text-amber-500" title="Pinned">

                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {formatTime(moment.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {moment.description}
                        </p>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {selectedMoment === moment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t"
                        >
                          <p className="text-sm mb-3">{moment.description}</p>

                          {/* User note */}
                          {moment.userNote && editingNoteId !== moment.id && (
                            <div className="bg-muted/50 rounded-lg p-2 mb-3 text-sm italic">
                              "{moment.userNote}"
                            </div>
                          )}

                          {/* Note editing */}
                          {editingNoteId === moment.id && (
                            <div className="mb-3">
                              <textarea
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                placeholder="Add your reflection..."
                                className="w-full p-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                rows={2}
                                maxLength={200}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNoteId(null);
                                    setNoteInput('');
                                  }}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveNote(moment.id);
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 text-xs">
                            {onPinMoment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPinMoment(moment.id);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {moment.pinned ? ' Unpin' : ' Pin'}
                              </button>
                            )}
                            {onAddNote && editingNoteId !== moment.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteInput(moment.userNote || '');
                                  setEditingNoteId(moment.id);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {moment.userNote ? ' Edit note' : ' Add note'}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
