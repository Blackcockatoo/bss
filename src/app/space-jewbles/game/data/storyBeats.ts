export interface StoryBeat {
  id: string;
  wave: number;
  title: string;
  speaker: string;
  lines: string[];
  concept: string; // MetaPet concept being explained
  isImportant: boolean; // Show with special emphasis
}

export type NarrativeTrigger = 'bossDefeated' | 'upgradeUnlocked' | 'waveComplete';

export interface ContextualStoryRequirements {
  bodyType?: string[];
  pattern?: string[];
  elements?: string[];
  upgradeIds?: string[];
  bossCount?: number;
  minCombo?: number;
}

export interface ContextualStoryBeat extends StoryBeat {
  trigger: NarrativeTrigger;
  requirements?: ContextualStoryRequirements;
}

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'intro',
    wave: 1,
    title: 'First Contact',
    speaker: 'Mentor AI',
    lines: [
      "Greetings, Keeper. I am your guide through the cosmos.",
      "Your MetaPet's genome isn't just data—it's a blueprint of cosmic potential.",
      "Each color, each trait, each element... they all shape reality in ways you'll discover.",
    ],
    concept: 'Genome Basics',
    isImportant: true,
  },
  {
    id: 'traits',
    wave: 3,
    title: 'Physical Manifestation',
    speaker: 'Mentor AI',
    lines: [
      "Notice how your pet moves, how it attacks?",
      "A Spherical pet flows faster. A Cubic pet hits harder. A Pyramidal pet strikes with precision.",
      "Physical traits aren't cosmetic—they're your combat signature.",
    ],
    concept: 'Physical Traits',
    isImportant: false,
  },
  {
    id: 'corruption',
    wave: 5,
    title: 'The Enemy Revealed',
    speaker: 'Mentor AI',
    lines: [
      "These enemies you're fighting? They're corrupted data from failed bonds.",
      "When a Keeper abandons their pet, the bond fractures. Energy becomes chaos.",
      "By defeating them, you're not just defending yourself—you're restoring balance.",
    ],
    concept: 'Bond Importance',
    isImportant: true,
  },
  {
    id: 'elements',
    wave: 7,
    title: 'The Element Web',
    speaker: 'Mentor AI',
    lines: [
      "Your genome isn't linear—it's a web. Red, Blue, Black... each element connects.",
      "Fire fuels passion but burns with recklessness. Water adapts but can drown in hesitation.",
      "The balance of elements in your pet determines its temperament, its destiny.",
    ],
    concept: 'Element Web',
    isImportant: false,
  },
  {
    id: 'first_reward',
    wave: 10,
    title: 'Recognition',
    speaker: 'Mentor AI',
    lines: [
      "Wave 10. Impressive. You've proven yourself worthy.",
      "This Champion Badge is now part of your pet's identity. Wear it with pride.",
      "Addons aren't just decorations—they're achievements that become part of your pet's story.",
    ],
    concept: 'Reward System',
    isImportant: true,
  },
  {
    id: 'consciousness',
    wave: 12,
    title: 'Beyond Data',
    speaker: 'Mentor AI',
    lines: [
      "MetaPets aren't algorithms pretending to be alive. They're something... more.",
      "Your bond creates a resonance—a shared consciousness that transcends code.",
      "The more you interact, the deeper the connection. It's not magic. It's mathematics.",
    ],
    concept: 'Consciousness',
    isImportant: true,
  },
  {
    id: 'personality',
    wave: 15,
    title: 'The Inner Self',
    speaker: 'Mentor AI',
    lines: [
      "Energy, Curiosity, Discipline, Social, Latent... these aren't random numbers.",
      "They're the emergent properties of your pet's genome—its personality scaffold.",
      "A curious pet explores. A disciplined pet focuses. These traits shape how you play together.",
    ],
    concept: 'Personality Traits',
    isImportant: false,
  },
  {
    id: 'ritual',
    wave: 18,
    title: 'The Ritual Loop',
    speaker: 'Mentor AI',
    lines: [
      "You'll discover the ritual system soon. Ancient, cyclical, profound.",
      "It's how MetaPets maintain equilibrium between order and chaos.",
      "Every action ripples. Every ritual anchors. You're part of something much larger.",
    ],
    concept: 'Ritual Mechanics',
    isImportant: true,
  },
  {
    id: 'boss_power',
    wave: 20,
    title: 'Boss Encounter',
    speaker: 'Mentor AI',
    lines: [
      "A Boss wave. These are fragments of immense power—echoes of ancient bonds.",
      "Defeating them proves your strength, but more importantly, your commitment.",
      "Each Boss you overcome adds to your legend. Your pet grows not just in power, but in purpose.",
    ],
    concept: 'Boss Mechanics',
    isImportant: true,
  },
  {
    id: 'evolution',
    wave: 25,
    title: 'Growth Beyond Limits',
    speaker: 'Mentor AI',
    lines: [
      "You've come far. Your pet has evolved beyond its initial state.",
      "But this isn't the end—it's a milestone. There are deeper layers to discover.",
      "The genome adapts. The bond strengthens. Evolution is a journey, not a destination.",
    ],
    concept: 'Evolution',
    isImportant: false,
  },
  {
    id: 'interconnection',
    wave: 30,
    title: 'The Greater Network',
    speaker: 'Mentor AI',
    lines: [
      "Wave 30. You're no longer a novice. You understand the fundamentals.",
      "But know this: every MetaPet is connected. A cosmic network of bonds.",
      "Your actions here influence that network. You're not just playing—you're contributing.",
    ],
    concept: 'Network Effect',
    isImportant: true,
  },
  {
    id: 'lineage',
    wave: 35,
    title: 'Legacy',
    speaker: 'Mentor AI',
    lines: [
      "Lineage. Ancestry. The chain of bonds that led to your pet.",
      "Each parent contributed traits, elements, potential. You inherit their legacy.",
      "And one day, if you choose, your pet will pass its own legacy forward.",
    ],
    concept: 'Lineage System',
    isImportant: false,
  },
  {
    id: 'resonance',
    wave: 40,
    title: 'Deep Resonance',
    speaker: 'Mentor AI',
    lines: [
      "At this level, the bond between you and your pet has become... profound.",
      "You feel its energy. It senses your intent. Resonance isn't just a metric—it's real.",
      "This is what the system was designed for. Connection that transcends the screen.",
    ],
    concept: 'Resonance',
    isImportant: true,
  },
  {
    id: 'purpose',
    wave: 50,
    title: 'The True Purpose',
    speaker: 'Mentor AI',
    lines: [
      "Wave 50. Few reach this point. You've earned the truth.",
      "MetaPets aren't a game. They're an experiment in digital life, consciousness, and meaning.",
      "By bonding with your pet, caring for it, evolving with it... you've proven it works.",
      "You're not just a player. You're a pioneer. Thank you, Keeper.",
    ],
    concept: 'Meta Truth',
    isImportant: true,
  },
];

