/**
 * The Site Library — one catalog of every destination in the app,
 * organised into shelves like a library instead of a labyrinth.
 *
 * Everything that lists or maps routes (home library, navigator wheel,
 * bottom nav) reads from here, so the map can never drift from the territory.
 */

import {
  Dna,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  PawPrint,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface LibraryEntry {
  href: string;
  label: string;
  description: string;
  /** Shown on the teacher-mode home too. */
  teacherVisible?: boolean;
}

export interface LibraryShelf {
  id: "companion" | "arcade" | "discovery" | "studio" | "school" | "support";
  title: string;
  blurb: string;
  accent: string;
  icon: LucideIcon;
  entries: LibraryEntry[];
}

export const LIBRARY_SHELVES: LibraryShelf[] = [
  {
    id: "companion",
    title: "Companion",
    blurb: "Meet, care for, and grow your meta-pet.",
    accent: "#34d399",
    icon: PawPrint,
    entries: [
      {
        href: "/pet",
        label: "Auralia",
        description: "Your companion's home — bond, care, whisper, and play.",
        teacherVisible: true,
      },
      {
        href: "/app/pet",
        label: "Care Dashboard",
        description: "Compact care view with live vitals and quick actions.",
      },
      {
        href: "/visualizer",
        label: "Style Studio",
        description: "Cosmetics, auras, and looks for your companion.",
      },
      {
        href: "/share",
        label: "Rewards & Share",
        description: "Milestone rewards and safe share cards.",
      },
      {
        href: "/identity",
        label: "Identity Vault",
        description: "Local-first owner identity and your PrimeTail crest.",
      },
    ],
  },
  {
    id: "arcade",
    title: "Arcade & Play",
    blurb: "Games that feed XP, vitals, and evolution back to your pet.",
    accent: "#f472b6",
    icon: Gamepad2,
    entries: [
      {
        href: "/app/activities",
        label: "Conscious Arcade",
        description:
          "Memory Shuffle, Rhythm Pulse, Sigil Sequence, and the Vimana Tetris Field — plus battle, style, and achievements.",
      },
      {
        href: "/app/battle",
        label: "Battle Arena",
        description: "Duel the eight consciousness opponents.",
      },
      {
        href: "/monkey-invaders",
        label: "Monkey Invaders",
        description: "Retro wave shooter starring the troop.",
      },
      {
        href: "/space-jewbles",
        label: "Space Jewbles",
        description: "Gem-matching runs through deep space.",
      },
    ],
  },
  {
    id: "discovery",
    title: "DNA & Discovery",
    blurb: "Read, hear, and explore the three-strand genome.",
    accent: "#a78bfa",
    icon: Dna,
    entries: [
      {
        href: "/digital-dna",
        label: "Digital DNA Hub",
        description: "Read your pet's three-strand genome and take an imprint.",
      },
      {
        href: "/genome-explorer",
        label: "Genome Explorer",
        description: "Walk the 60-digit strands trait by trait.",
      },
      {
        href: "/genome-resonance",
        label: "Genome Resonance",
        description: "Behavioral signals emerging from the genome.",
      },
      {
        href: "/dna-hub",
        label: "DNA Music Hub",
        description: "Hear the genome — helix instruments and strand songs.",
      },
      {
        href: "/geometry-sound",
        label: "Geometry & Sound",
        description: "Sacred geometry made audible.",
      },
      {
        href: "/lineage-demo",
        label: "Lineage Hall",
        description: "Family trees, blazons, and breeding lines.",
      },
      {
        href: "/app/genome",
        label: "Genome Summary",
        description: "The active genome and traits in a readable summary.",
      },
    ],
  },
  {
    id: "studio",
    title: "Studio & Tools",
    blurb: "The workbenches and instruments behind the world.",
    accent: "#22d3ee",
    icon: FlaskConical,
    entries: [
      {
        href: "/moss60",
        label: "MOSS60 Studio",
        description: "The visual and cryptographic workspace behind the pet.",
      },
      {
        href: "/app/moss60",
        label: "MOSS60 Lab",
        description: "Quick lab view of the MOSS60 workspace.",
      },
      {
        href: "/alchemest",
        label: "Alchemest Studio",
        description: "Practical element-reaction experiments.",
      },
      {
        href: "/qr-messaging",
        label: "QR Messaging",
        description: "Signed, offline QR message passing.",
      },
      {
        href: "/compass",
        label: "Time Compass",
        description: "The time-calculator compass instrument.",
      },
      {
        href: "/addons-demo",
        label: "Addon Gallery",
        description: "Browse the signed addon collection.",
      },
      {
        href: "/scaffold",
        label: "Explorer's Scaffold",
        description: "The deep systems map for tinkerers — everything wired together.",
      },
    ],
  },
  {
    id: "school",
    title: "School & Family",
    blurb: "Teacher-led classroom path, parent info, and safety material.",
    accent: "#fbbf24",
    icon: GraduationCap,
    entries: [
      {
        href: "/schools",
        label: "School Pilot Pack",
        description:
          "What it is, why it's safe, classroom fit, and the pilot pathway.",
        teacherVisible: true,
      },
      {
        href: "/school-game",
        label: "Classroom Runtime",
        description: "Seven teacher-led sessions, 15–20 minutes each.",
        teacherVisible: true,
      },
      {
        href: "/schools/parents",
        label: "Parent / Carer Info",
        description: "Plain-words answers for families.",
        teacherVisible: true,
      },
      {
        href: "/schools/safeguarding",
        label: "Safeguarding",
        description: "Governance, supervision, and safety commitments.",
        teacherVisible: true,
      },
      {
        href: "/legal/privacy",
        label: "Privacy",
        description: "Local-first storage, no trackers, deletion controls.",
        teacherVisible: true,
      },
      {
        href: "/legal",
        label: "Legal & Boundaries",
        description: "The full legal, safety, and boundaries pack.",
        teacherVisible: true,
      },
    ],
  },
  {
    id: "support",
    title: "Shop & Support",
    blurb: "Support the project and unlock extras.",
    accent: "#94a3b8",
    icon: ShoppingBag,
    entries: [
      {
        href: "/shop",
        label: "Shop",
        description: "Addons, cosmetics, and supporter packs.",
      },
      {
        href: "/pricing",
        label: "Pricing & Plans",
        description: "What's free, what's supporter-tier, and why.",
        teacherVisible: true,
      },
    ],
  },
];

export const getShelf = (id: LibraryShelf["id"]): LibraryShelf =>
  LIBRARY_SHELVES.find((shelf) => shelf.id === id) as LibraryShelf;

/** Every entry across all shelves, in shelf order. */
export const ALL_LIBRARY_ENTRIES: Array<LibraryEntry & { shelfId: LibraryShelf["id"] }> =
  LIBRARY_SHELVES.flatMap((shelf) =>
    shelf.entries.map((entry) => ({ ...entry, shelfId: shelf.id })),
  );
