/**
 * MetaPet School — the seven runnable lesson definitions.
 *
 * Identity (number, id, slug, title, learning intention, teacher introduction,
 * reflection prompt, movement moment, stopping point, light evidence) comes
 * from {@link CANONICAL_SESSIONS}. This file supplies only what the Lesson
 * Runner needs on top of that: which classroom activity mounts, which evidence
 * shape is captured, and the five guided steps.
 *
 * Splitting it this way is the whole point. The marketing page, the printable
 * fallback and the runner all read the same seven titles, so a teacher cannot
 * be shown one sequence and handed another.
 *
 * Every lesson keeps the same five-phase step contract
 * (introduce → observe → interact → discuss → complete) so the shared Runner
 * drives all seven without per-lesson branching.
 */

import {
  CANONICAL_SESSIONS,
  type CanonicalSession,
} from "@/lib/schools/canonicalSequence";

import type {
  LessonActivityType,
  LessonDefinition,
  LessonEvidenceType,
  LessonFeatureFlag,
  LessonId,
  LessonStepDefinition,
  LessonStepKind,
} from "./types";

/** Canonical order of the five phases every lesson moves through. */
const STEP_KINDS: LessonStepKind[] = [
  "introduce",
  "observe",
  "interact",
  "discuss",
  "complete",
];

interface StepCopy {
  title: string;
  teacherPrompt: string;
  studentTask: string;
  whatDoINow: string;
  expectedOutcome: string;
}

/**
 * The runner-facing half of a lesson. Anything a teacher, parent or reviewer
 * reads about the sequence lives in the canonical session instead.
 */
interface LessonRuntimeSpec {
  id: LessonId;
  /** Which classroom activity component mounts (see the activity registry). */
  activityType: LessonActivityType;
  evidenceType: LessonEvidenceType;
  requiredFeatureFlags: LessonFeatureFlag[];
  learningAreas: string[];
  successCriteria: string[];
  teacherScript: string;
  studentInstructions: string;
  shortDescription: string;
  discussionPrompts: string[];
  completionMessage: string;
  extensionActivity: string;
  supportActivity: string;
  mainIdea: string;
  majorInteraction: string;
  expectedOutcome: string;
  steps: StepCopy[];
}

function buildSteps(
  lessonId: LessonId,
  phases: StepCopy[],
): LessonStepDefinition[] {
  return phases.map((phase, index) => ({
    id: `${lessonId}-step-${index + 1}`,
    order: index + 1,
    kind: STEP_KINDS[index],
    ...phase,
  }));
}

/**
 * Field Mode never touches a student's own companion and never persists a
 * change past the bell. Every lesson runs on the shared demonstration pet and
 * resets when it completes, which is what the privacy pages promise.
 */
const CLASSROOM_PET_CONTRACT = {
  usesDemonstrationPet: true,
  usesStudentRealPet: false,
  persistChanges: false,
  resetAtCompletion: true,
} as const;

