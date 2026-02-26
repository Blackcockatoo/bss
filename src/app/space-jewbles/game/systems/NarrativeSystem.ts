import {
  STORY_BEATS,
  BOSS_DIALOGUE,
  UPGRADE_DIALOGUE,
  CONTEXTUAL_STORY_BEATS,
  StoryBeat,
  ContextualStoryBeat,
  NarrativeTrigger,
} from '../data/storyBeats';

export interface NarrativeContext {
  petTraits?: {
    bodyType?: string;
    pattern?: string;
    elements?: string[];
  };
  performance?: {
    bossCount?: number;
    lastUpgradeId?: string;
    upgradesUnlocked?: string[];
    maxCombo?: number;
  };
}

export class NarrativeSystem {
  private seenStories: Set<string> = new Set();
  private storyQueue: StoryBeat[] = [];
  private onStoryTriggered?: (story: StoryBeat) => void;
  private context: NarrativeContext = {};

  constructor() {
    // Load seen stories from localStorage
    this.loadSeenStories();
  }

  /**
   * Set callback for when a story should be displayed
   */
  setStoryCallback(callback: (story: StoryBeat) => void): void {
    this.onStoryTriggered = callback;
  }

  /**
   * Set full narrative context for contextual story selection
   */
  setContext(context: NarrativeContext): void {
    this.context = this.mergeContext(this.context, context);
  }

  /**
   * Update narrative context with partial changes
   */
  updateContext(context: NarrativeContext): void {
    this.context = this.mergeContext(this.context, context);
  }

  /**
   * Check if a wave should trigger a story
   */
  checkWaveStory(wave: number): void {
    const story = STORY_BEATS.find((beat) => beat.wave === wave);

    if (story && !this.seenStories.has(story.id)) {
      this.triggerStory(story);
    }
  }

  /**
   * Check contextual stories for a trigger
   */
  checkContextualStory(trigger: NarrativeTrigger, overrideContext?: NarrativeContext): void {
    const context = overrideContext ? this.mergeContext(this.context, overrideContext) : this.context;
    const candidates = CONTEXTUAL_STORY_BEATS.filter(
      (beat) => beat.trigger === trigger && !this.seenStories.has(beat.id)
    );

    const matched = candidates.find((beat) => this.matchesContext(beat, context));
    if (matched) {
      this.triggerStory(matched);
    }
  }

  /**
   * Trigger boss-specific dialogue
   */
  checkBossStory(bossCount: number): void {
    let story: StoryBeat | undefined;

    if (bossCount === 1) {
      story = BOSS_DIALOGUE.find((b) => b.id === 'boss_1');
    } else if (bossCount === 5) {
      story = BOSS_DIALOGUE.find((b) => b.id === 'boss_5');
    }

    if (story && !this.seenStories.has(story.id)) {
      this.triggerStory(story);
    }
  }

  /**
   * Trigger upgrade-specific dialogue
   */
  checkUpgradeStory(upgradeId: string): void {
    const dialogue = UPGRADE_DIALOGUE[upgradeId];

    if (dialogue && !this.seenStories.has(`upgrade_${upgradeId}`)) {
      const story: StoryBeat = {
        id: `upgrade_${upgradeId}`,
        wave: 0,
        title: 'New Power Unlocked',
        speaker: 'Mentor AI',
        lines: dialogue,
        concept: 'Upgrade Milestone',
        isImportant: true,
      };

      this.triggerStory(story);
    }
  }

  /**
   * Trigger a story to be displayed
   */
  private triggerStory(story: StoryBeat): void {
    this.seenStories.add(story.id);
    this.saveSeenStories();

    if (this.onStoryTriggered) {
      this.onStoryTriggered(story);
    }
  }

  /**
   * Get all seen stories
   */
  getSeenStories(): string[] {
    return Array.from(this.seenStories);
  }

  /**
   * Get story by ID
   */
  getStoryById(id: string): StoryBeat | undefined {
    return STORY_BEATS.find((beat) => beat.id === id) ||
           BOSS_DIALOGUE.find((beat) => beat.id === id) ||
           CONTEXTUAL_STORY_BEATS.find((beat) => beat.id === id);
  }