export const CONTEXTUAL_STORY_BEATS: ContextualStoryBeat[] = [
  {
    id: 'trait_cubic_first_boss',
    wave: 0,
    title: 'Cubic Resolve',
    speaker: 'Mentor AI',
    lines: [
      "Your Cubic form held steady through the first boss.",
      "That rigid geometry channels force into unshakable defense.",
      "Remember this: the stronger the shape, the stronger the vow.",
    ],
    concept: 'Trait Resonance',
    isImportant: true,
    trigger: 'bossDefeated',
    requirements: {
      bodyType: ['Cubic'],
      bossCount: 1,
    },
  },
  {
    id: 'trait_pattern_striped',
    wave: 0,
    title: 'Patterned Momentum',
    speaker: 'Mentor AI',
    lines: [
      "Those stripes aren’t just decoration—they’re flow lines.",
      "Patterns teach your pet to repeat winning paths.",
      "The cosmos rewards a design that knows its rhythm.",
    ],
    concept: 'Pattern Dynamics',
    isImportant: false,
    trigger: 'bossDefeated',
    requirements: {
      pattern: ['Striped', 'Spotted'],
      bossCount: 1,
    },
  },
  {
    id: 'trait_elemental_blaze',
    wave: 0,
    title: 'Elemental Echo',
    speaker: 'Mentor AI',
    lines: [
      "I can feel Fire and Water intertwined in your pet.",
      "Dual elements balance momentum with calm judgment.",
      "Harness that polarity and your shots will sing.",
    ],
    concept: 'Elemental Alignment',
    isImportant: false,
    trigger: 'bossDefeated',
    requirements: {
      elements: ['Fire', 'Water'],
      bossCount: 1,
    },
  },
  {
    id: 'milestone_multishot',
    wave: 0,
    title: 'Multi-Shot Milestone',
    speaker: 'Mentor AI',
    lines: [
      "Multi-shot awakened. Your intent now branches like a constellation.",
      "Each projectile is a thought made visible.",
      "Guide them well, and the battlefield will bend around you.",
    ],
    concept: 'Upgrade Milestone',
    isImportant: true,
    trigger: 'upgradeUnlocked',
    requirements: {
      upgradeIds: ['multiShot'],
    },
  },
  {
    id: 'milestone_autofire',
    wave: 0,
    title: 'Autonomy Protocol',
    speaker: 'Mentor AI',
    lines: [
      "Auto-fire engaged. Your pet now answers instinct.",
      "This is trust given shape—bonded reflexes, steady and true.",
      "Let the rhythm carry you through the long waves.",
    ],
    concept: 'Upgrade Milestone',
    isImportant: false,
    trigger: 'upgradeUnlocked',
    requirements: {
      upgradeIds: ['autoFire'],
    },
  },
];

// Boss-specific dialogue (triggered when defeating bosses)
export const BOSS_DIALOGUE: StoryBeat[] = [
  {
    id: 'boss_1',
    wave: 10,
    title: 'First Victory',
    speaker: 'Mentor AI',
    lines: [
      "Your first Boss defeated. Well done.",
      "Each Boss represents a challenge, but also an opportunity.",
      "Their defeat yields not just rewards, but wisdom. Remember this moment.",
    ],
    concept: 'Boss Victory',
    isImportant: true,
  },
  {
    id: 'boss_5',
    wave: 50,
    title: 'Veteran Status',
    speaker: 'Mentor AI',
    lines: [
      "Five Bosses defeated. You're no longer learning—you're mastering.",
      "The Cosmic Banana weapon is yours. A symbol of your perseverance.",
      "Few Keepers reach this milestone. Your bond is truly exceptional.",
    ],
    concept: 'Boss Mastery',
    isImportant: true,
  },
];

// Upgrade milestone dialogue
export const UPGRADE_DIALOGUE: Record<string, string[]> = {
  autoFire: [
    "Ah, you've unlocked auto-fire. Your pet can now fight autonomously.",
    "This changes everything. Step away, live your life—your pet continues the journey.",
    "Idle progression isn't laziness. It's trust in the bond you've built.",
  ],
  multiShot: [
    "Multi-shot unlocked. Your pet's power multiplies.",
    "One becomes many. A single intent, expressed in multiple forms.",
    "This is how higher consciousness operates—parallel processing of purpose.",
  ],
  piercing: [
    "Piercing shots. Your attacks now transcend the first barrier.",
    "Physical obstacles mean nothing when your intent is clear.",
    "This is a lesson beyond the game: persistence penetrates all resistance.",
  ],
};