const LESSON_RUNTIME: Record<LessonId, LessonRuntimeSpec> = {
  "meet-the-system": {
    id: "meet-the-system",
    activityType: "observe",
    evidenceType: "pet-observation-card",
    requiredFeatureFlags: [],
    learningAreas: ["Digital Technologies", "Oral language"],
    successCriteria: [
      "I can name one thing the system shows me.",
      "I can give the system one input.",
      "I can say what changed after my input.",
    ],
    teacherScript:
      "This is a system. It is not a video and it is not playing on its own. It waits for us to do something, and then it changes. Let's watch it, do one thing, and see what happens.",
    studentInstructions:
      "Watch the companion. Do one thing. Then say what changed.",
    shortDescription:
      "Students give a digital system one input and describe what changed.",
    discussionPrompts: [
      "What did you notice first?",
      "What changed after your input?",
      "How is this different from watching a video?",
    ],
    completionMessage:
      "You gave the system an input and described what changed. That is systems thinking.",
    extensionActivity:
      "Draw the system before and after your input, and label the change.",
    supportActivity: "Point to one thing on the screen and say one word about it.",
    mainIdea:
      "A digital system waits for an input, then changes what it shows.",
    majorInteraction:
      "Give the demonstration companion one input and watch the state change.",
    expectedOutcome:
      "Every student can complete the sentence \"I did ___ and it showed ___.\"",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"This is a system. It waits for us, then it changes.\"",
        studentTask: "Look at the screen.",
        whatDoINow: "Say the one sentence. Then press Next.",
        expectedOutcome: "The class is looking at the shared screen.",
      },
      {
        title: "Watch before touching",
        teacherPrompt: "Give ten seconds of quiet watching. No input yet.",
        studentTask: "Watch. Pick one thing you notice.",
        whatDoINow: "Count ten seconds out loud, then press Next.",
        expectedOutcome: "Each student has one observation ready.",
      },
      {
        title: "Give it one input",
        teacherPrompt: "Do one action on the shared screen. Just one.",
        studentTask: "Watch what changes.",
        whatDoINow: "Do one action, then press Next.",
        expectedOutcome: "The class has seen one input cause one change.",
      },
      {
        title: "Say what changed",
        teacherPrompt:
          "Take three answers to \"What changed after your input, and how do you know?\"",
        studentTask: "Tell your partner what changed.",
        whatDoINow: "Take three answers, then press Next.",
        expectedOutcome: "Students describe a change and their evidence for it.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say that Session One is finished and nothing carries over.",
        studentTask: "Remember the change you saw.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session One is recorded on this device.",
      },
    ],
  },
  "read-the-signals": {
    id: "read-the-signals",
    activityType: "interpret",
    evidenceType: "emotion-reflection",
    requiredFeatureFlags: ["emotions"],
    learningAreas: [
      "Digital Technologies",
      "Health and Physical Education",
      "Personal and Social capability",
    ],
    successCriteria: [
      "I can name one signal the system is showing.",
      "I can say what that signal might mean.",
      "I can name something else it could have meant.",
    ],
    teacherScript:
      "Systems give us signals — colours, shapes, movement. A signal is a clue, not a fact. Today we practise reading a clue carefully and choosing a calm next step.",
    studentInstructions:
      "Find one signal. Say what it might mean. Then choose a calm response.",
    shortDescription:
      "Students read a signal, interpret it carefully, and choose a settling response.",
    discussionPrompts: [
      "What signal did you notice?",
      "What might that signal mean?",
      "What else could it have meant?",
    ],
    completionMessage:
      "You read a signal carefully and chose a calm response. That is careful thinking.",
    extensionActivity:
      "Find three signals and give each one two possible meanings.",
    supportActivity: "Point to one signal and say one word for how it looks.",
    mainIdea:
      "A signal is a clue that can be read more than one way.",
    majorInteraction:
      "Read the demonstration companion's signals and choose a settling action.",
    expectedOutcome:
      "Students name a signal, a likely meaning, and one alternative meaning.",
    steps: [
      {
        title: "Signals are clues",
        teacherPrompt:
          "Say: \"A signal is a clue. Clues can be read more than one way.\"",
        studentTask: "Listen for the word clue.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students know a signal is not a fact.",
      },
      {
        title: "Find one signal",
        teacherPrompt: "Ask each pair to find one signal on the screen.",
        studentTask: "Find one signal. Point to it.",
        whatDoINow: "Give quiet looking time, then press Next.",
        expectedOutcome: "Every pair has identified one signal.",
      },
      {
        title: "Read it, then settle",
        teacherPrompt:
          "Three slow breaths together, then choose one settling action on screen.",
        studentTask: "Breathe three times. Then choose a calm response.",
        whatDoINow: "Do the breaths, choose one action, press Next.",
        expectedOutcome: "The class has linked a signal to a calm response.",
      },
      {
        title: "What else could it mean?",
        teacherPrompt:
          "Ask for one other thing that signal could have meant.",
        studentTask: "Say another possible meaning.",
        whatDoINow: "Take two or three answers, then press Next.",
        expectedOutcome: "Students offer an alternative reading of the signal.",
      },
      {
        title: "Stop here",
        teacherPrompt: "Say that Session Two is finished.",
        studentTask: "Remember your signal.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session Two is recorded on this device.",
      },
    ],
  },
  "one-identity-many-representations": {
    id: "one-identity-many-representations",
    activityType: "compare",
    evidenceType: "dna-comparison",
    requiredFeatureFlags: ["dna-lab"],
    learningAreas: ["Digital Technologies", "Mathematics"],
    successCriteria: [
      "I can find the same thing shown two different ways.",
      "I can name one feature that stayed the same.",
      "I can explain that a different picture is not always a different thing.",
    ],
    teacherScript:
      "The same thing can be shown as a picture, as a word, or as a number. It is still the same thing. Today we look at two views and find what did not change.",
    studentInstructions:
      "Compare the two views. Find one thing that stayed the same.",
    shortDescription:
      "Students compare two representations of one companion and find the shared feature.",
    discussionPrompts: [
      "What looks different between the two views?",
      "What stayed the same?",
      "Why does the same thing look different in two places?",
    ],
    completionMessage:
      "You found what stayed the same across two different views. Careful comparing.",
    extensionActivity:
      "Draw a third way of showing the same thing and label the shared feature.",
    supportActivity: "Point to one part that looks the same in both views.",
    mainIdea:
      "One identity can be represented many ways without becoming something else.",
    majorInteraction:
      "Compare two representations of the demonstration companion side by side.",
    expectedOutcome:
      "Students name at least one feature preserved across both representations.",
    steps: [
      {
        title: "Same thing, two views",
        teacherPrompt:
          "Say: \"You will see the same companion shown two ways.\"",
        studentTask: "Get ready to compare.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students know they are comparing, not judging.",
      },
      {
        title: "Look at both",
        teacherPrompt: "Show both views side by side. No talking yet.",
        studentTask: "Look at both views.",
        whatDoINow: "Show both views, then press Next.",
        expectedOutcome: "Students have seen both representations.",
      },
      {
        title: "Find what stayed the same",
        teacherPrompt: "Ask pairs to find one thing that did not change.",
        studentTask: "Find one thing that stayed the same.",
        whatDoINow: "Give comparing time, then press Next.",
        expectedOutcome: "Each pair has found a shared feature.",
      },
      {
        title: "Explain it",
        teacherPrompt:
          "Take answers to \"What stayed the same, even though they looked different?\"",
        studentTask: "Explain your shared feature.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students explain representation versus identity.",
      },
      {
        title: "Stop here",
        teacherPrompt: "Say that Session Three is finished.",
        studentTask: "Remember what stayed the same.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session Three is recorded on this device.",
      },
    ],
  },
  "choices-and-algorithms": {
    id: "choices-and-algorithms",
    activityType: "care",
    evidenceType: "cause-effect-chain",
    requiredFeatureFlags: ["vitals"],
    learningAreas: ["Digital Technologies", "Personal and Social capability"],
    successCriteria: [
      "I can say an if–then rule out loud.",
      "I can predict what one action will do.",
      "I can say which order worked better and why.",
    ],
    teacherScript:
      "An algorithm is a set of steps in an order. If we do this, then that happens. We are going to predict first, try it, then reset and try a different order.",
    studentInstructions:
      "Predict first. Then act. Then reset and try a different order.",
    shortDescription:
      "Students predict an if–then rule, test it, then reset and compare orders.",
    discussionPrompts: [
      "What do you predict will happen?",
      "What actually happened?",
      "Which order worked better, and why?",
    ],
    completionMessage:
      "You predicted, tested, reset and compared. Resetting is part of the method.",
    extensionActivity:
      "Write your if–then rule as three steps a classmate could follow.",
    supportActivity: "Say one action and one thing it might change.",
    mainIdea:
      "Steps happen in an order, and the order changes the result.",
    majorInteraction:
      "Run an action sequence on the demonstration companion, reset, and run a different order.",
    expectedOutcome:
      "Students compare two orderings and justify which worked better.",
    steps: [
      {
        title: "If, then",
        teacherPrompt:
          "Say: \"If we do this, then that happens. That is an algorithm.\"",
        studentTask: "Listen for the words if and then.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students have the if–then frame.",
      },
      {
        title: "Predict before acting",
        teacherPrompt: "Ask for one prediction before anything is pressed.",
        studentTask: "Say what you think will happen.",
        whatDoINow: "Take one or two predictions, then press Next.",
        expectedOutcome: "The class has a prediction on record.",
      },
      {
        title: "Try it, then reset",
        teacherPrompt:
          "Run the action. Then reset and run a different order. Say clearly that resetting is allowed.",
        studentTask: "Watch both orders.",
        whatDoINow: "Run both orders, then press Next.",
        expectedOutcome: "The class has seen two orderings.",
      },
      {
        title: "Which order was better?",
        teacherPrompt:
          "Take answers to \"Which order worked better, and what makes you say that?\"",
        studentTask: "Say which order you would choose.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students justify a choice with evidence.",
      },
      {
        title: "Stop here",
        teacherPrompt: "Say that Session Four is finished.",
        studentTask: "Remember your better order.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session Four is recorded on this device.",
      },
    ],
  },
  "privacy-and-responsible-design": {
    id: "privacy-and-responsible-design",
    activityType: "create",
    evidenceType: "responsible-creator-promise",
    requiredFeatureFlags: [],
    learningAreas: [
      "Digital Technologies",
      "Personal and Social capability",
      "Health and Physical Education",
    ],
    successCriteria: [
      "I can name something a system should never keep.",
      "I can name something it should ask about first.",
      "I can give one reason for my choice.",
    ],
    teacherScript:
      "Systems do not decide by themselves what to remember. A person chose. Today you are that person, and you have to give a reason for what you choose.",
    studentInstructions:
      "Sort what a system should keep, ask about, or never keep. Give one reason.",
    shortDescription:
      "Students decide what a system should keep, ask about or never keep, and say why.",
    discussionPrompts: [
      "What should a system never keep?",
      "What should it ask about first?",
      "Who should get to decide?",
    ],
    completionMessage:
      "You made a design decision about what a system should keep, and you gave a reason.",
    extensionActivity:
      "Write one rule you would give a designer, in one sentence.",
    supportActivity:
      "Choose one example and say keep, ask first, or never.",
    mainIdea:
      "What a system remembers is a design decision someone makes on purpose.",
    majorInteraction:
      "Sort classroom examples into keep, ask first and never, then state one design rule.",
    expectedOutcome:
      "Each group states one rule they would give a designer, with a reason.",
    steps: [
      {
        title: "Someone chose",
        teacherPrompt:
          "Say: \"A system does not decide what to remember. A person chose.\"",
        studentTask: "Listen for the word chose.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students know design is a human decision.",
      },
      {
        title: "Look at the examples",
        teacherPrompt: "Read the examples aloud, one at a time.",
        studentTask: "Listen to each example.",
        whatDoINow: "Read the examples, then press Next.",
        expectedOutcome: "The class has heard every example once.",
      },
      {
        title: "Sort them",
        teacherPrompt:
          "Move to a corner for keep, ask first or never. One example at a time.",
        studentTask: "Move to your corner. Be ready to say why.",
        whatDoINow: "Run the sorting, then press Next.",
        expectedOutcome: "Every student has taken a position.",
      },
      {
        title: "Give a reason",
        teacherPrompt:
          "Take answers to \"Who should get to decide what a system remembers about you?\"",
        studentTask: "Say your reason.",
        whatDoINow: "Take a few reasons, then press Next.",
        expectedOutcome: "Students justify a privacy decision.",
      },
      {
        title: "Stop here",
        teacherPrompt: "Say that Session Five is finished.",
        studentTask: "Remember your rule.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session Five is recorded on this device.",
      },
    ],
  },
  "design-a-better-feature": {
    id: "design-a-better-feature",
    activityType: "build",
    evidenceType: "body-design-comparison",
    requiredFeatureFlags: ["body-forge"],
    learningAreas: ["Design and Technologies", "Digital Technologies"],
    successCriteria: [
      "I can change one part of a design.",
      "I can say who my change helps.",
      "I can say who it might not help.",
    ],
    teacherScript:
      "Designers change one thing at a time so they can tell what worked. Today you change one thing, and you say who it helps.",
    studentInstructions:
      "Change one part. Say who your change helps.",
    shortDescription:
      "Students change one design element and justify who the change helps.",
    discussionPrompts: [
      "What one thing did you change?",
      "Who does your change help?",
      "Who might it not help?",
    ],
    completionMessage:
      "You changed one thing on purpose and said who it helps. That is designing.",
    extensionActivity:
      "Design the same change for someone who uses the screen differently.",
    supportActivity: "Choose one part and say why you like it.",
    mainIdea:
      "A good design change is one change, made for a stated person.",
    majorInteraction:
      "Change one element of the demonstration design and compare before and after.",
    expectedOutcome:
      "Students state one change and the person it is meant to help.",
    steps: [
      {
        title: "One change only",
        teacherPrompt: "Say: \"Change one thing. Only one.\"",
        studentTask: "Think of one thing you would change.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students understand the single-change constraint.",
      },
      {
        title: "Look at what is there now",
        teacherPrompt: "Show the current design. Name its parts.",
        studentTask: "Look at the parts.",
        whatDoINow: "Show the design, then press Next.",
        expectedOutcome: "Students can name the parts available.",
      },
      {
        title: "Make your change",
        teacherPrompt: "Let students change one part.",
        studentTask: "Change one part.",
        whatDoINow: "Give building time, then press Next.",
        expectedOutcome: "Each student has made one change.",
      },
      {
        title: "Who does it help?",
        teacherPrompt:
          "Take answers to \"Who does your change help, and who might it not help?\"",
        studentTask: "Say who your change helps.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students justify a design choice by audience.",
      },
      {
        title: "Stop here",
        teacherPrompt: "Say that Session Six is finished.",
        studentTask: "Remember your change.",
        whatDoINow: "Press Complete to record the session locally.",
        expectedOutcome: "Session Six is recorded on this device.",
      },
    ],
  },
  "test-reflect-and-improve": {
    id: "test-reflect-and-improve",
    activityType: "predict",
    evidenceType: "visualisation-selection",
    requiredFeatureFlags: ["advanced-visualisation"],
    learningAreas: [
      "Digital Technologies",
      "Mathematics",
      "Personal and Social capability",
    ],
    successCriteria: [
      "I can test one idea.",
      "I can name a pattern I saw more than once.",
      "I can say what I would try next time.",
    ],
    teacherScript:
      "This is the last session. We look back at all seven and find something that happened more than once. Then we say what we would do differently. Being finished matters more than being right.",
    studentInstructions:
      "Test one idea. Find a pattern. Say what you would try next time.",
    shortDescription:
      "Students test an idea, name a pattern across the sequence, and explain their thinking.",
    discussionPrompts: [
      "What pattern did you notice?",
      "What evidence supports it?",
      "What would you try next time?",
    ],
    completionMessage:
      "You finished all seven sessions, found a pattern and explained your thinking. That is the whole sequence.",
    extensionActivity:
      "Predict the next step in the pattern you found and test it.",
    supportActivity: "Point to one thing that happened more than once.",
    mainIdea:
      "Testing an idea and revising it is how understanding improves.",
    majorInteraction:
      "Explore a pattern view of the demonstration companion and test one prediction.",
    expectedOutcome:
      "Students state one pattern with a supporting example and one next step.",
    steps: [
      {
        title: "Look back at all seven",
        teacherPrompt:
          "Say: \"Find something that happened more than once across our sessions.\"",
        studentTask: "Think back over the sessions.",
        whatDoINow: "Say the one sentence, then press Next.",
        expectedOutcome: "Students are recalling earlier sessions.",
      },
      {
        title: "Look at the pattern view",
        teacherPrompt: "Show the pattern view. No talking yet.",
        studentTask: "Look for something that repeats.",
        whatDoINow: "Show the view, then press Next.",
        expectedOutcome: "Students are examining the pattern view.",
      },
      {
        title: "Test one idea",
        teacherPrompt: "Ask for one prediction, then test it on screen.",
        studentTask: "Predict, then watch the test.",
        whatDoINow: "Test one prediction, then press Next.",
        expectedOutcome: "The class has tested one idea.",
      },
      {
        title: "Explain your thinking",
        teacherPrompt:
          "Take answers to \"What pattern did you notice, and what would you try next time?\"",
        studentTask: "Explain your pattern.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students explain a pattern with evidence.",
      },
      {
        title: "Finish the sequence",
        teacherPrompt:
          "Say that the seven-session sequence is complete. Nothing is left open.",
        studentTask: "Remember your pattern.",
        whatDoINow: "Press Complete to finish the sequence.",
        expectedOutcome: "All seven sessions are recorded on this device.",
      },
    ],
  },
};

