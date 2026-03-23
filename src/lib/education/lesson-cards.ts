import type { EngagementCategory } from "./engagement";
import type { CurriculumFitTag } from "./curriculum-fit";
import type { DnaMode, FocusArea } from "./types";

export interface LessonStep {
  order: number;
  durationMinutes: number;
  instruction: string;
  teacherSays: string | null;
  studentAction: string;
}

export interface ScriptedLessonCard {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  pillar: string;
  dnaMode: DnaMode;
  focusArea: FocusArea;
  engagementCategory: EngagementCategory;
  curriculumFit: CurriculumFitTag[];
  steps: LessonStep[];
  prePrompt: string;
  postPrompt: string;
  rubricCriteria: string[];
  safetyNote: string;
}

export const SCRIPTED_LESSONS: ScriptedLessonCard[] = [
  {
    id: "lesson-1-meet-your-pattern",
    number: 1,
    title: "Meet Your Pattern",
    subtitle: "Observe a spiral pattern and describe what you notice.",
    durationMinutes: 15,
    pillar: "Pattern Detective",
    dnaMode: "spiral",
    focusArea: "pattern-recognition",
    engagementCategory: "learning",
    curriculumFit: ["stem", "relief-teaching", "end-of-week"],
    prePrompt: "What do you think a pattern is? Can you give an example?",
    postPrompt: "What surprised you about the pattern you saw?",
    rubricCriteria: ["Observation accuracy", "Evidence citation", "Curiosity"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Project the screen. Open the Spiral DNA mode.",
        teacherSays: "Today we're going to look at a pattern together. Watch the screen carefully.",
        studentAction: "Watch the projected screen.",
      },
      {
        order: 2,
        durationMinutes: 3,
        instruction: "Let the spiral run. Ask the pre-prompt question aloud.",
        teacherSays: "What do you think a pattern is? Can anyone give me an example from real life?",
        studentAction: "Respond aloud or in pairs.",
      },
      {
        order: 3,
        durationMinutes: 5,
        instruction: "Let students observe the spiral on their own devices (or projected).",
        teacherSays: "Now look closely. Count how many times the shape repeats. Notice the colours.",
        studentAction: "Observe and count silently. Note one thing that surprises them.",
      },
      {
        order: 4,
        durationMinutes: 3,
        instruction: "Bring the class back together for sharing.",
        teacherSays: "Hands up — what did you notice? What surprised you?",
        studentAction: "Share observations with the class.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Wrap up with the post-prompt.",
        teacherSays: "Great observations. Patterns are everywhere — in nature, maths, and music. Well done.",
        studentAction: "Listen and reflect.",
      },
    ],
  },
  {
    id: "lesson-2-team-decode",
    number: 2,
    title: "Team Decode",
    subtitle: "Work in small groups to decode a particle pattern together.",
    durationMinutes: 20,
    pillar: "Team Story Builder",
    dnaMode: "particles",
    focusArea: "collaboration",
    engagementCategory: "learning",
    curriculumFit: ["stem", "sel", "digital-literacy"],
    prePrompt: "What patterns might appear if we compare two views side by side?",
    postPrompt: "What did your group agree on? What did you disagree on?",
    rubricCriteria: ["Collaboration", "Pattern reasoning", "Communication clarity"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Split class into groups of 3-4. Open the Particles DNA mode.",
        teacherSays: "Get into your groups. Each group will decode a pattern together.",
        studentAction: "Form groups and settle.",
      },
      {
        order: 2,
        durationMinutes: 3,
        instruction: "Show the particle pattern on screen. Ask the pre-prompt.",
        teacherSays: "Look at the particles moving. What patterns might appear if we compare two views?",
        studentAction: "Discuss briefly in groups.",
      },
      {
        order: 3,
        durationMinutes: 8,
        instruction: "Groups observe the particles and record 3 things they notice.",
        teacherSays: "You have 8 minutes. Write down 3 things your group notices about the pattern.",
        studentAction: "Observe, discuss, and write down 3 observations.",
      },
      {
        order: 4,
        durationMinutes: 5,
        instruction: "Each group shares one observation. No repeats allowed.",
        teacherSays: "Each group, share your best observation. Try not to repeat what another group said.",
        studentAction: "Share one observation per group.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Wrap up and reflect.",
        teacherSays: "Did your group agree on everything? What was the hardest part of working together?",
        studentAction: "Quick reflection aloud.",
      },
    ],
  },
  {
    id: "lesson-3-calm-checkin",
    number: 3,
    title: "Calm Check-In",
    subtitle: "Use a guided journey to reflect on how you feel today.",
    durationMinutes: 15,
    pillar: "Reflection Checkpoint",
    dnaMode: "journey",
    focusArea: "reflection",
    engagementCategory: "mindfulness-regulation",
    curriculumFit: ["wellbeing", "sel", "relief-teaching"],
    prePrompt: "On a scale of 1-5, how are you feeling right now?",
    postPrompt: "Did anything change after watching the journey? What did you notice?",
    rubricCriteria: ["Self-awareness", "Reflection depth", "Respectful sharing"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Ask students to sit comfortably. Open the Journey DNA mode.",
        teacherSays: "Let's take a moment to check in. Sit comfortably and take a deep breath.",
        studentAction: "Settle and breathe.",
      },
      {
        order: 2,
        durationMinutes: 2,
        instruction: "Ask the pre-prompt.",
        teacherSays: "On a scale of 1 to 5, how are you feeling right now? Just think about it — no need to share yet.",
        studentAction: "Reflect silently.",
      },
      {
        order: 3,
        durationMinutes: 5,
        instruction: "Play the journey visualisation. Let it run without interruption.",
        teacherSays: "Watch the screen. Notice the colours and movement. Just observe.",
        studentAction: "Watch the journey in silence.",
      },
      {
        order: 4,
        durationMinutes: 4,
        instruction: "Pair-share reflection.",
        teacherSays: "Turn to the person next to you. Did anything change? What did you notice?",
        studentAction: "Share with a partner.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Close the session.",
        teacherSays: "Thank you for being thoughtful. It's okay if nothing changed — noticing is the skill.",
        studentAction: "Listen.",
      },
    ],
  },
  {
    id: "lesson-4-shape-investigators",
    number: 4,
    title: "Shape Investigators",
    subtitle: "Identify and count geometric shapes in a mandala pattern.",
    durationMinutes: 20,
    pillar: "Pattern Detective",
    dnaMode: "mandala",
    focusArea: "geometry-creation",
    engagementCategory: "learning",
    curriculumFit: ["stem", "digital-literacy", "end-of-week"],
    prePrompt: "How many different shapes can you name?",
    postPrompt: "Which shape appeared most often? How did you count them?",
    rubricCriteria: ["Shape identification", "Counting accuracy", "Method explanation"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 3,
        instruction: "Open the Mandala DNA mode. Project on screen.",
        teacherSays: "Today you're shape investigators. Your job is to find and count every shape you can see.",
        studentAction: "Look at the screen.",
      },
      {
        order: 2,
        durationMinutes: 2,
        instruction: "Ask the pre-prompt to warm up.",
        teacherSays: "Quick warm-up — how many different shapes can you name? Shout them out.",
        studentAction: "Call out shape names.",
      },
      {
        order: 3,
        durationMinutes: 8,
        instruction: "Students investigate the mandala. They record shapes and counts.",
        teacherSays: "You have 8 minutes. List every shape you can find and how many times it appears.",
        studentAction: "Observe, identify shapes, and tally counts.",
      },
      {
        order: 4,
        durationMinutes: 5,
        instruction: "Share findings. Compare counts across the class.",
        teacherSays: "Who found the most shapes? Did anyone find one that nobody else noticed?",
        studentAction: "Share counts and compare.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Wrap up with the post-prompt.",
        teacherSays: "Which shape appeared most often? How did you count them — any tricks?",
        studentAction: "Reflect on their method.",
      },
    ],
  },
  {
    id: "lesson-5-story-relay",
    number: 5,
    title: "Story Relay",
    subtitle: "Build a group story inspired by particle movements.",
    durationMinutes: 20,
    pillar: "Team Story Builder",
    dnaMode: "particles",
    focusArea: "collaboration",
    engagementCategory: "learning",
    curriculumFit: ["sel", "end-of-week", "relief-teaching"],
    prePrompt: "If a particle could talk, what would it say?",
    postPrompt: "How did your story change when someone else added to it?",
    rubricCriteria: ["Creative contribution", "Active listening", "Story coherence"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Open the Particles DNA mode. Split into groups of 4-5.",
        teacherSays: "We're going to build a story together. Each person adds one sentence at a time.",
        studentAction: "Form groups.",
      },
      {
        order: 2,
        durationMinutes: 3,
        instruction: "Show the particles. Ask the pre-prompt.",
        teacherSays: "Watch the particles. If one of them could talk, what would it say? That's your story starter.",
        studentAction: "Watch and think of an opening sentence.",
      },
      {
        order: 3,
        durationMinutes: 8,
        instruction: "Groups take turns adding one sentence each. Go around 2-3 times.",
        teacherSays: "Person 1, start the story with one sentence. Then person 2 adds the next. Keep going around.",
        studentAction: "Take turns adding sentences.",
      },
      {
        order: 4,
        durationMinutes: 5,
        instruction: "Each group reads their story to the class.",
        teacherSays: "Time's up! Each group, read your story aloud. Listen for the funniest or most surprising twist.",
        studentAction: "Read stories aloud.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Reflect on collaboration.",
        teacherSays: "How did the story change when someone else added to it? Was that easy or hard?",
        studentAction: "Quick reflection.",
      },
    ],
  },
  {
    id: "lesson-6-sound-and-focus",
    number: 6,
    title: "Sound & Focus",
    subtitle: "Listen to generated sounds and connect them to how you feel.",
    durationMinutes: 15,
    pillar: "Reflection Checkpoint",
    dnaMode: "sound",
    focusArea: "sound-exploration",
    engagementCategory: "mindfulness-regulation",
    curriculumFit: ["wellbeing", "sel", "end-of-week"],
    prePrompt: "What sounds help you concentrate? What sounds distract you?",
    postPrompt: "Which sound felt the calmest? Why do you think that is?",
    rubricCriteria: ["Active listening", "Self-awareness", "Thoughtful comparison"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Open the Sound DNA mode. Ask students to close their eyes briefly.",
        teacherSays: "We're going to listen to some sounds. Close your eyes for a moment if you're comfortable.",
        studentAction: "Settle and prepare to listen.",
      },
      {
        order: 2,
        durationMinutes: 2,
        instruction: "Ask the pre-prompt before playing sounds.",
        teacherSays: "Before we start — what sounds help you concentrate? What sounds distract you?",
        studentAction: "Share briefly.",
      },
      {
        order: 3,
        durationMinutes: 5,
        instruction: "Play 3 different sound patterns. Pause briefly between each.",
        teacherSays: "Listen to each sound. After all three, decide which one felt the calmest to you.",
        studentAction: "Listen to each sound pattern.",
      },
      {
        order: 4,
        durationMinutes: 4,
        instruction: "Discuss in pairs, then share with class.",
        teacherSays: "Turn to your neighbour. Which sound felt the calmest? Why do you think that is?",
        studentAction: "Pair discussion, then class share.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Wrap up.",
        teacherSays: "Everyone found something different — that's normal. Knowing what helps you focus is a superpower.",
        studentAction: "Listen and reflect.",
      },
    ],
  },
  {
    id: "lesson-7-pattern-showcase",
    number: 7,
    title: "Pattern Showcase",
    subtitle: "Present your favourite pattern and explain why it's interesting.",
    durationMinutes: 20,
    pillar: "Pattern Detective",
    dnaMode: "spiral",
    focusArea: "pattern-recognition",
    engagementCategory: "learning",
    curriculumFit: ["stem", "digital-literacy", "sel"],
    prePrompt: "What's the most interesting pattern you've seen so far?",
    postPrompt: "What would you investigate next if you had more time?",
    rubricCriteria: ["Presentation clarity", "Evidence quality", "Curiosity extension"],
    safetyNote: "No chat, no internet, no accounts. Runs entirely on this device.",
    steps: [
      {
        order: 1,
        durationMinutes: 2,
        instruction: "Explain the task. Open the Spiral DNA mode as a backdrop.",
        teacherSays: "Today you're the expert. You'll pick your favourite pattern and explain why it's interesting.",
        studentAction: "Listen to instructions.",
      },
      {
        order: 2,
        durationMinutes: 5,
        instruction: "Give students time to choose and prepare a 30-second explanation.",
        teacherSays: "You have 5 minutes. Pick one pattern you've seen in any lesson. Prepare 2-3 sentences about why it's interesting.",
        studentAction: "Choose a pattern and prepare notes.",
      },
      {
        order: 3,
        durationMinutes: 8,
        instruction: "Students present in pairs or small groups. Each person gets 30-60 seconds.",
        teacherSays: "Share with your group. Listen carefully — you might hear something you missed.",
        studentAction: "Present to group, listen to others.",
      },
      {
        order: 4,
        durationMinutes: 3,
        instruction: "Volunteers share with the whole class.",
        teacherSays: "Any volunteers? Who heard something surprising from their group?",
        studentAction: "Volunteer to share.",
      },
      {
        order: 5,
        durationMinutes: 2,
        instruction: "Close with the post-prompt.",
        teacherSays: "Great work. What would you investigate next if you had more time? That curiosity is what scientists do.",
        studentAction: "Reflect.",
      },
    ],
  },
];