  /**
   * Get all unlocked stories for story log
   */
  getUnlockedStories(): StoryBeat[] {
    const unlockedStories: StoryBeat[] = [];

    STORY_BEATS.forEach((beat) => {
      if (this.seenStories.has(beat.id)) {
        unlockedStories.push(beat);
      }
    });

    BOSS_DIALOGUE.forEach((beat) => {
      if (this.seenStories.has(beat.id)) {
        unlockedStories.push(beat);
      }
    });

    CONTEXTUAL_STORY_BEATS.forEach((beat) => {
      if (this.seenStories.has(beat.id)) {
        unlockedStories.push(beat);
      }
    });

    // Add upgrade stories
    Object.keys(UPGRADE_DIALOGUE).forEach((upgradeId) => {
      const id = `upgrade_${upgradeId}`;
      if (this.seenStories.has(id)) {
        const dialogue = UPGRADE_DIALOGUE[upgradeId];
        unlockedStories.push({
          id,
          wave: 0,
          title: `Unlocked: ${upgradeId}`,
          speaker: 'Mentor AI',
          lines: dialogue,
          concept: 'Upgrade',
          isImportant: false,
        });
      }
    });

    return unlockedStories.sort((a, b) => a.wave - b.wave);
  }

  /**
   * Get progress percentage
   */
  getProgress(): { seen: number; total: number; percent: number } {
    const total = STORY_BEATS.length + BOSS_DIALOGUE.length + CONTEXTUAL_STORY_BEATS.length;
    const seen = this.getUnlockedStories().length;

    return {
      seen,
      total,
      percent: Math.floor((seen / total) * 100),
    };
  }

  /**
   * Save seen stories to localStorage
   */
  private saveSeenStories(): void {
    try {
      const data = Array.from(this.seenStories);
      localStorage.setItem('space-jewbles-stories', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save seen stories:', error);
    }
  }

  /**
   * Load seen stories from localStorage
   */
  private loadSeenStories(): void {
    try {
      const savedData = localStorage.getItem('space-jewbles-stories');
      if (savedData) {
        const data = JSON.parse(savedData) as string[];
        this.seenStories = new Set(data);
      }
    } catch (error) {
      console.error('Failed to load seen stories:', error);
    }
  }

  /**
   * Reset all seen stories (for testing)
   */
  resetStories(): void {
    this.seenStories.clear();
    this.saveSeenStories();
  }

  private matchesContext(beat: ContextualStoryBeat, context: NarrativeContext): boolean {
    const requirements = beat.requirements;
    if (!requirements) {
      return true;
    }

    const petTraits = context.petTraits ?? {};
    const performance = context.performance ?? {};

    if (requirements.bodyType && (!petTraits.bodyType || !requirements.bodyType.includes(petTraits.bodyType))) {
      return false;
    }

    if (requirements.pattern && (!petTraits.pattern || !requirements.pattern.includes(petTraits.pattern))) {
      return false;
    }

    if (requirements.elements) {
      const elements = petTraits.elements ?? [];
      const hasElement = requirements.elements.some((element) => elements.includes(element));
      if (!hasElement) {
        return false;
      }
    }

    if (requirements.upgradeIds) {
      const lastUpgrade = performance.lastUpgradeId;
      const unlocked = performance.upgradesUnlocked ?? [];
      const matchesUpgrade = requirements.upgradeIds.some(
        (upgradeId) => upgradeId === lastUpgrade || unlocked.includes(upgradeId)
      );
      if (!matchesUpgrade) {
        return false;
      }
    }

    if (requirements.bossCount !== undefined && performance.bossCount !== requirements.bossCount) {
      return false;
    }

    if (requirements.minCombo !== undefined && (performance.maxCombo ?? 0) < requirements.minCombo) {
      return false;
    }

    return true;
  }

  private mergeContext(base: NarrativeContext, update: NarrativeContext): NarrativeContext {
    return {
      ...base,
      ...update,
      petTraits: {
        ...base.petTraits,
        ...update.petTraits,
      },
      performance: {
        ...base.performance,
        ...update.performance,
      },
    };
  }
}