/**
 * Which Meta-Pet surface each activity type opens. Derived from the activity
 * rather than restated per lesson so the two can never disagree.
 */
const ACTIVITY_DESTINATION = {
  observe: "meet",
  interpret: "emotions",
  compare: "dna-lab",
  care: "vitals",
  create: "challenge",
  build: "body-forge",
  predict: "visualisation",
} as const satisfies Record<LessonActivityType, LessonDefinition["appDestination"]>;

function toLessonDefinition(session: CanonicalSession): LessonDefinition {
  const runtime = LESSON_RUNTIME[session.id];

  return {
    id: session.id,
    number: session.number,
    slug: session.slug,
    title: session.title,
    shortDescription: runtime.shortDescription,
    durationMinutes: session.minutes,
    learningAreas: runtime.learningAreas,
    learningIntention: session.learningIntention,
    successCriteria: runtime.successCriteria,
    teacherIntroduction: session.teacherIntroduction,
    teacherScript: runtime.teacherScript,
    studentInstructions: runtime.studentInstructions,
    discussionPrompts: runtime.discussionPrompts,
    appDestination: ACTIVITY_DESTINATION[runtime.activityType],
    activityType: runtime.activityType,
    steps: buildSteps(session.id, runtime.steps),
    evidenceType: runtime.evidenceType,
    completionMessage: runtime.completionMessage,
    extensionActivity: runtime.extensionActivity,
    supportActivity: runtime.supportActivity,
    movementMoment: session.movementMoment,
    reflectionPrompt: session.reflectionPrompt,
    stoppingPoint: session.stoppingPoint,
    lightEvidence: session.lightEvidence,
    preview: {
      mainIdea: runtime.mainIdea,
      majorInteraction: runtime.majorInteraction,
      expectedOutcome: runtime.expectedOutcome,
      resetBehaviour:
        "The demonstration returns to its starting state when the session completes. Nothing about a student is kept.",
      completionPreview: `"${runtime.completionMessage}"`,
    },
    requiredFeatureFlags: runtime.requiredFeatureFlags,
    ...CLASSROOM_PET_CONTRACT,
  };
}

export const LESSON_DEFINITIONS: LessonDefinition[] =
  CANONICAL_SESSIONS.map(toLessonDefinition);

/** All lesson ids in canonical order. */
export const LESSON_IDS: LessonId[] = LESSON_DEFINITIONS.map((l) => l.id);

/** Lookup map from lesson id to definition. */
const LESSON_BY_ID: Map<LessonId, LessonDefinition> = new Map(
  LESSON_DEFINITIONS.map((lesson) => [lesson.id, lesson]),
);

/** Lookup map from slug to definition. */
const LESSON_BY_SLUG: Map<string, LessonDefinition> = new Map(
  LESSON_DEFINITIONS.map((lesson) => [lesson.slug, lesson]),
);

/** Total number of lessons in the system. */
export const TOTAL_LESSONS = LESSON_DEFINITIONS.length;

/** Return the lesson definition for an id, or undefined if unknown. */
export function getLessonById(
  id: string | null | undefined,
): LessonDefinition | undefined {
  if (!id) return undefined;
  return LESSON_BY_ID.get(id as LessonId);
}

/** Return the lesson definition for a slug, or undefined if unknown. */
export function getLessonBySlug(
  slug: string | null | undefined,
): LessonDefinition | undefined {
  if (!slug) return undefined;
  return LESSON_BY_SLUG.get(slug);
}

/** Type guard: is this string a known lesson id? */
export function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && LESSON_BY_ID.has(value as LessonId);
}
