/**
 * The one canonical MetaPet School lesson sequence.
 *
 * The guided runtime, lesson list, print cards, passport and offline pack all
 * consume this file. Stable legacy ids/slugs are retained so existing local
 * progress and previously shared Field Mode links continue to resolve.
 */

import type {
  LessonActivityType,
  LessonAppDestination,
  LessonDefinition,
  LessonEvidenceType,
  LessonFeatureFlag,
  LessonId,
  LessonStepDefinition,
  LessonStepKind,
} from "./types";

const STEP_KINDS: LessonStepKind[] = [
  "introduce",
  "observe",
  "interact",
  "discuss",
  "complete",
];

const PARTICIPATION_CHOICES = [
  "Move",
  "Point",
  "Speak",
  "Draw",
  "Build",
  "Work with a partner",
  "Quietly observe",
  "Give the teacher a private response",
  "Use a printed alternative",
];

const ACCESSIBILITY_OPTIONS = [
  "Sound off",
  "Reduced motion or static visuals",
  "High contrast",
  "Large text",
  "Keyboard-only navigation",
  "Partner or quiet-observation participation",
  "Printed instructions",
];

interface StageSeed {
  title: string;
  teacherPrompt: string;
  studentTask: string;
  expectedOutcome: string;
}

interface LessonSeed {
  id: LessonId;
  number: number;
  slug: string;
  title: string;
  shortDescription: string;
  learningAreas: string[];
  curriculumLinks: string[];
  materials: string[];
  yearAdaptations: LessonDefinition["yearAdaptations"];
  learningIntention: string;
  successStatement: string;
  teacherIntroduction: string;
  teacherScript: string;
  studentInstructions: string;
  stages: [StageSeed, StageSeed, StageSeed];
  discussionPrompts: string[];
  optionalReflection: string;
  lightEvidenceMethod: string;
  noMarkingOption: string;
  offlineFallback: string;
  safeStopCondition: string;
  resetDeleteReminder: string;
  appDestination: LessonAppDestination;
  activityType: LessonActivityType;
  evidenceType: LessonEvidenceType;
  completionMessage: string;
  extensionActivity: string;
  supportActivity: string;
  requiredFeatureFlags?: LessonFeatureFlag[];
}

function buildSteps(seed: LessonSeed): LessonStepDefinition[] {
  const phases: StageSeed[] = [
    {
      title: "Open together",
      teacherPrompt: seed.teacherScript,
      studentTask: seed.studentInstructions,
      expectedOutcome: "Students understand the purpose and can choose how to participate.",
    },
    ...seed.stages,
    {
      title: "Reflect, reset and finish",
      teacherPrompt: `${seed.optionalReflection} ${seed.resetDeleteReminder}`,
      studentTask: "Choose whether to share, quietly reflect or use the printed alternative.",
      expectedOutcome: seed.successStatement,
    },
  ];

  return phases.map((phase, index) => ({
    id: `${seed.id}-step-${index + 1}`,
    order: index + 1,
    kind: STEP_KINDS[index],
    ...phase,
    whatDoINow:
      index === phases.length - 1
        ? "Use the optional reflection, record nothing if evidence is unnecessary, then complete the lesson."
        : "Read the teacher prompt, offer the equivalent participation choices, then continue when the class is ready.",
  }));
}

function defineLesson(seed: LessonSeed): LessonDefinition {
  return {
    id: seed.id,
    number: seed.number,
    slug: seed.slug,
    title: seed.title,
    shortDescription: seed.shortDescription,
    durationMinutes: 20,
    yearAdaptations: seed.yearAdaptations,
    learningAreas: seed.learningAreas,
    curriculumLinks: seed.curriculumLinks,
    materials: seed.materials,
    learningIntention: seed.learningIntention,
    successStatement: seed.successStatement,
    successCriteria: [seed.successStatement],
    teacherIntroduction: seed.teacherIntroduction,
    teacherScript: seed.teacherScript,
    studentInstructions: seed.studentInstructions,
    discussionPrompts: seed.discussionPrompts,
    appDestination: seed.appDestination,
    activityType: seed.activityType,
    steps: buildSteps(seed),
    evidenceType: seed.evidenceType,
    completionMessage: seed.completionMessage,
    extensionActivity: seed.extensionActivity,
    supportActivity: seed.supportActivity,
    participationChoices: [...PARTICIPATION_CHOICES],
    optionalReflection: seed.optionalReflection,
    lightEvidenceMethod: seed.lightEvidenceMethod,
    noMarkingOption: seed.noMarkingOption,
    offlineFallback: seed.offlineFallback,
    accessibilityOptions: [...ACCESSIBILITY_OPTIONS],
    safeStopCondition: seed.safeStopCondition,
    resetDeleteReminder: seed.resetDeleteReminder,
    preview: {
      mainIdea: seed.learningIntention,
      majorInteraction: seed.stages[1].studentTask,
      expectedOutcome: seed.successStatement,
      resetBehaviour:
        "The demonstration resets safely. Any optional local classroom record remains teacher-deletable and expires after 35 days without use.",
      completionPreview: seed.completionMessage,
    },
    requiredFeatureFlags: seed.requiredFeatureFlags ?? [],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
  };
}

export const LESSON_DEFINITIONS: LessonDefinition[] = [
  defineLesson({
    id: "meet-your-metapet",
    number: 1,
    slug: "meet-your-metapet",
    title: "Meet the System",
    shortDescription:
      "Observe how a MetaPet responds to an input and explain that a digital system changes state.",
    learningAreas: ["Digital Technologies", "Science", "English"],
    curriculumLinks: ["AC9TDI4K01", "AC9TDI6K03"],
    materials: ["Shared screen or device", "Optional paper and pencil"],
    yearAdaptations: {
      years3To4: "Use one input and describe one visible before-and-after change.",
      years5To6: "Name the input, state and output, then suggest another test.",
    },
    learningIntention:
      "We are learning that a digital system receives input and changes state.",
    successStatement:
      "I can point to an input and explain one visible state change it caused.",
    teacherIntroduction:
      "Use a shared demonstration MetaPet. A roster, alias or saved record is not required.",
    teacherScript:
      "This MetaPet is a digital system. We will give it one input, watch what changes and describe the evidence we can actually see.",
    studentInstructions:
      "Watch, point, move, draw or tell a partner what changes after the input.",
    stages: [
      {
        title: "Observe the starting state",
        teacherPrompt: "Ask the class to identify two visible signals before anyone interacts.",
        studentTask: "Notice or point to two things that show the current state.",
        expectedOutcome: "Students describe a visible starting state without guessing feelings.",
      },
      {
        title: "Apply one input",
        teacherPrompt: "Choose one safe action and ask students to predict a visible change.",
        studentTask: "Predict, then watch the system respond.",
        expectedOutcome: "Students distinguish the action from the resulting state.",
      },
      {
        title: "Explain the change",
        teacherPrompt: "Model the sentence: When we __, the system changed from __ to __.",
        studentTask: "Explain, draw or point to the cause-and-effect sequence.",
        expectedOutcome: "Students give an evidence-based cause-and-effect explanation.",
      },
    ],
    discussionPrompts: ["What was the input?", "What changed?", "What evidence can we see?"],
    optionalReflection: "What would you test next, and why?",
    lightEvidenceMethod: "Optional teacher tick: identified input, state and output using an alias only if needed.",
    noMarkingOption: "Use one whole-class verbal explanation and save nothing.",
    offlineFallback: "Use the printed before-and-after MetaPet panels and point to the changed signal.",
    safeStopCondition: "Stop if the display is distracting or a student wants to opt out; continue with the static card.",
    resetDeleteReminder: "Reset the demonstration. Delete any optional local note when it is no longer useful.",
    appDestination: "meet",
    activityType: "observe",
    evidenceType: "pet-observation-card",
    completionMessage: "You observed a digital system and explained how an input changed its state.",
    extensionActivity: "Test a second input and compare the two outputs.",
    supportActivity: "Offer two printed states and ask the student to point to what changed.",
  }),
  defineLesson({
    id: "needs-and-consequences",
    number: 2,
    slug: "needs-and-consequences",
    title: "Read the Signals",
    shortDescription:
      "Read visible signals, identify what the system may need and make a reasoned choice.",
    learningAreas: ["Digital Technologies", "Science", "English"],
    curriculumLinks: ["AC9TDI4P02", "AC9TDI6P05"],
    materials: ["Shared screen or printed signal cards", "Optional mini-whiteboards"],
    yearAdaptations: {
      years3To4: "Choose between two responses and point to the signal that supports the choice.",
      years5To6: "Compare competing signals, justify priority and acknowledge uncertainty.",
    },
    learningIntention: "We are learning to use visible signals to make a reasoned system choice.",
    successStatement: "I can identify a signal, choose a response and give a reason.",
    teacherIntroduction:
      "Signals are information from the digital system, not labels for a child or behaviour scores.",
    teacherScript:
      "Digital systems give us signals. A signal is evidence we can inspect; it is not a diagnosis and it does not tell us everything.",
    studentInstructions: "Point, speak, draw or work with a partner to choose a response supported by a signal.",
    stages: [
      {
        title: "Find the signals",
        teacherPrompt: "Ask students to name only what is visibly present.",
        studentTask: "Find two visible signals without deciding what they mean yet.",
        expectedOutcome: "Students separate observation from interpretation.",
      },
      {
        title: "Choose a response",
        teacherPrompt: "Offer two calm system actions and ask which one the evidence supports.",
        studentTask: "Choose an action and identify the signal used.",
        expectedOutcome: "Students make a reasoned, reversible choice.",
      },
      {
        title: "Check the result",
        teacherPrompt: "Apply the action and ask whether the new state supports the original reasoning.",
        studentTask: "Compare the new signals with the starting signals.",
        expectedOutcome: "Students revise or retain a choice based on new evidence.",
      },
    ],
    discussionPrompts: ["Which signal mattered most?", "What else could it mean?", "When should we change our mind?"],
    optionalReflection: "What made your choice reasonable rather than random?",
    lightEvidenceMethod: "Optional alias-only note of the signal, response and observed result.",
    noMarkingOption: "Invite two class explanations and record nothing.",
    offlineFallback: "Sort printed signal and response cards into evidence-based pairs.",
    safeStopCondition: "Stop the interaction if the signals become unclear; use the static example and avoid personal comparisons.",
    resetDeleteReminder: "Reset the demonstration and remove optional notes when the learning purpose is finished.",
    appDestination: "vitals",
    activityType: "care",
    evidenceType: "cause-effect-chain",
    completionMessage: "You read visible signals and made a reasoned, testable choice.",
    extensionActivity: "Rank three signals and explain why the priority might change.",
    supportActivity: "Use one signal and two clearly different response cards.",
    requiredFeatureFlags: ["vitals"],
  }),
  defineLesson({
    id: "dna-differences",
    number: 3,
    slug: "dna-differences",
    title: "One Identity, Many Representations",
    shortDescription:
      "Explore how the same MetaPet can be represented through shape, colour, numbers, traits and visible state.",
    learningAreas: ["Digital Technologies", "Mathematics", "Visual Arts"],
    curriculumLinks: ["AC9TDI4K03", "AC9TDI6K03"],
    materials: ["Shared screen", "Printed representation cards", "Optional drawing materials"],
    yearAdaptations: {
      years3To4: "Match two representations of the same MetaPet using obvious shared features.",
      years5To6: "Explain what each representation reveals, hides or simplifies.",
    },
    learningIntention: "We are learning that one digital identity can be represented in several useful ways.",
    successStatement: "I can match representations and explain what stays the same.",
    teacherIntroduction:
      "Keep this about digital representation. Do not compare student bodies, identities or private traits.",
    teacherScript:
      "The same digital system can be shown as a picture, a set of numbers, a list of traits or a changing state. Each view tells us something different.",
    studentInstructions: "Match, point, draw or explain which views belong to the same MetaPet.",
    stages: [
      {
        title: "Inspect three views",
        teacherPrompt: "Show the visual, numeric and trait views without revealing the match.",
        studentTask: "Notice one feature in each representation.",
        expectedOutcome: "Students identify information carried by different views.",
      },
      {
        title: "Find the shared identity",
        teacherPrompt: "Ask students to match representations using evidence.",
        studentTask: "Match the views and point to what connects them.",
        expectedOutcome: "Students recognise one identity across representations.",
      },
      {
        title: "Compare what each view does",
        teacherPrompt: "Ask what one view makes easy to see and what it leaves out.",
        studentTask: "Explain, draw or sort the strengths of each representation.",
        expectedOutcome: "Students understand that representations are selective.",
      },
    ],
    discussionPrompts: ["What stayed the same?", "What changed only in the display?", "Which view helps with which question?"],
    optionalReflection: "Which representation would you choose to explain the system to someone else?",
    lightEvidenceMethod: "Optional photo-free teacher note recording the chosen representation and reason.",
    noMarkingOption: "Complete the matching task as a class and save nothing.",
    offlineFallback: "Match the complete printed representation card set.",
    safeStopCondition: "Stop any personal identity comparison and return to the fictional MetaPet examples.",
    resetDeleteReminder: "Clear the matching board and delete optional local evidence when finished.",
    appDestination: "dna-lab",
    activityType: "compare",
    evidenceType: "dna-comparison",
    completionMessage: "You recognised one digital identity across several representations.",
    extensionActivity: "Invent a new representation and state what it makes easier to understand.",
    supportActivity: "Use two high-contrast cards with one shared shape cue.",
    requiredFeatureFlags: ["dna-lab"],
  }),
  defineLesson({
    id: "patterns-behind-the-pet",
    number: 4,
    slug: "patterns-behind-the-pet",
    title: "Choices and Algorithms",
    shortDescription:
      "Build and test a simple sequence of choices using cause, effect, branching and repetition.",
    learningAreas: ["Digital Technologies", "Mathematics", "English"],
    curriculumLinks: ["AC9TDI4P04", "AC9TDI6P05"],
    materials: ["Shared screen", "Arrow/action cards", "Optional floor space for movement"],
    yearAdaptations: {
      years3To4: "Build a three-step sequence and test it in order.",
      years5To6: "Add one branch or repeat, test an edge case and repair the sequence.",
    },
    learningIntention: "We are learning to build and test a simple algorithm.",
    successStatement: "I can put choices in order, test the result and repair one problem.",
    teacherIntroduction:
      "Students may act out the algorithm, move cards, point, draw or quietly check a partner’s sequence.",
    teacherScript:
      "An algorithm is a sequence of steps. Today we will build one, test what actually happens and change it when the result is not what we intended.",
    studentInstructions: "Move, arrange, point to or draw the steps in a simple system sequence.",
    stages: [
      {
        title: "Build the sequence",
        teacherPrompt: "Choose a goal and arrange three action cards in order.",
        studentTask: "Create or help check a three-step sequence.",
        expectedOutcome: "Students can state the intended order.",
      },
      {
        title: "Run and observe",
        teacherPrompt: "Execute the sequence exactly as written without silently fixing it.",
        studentTask: "Watch for where cause and effect differ from the plan.",
        expectedOutcome: "Students use test evidence rather than intention alone.",
      },
      {
        title: "Branch, repeat or repair",
        teacherPrompt: "Change one step, add a simple if-choice or repeat, then retest.",
        studentTask: "Suggest, point to or make one useful change.",
        expectedOutcome: "Students improve an algorithm through testing.",
      },
    ],
    discussionPrompts: ["What happened in order?", "Where could the sequence branch?", "What did the test make us change?"],
    optionalReflection: "Why is testing part of writing an algorithm?",
    lightEvidenceMethod: "Optional alias-only record of one sequence and its repaired step.",
    noMarkingOption: "Run one whole-class floor algorithm and keep no record.",
    offlineFallback: "Use printable arrow, action, branch and repeat cards.",
    safeStopCondition: "Pause movement if the room becomes unsafe or overstimulating; continue by pointing at desk cards.",
    resetDeleteReminder: "Clear the sequence and delete optional local evidence when it is no longer needed.",
    appDestination: "visualisation",
    activityType: "predict",
    evidenceType: "visualisation-selection",
    completionMessage: "You built, tested and improved a simple algorithm.",
    extensionActivity: "Add one branch and explain both possible paths.",
    supportActivity: "Use three numbered cards with one action on each.",
    requiredFeatureFlags: ["advanced-visualisation"],
  }),
  defineLesson({
    id: "feelings-without-words",
    number: 5,
    slug: "feelings-without-words",
    title: "Privacy and Responsible Design",
    shortDescription:
      "Decide what information a digital experience needs, what it does not need and how responsible creators protect users.",
    learningAreas: ["Digital Technologies", "Health", "Civics and Citizenship"],
    curriculumLinks: ["AC9TDI4P09", "AC9TDI6P09"],
    materials: ["Printed information cards", "Two sorting areas: needs / does not need"],
    yearAdaptations: {
      years3To4: "Sort familiar information cards and explain one item the app does not need.",
      years5To6: "Apply data minimisation, purpose and deletion questions to a feature proposal.",
    },
    learningIntention: "We are learning to minimise information and protect people through design.",
    successStatement: "I can explain why a feature needs some information and should refuse other information.",
    teacherIntroduction:
      "Use fictional cards only. Never ask children to type or disclose private feelings, names, contacts or personal experiences.",
    teacherScript:
      "Responsible creators collect only what a feature truly needs. More information is not automatically better, and people should know what is stored and how to erase it.",
    studentInstructions: "Sort, point, draw or quietly check which information the fictional feature needs.",
    stages: [
      {
        title: "Name the feature purpose",
        teacherPrompt: "State one simple fictional feature and the job it must do.",
        studentTask: "Repeat or point to the feature’s actual purpose.",
        expectedOutcome: "Students identify a bounded purpose before choosing data.",
      },
      {
        title: "Minimise the information",
        teacherPrompt: "Sort each fictional information card into needs or does not need.",
        studentTask: "Place, point to or draw a decision and give a reason.",
        expectedOutcome: "Students reject unnecessary information.",
      },
      {
        title: "Add protection and deletion",
        teacherPrompt: "Ask who controls the record, where it stays and when it is erased.",
        studentTask: "Choose one protection and one deletion rule.",
        expectedOutcome: "Students connect responsible design with control and retention.",
      },
    ],
    discussionPrompts: ["What does the feature truly need?", "What should it refuse?", "Who can erase the record?"],
    optionalReflection: "What is one question you should ask before giving an app information?",
    lightEvidenceMethod: "Optional anonymous class tally of information cards rejected as unnecessary.",
    noMarkingOption: "Complete the sort together and store no student response.",
    offlineFallback: "Use the full printable privacy-card sort.",
    safeStopCondition: "Stop immediately if discussion turns to a child’s real private information; return to fictional examples.",
    resetDeleteReminder: "Clear the fictional sort. Erase any optional local class tally when finished.",
    appDestination: "emotions",
    activityType: "interpret",
    evidenceType: "emotion-reflection",
    completionMessage: "You minimised information and added a clear protection and deletion rule.",
    extensionActivity: "Review a second feature and identify one misleading privacy claim.",
    supportActivity: "Use two cards: one clearly needed and one clearly unnecessary.",
    requiredFeatureFlags: ["emotions"],
  }),
  defineLesson({
    id: "build-a-body",
    number: 6,
    slug: "build-a-body",
    title: "Design a Better Feature",
    shortDescription:
      "Identify a real user need and design a useful, calm, accessible feature without manipulation or unnecessary data.",
    learningAreas: ["Design and Technologies", "Digital Technologies", "Visual Arts"],
    curriculumLinks: ["AC9TDI4P04", "AC9TDI6P06"],
    materials: ["Feature canvas or plain paper", "Drawing or building materials", "Accessibility checklist"],
    yearAdaptations: {
      years3To4: "Choose one user need and draw a feature with one accessibility option.",
      years5To6: "Write a design rationale covering need, accessibility, data minimisation and non-manipulative use.",
    },
    learningIntention: "We are learning to design a calm, accessible feature for a genuine user need.",
    successStatement: "I can connect a feature to a need and explain how it avoids unnecessary pressure or data.",
    teacherIntroduction:
      "A polished drawing is not required. Students can build, speak, point, partner or privately show the teacher.",
    teacherScript:
      "Good features solve a real problem. They should be understandable, accessible and honest without tricks that pressure people to stay, click or share more.",
    studentInstructions: "Draw, build, speak, point or partner to design one useful and calm feature.",
    stages: [
      {
        title: "Identify the user need",
        teacherPrompt: "Choose a fictional classroom user and state one practical need.",
        studentTask: "Name or select the need before inventing the feature.",
        expectedOutcome: "Students separate a user need from a decorative idea.",
      },
      {
        title: "Design the feature",
        teacherPrompt: "Ask for one main action, one clear result and one accessibility choice.",
        studentTask: "Create the smallest feature that meets the need.",
        expectedOutcome: "Students produce an understandable feature concept.",
      },
      {
        title: "Remove pressure and excess data",
        teacherPrompt: "Check for countdowns, guilt, streak loss, sharing pressure and unnecessary information.",
        studentTask: "Remove or redesign one risky element.",
        expectedOutcome: "Students improve the feature through responsible constraints.",
      },
    ],
    discussionPrompts: ["Whose need does it meet?", "How can more people use it?", "What did you deliberately leave out?"],
    optionalReflection: "What made the feature calmer or more honest after revision?",
    lightEvidenceMethod: "Optional alias-only feature title plus one design reason; do not photograph students.",
    noMarkingOption: "Run a gallery walk or quiet desk check and save nothing.",
    offlineFallback: "Use the printable feature canvas and accessibility checklist.",
    safeStopCondition: "Pause critique if it becomes personal; assess the design choice, never the child or participation method.",
    resetDeleteReminder: "Clear demonstration changes and delete optional local notes after their teaching purpose ends.",
    appDestination: "body-forge",
    activityType: "build",
    evidenceType: "body-design-comparison",
    completionMessage: "You designed a useful feature and removed unnecessary pressure or data.",
    extensionActivity: "Add a keyboard-only path and explain a colour-independent instruction.",
    supportActivity: "Choose a need card and add one large, clearly labelled control.",
    requiredFeatureFlags: ["body-forge"],
  }),
  defineLesson({
    id: "responsible-creator",
    number: 7,
    slug: "responsible-creator",
    title: "Test, Reflect and Improve",
    shortDescription:
      "Test a design, observe what happens, accept criticism, repair problems and explain what should change next.",
    learningAreas: ["Digital Technologies", "Design and Technologies", "English"],
    curriculumLinks: ["AC9TDI4P02", "AC9TDI6P06"],
    materials: ["Lesson 6 feature idea or sample design", "Simple test checklist", "Optional paper"],
    yearAdaptations: {
      years3To4: "Run one test, name what worked and change one part.",
      years5To6: "Use test criteria, record a failure honestly and prioritise the next iteration.",
    },
    learningIntention: "We are learning to use testing and criticism to improve a design.",
    successStatement: "I can describe one test result, repair one problem and explain the next change.",
    teacherIntroduction:
      "Criticism targets the design, not the designer. Participation style, speed and confidence are never behaviour scores.",
    teacherScript:
      "Responsible creators do not hide what failed. We test, observe, listen, repair and explain what should change next.",
    studentInstructions: "Test, observe, point, draw, speak or privately show one useful improvement.",
    stages: [
      {
        title: "Choose a fair test",
        teacherPrompt: "State the feature’s goal and choose one observable test criterion.",
        studentTask: "Predict what success would look like.",
        expectedOutcome: "Students define a test before judging the result.",
      },
      {
        title: "Observe and accept feedback",
        teacherPrompt: "Run the test and collect one kind, specific piece of design feedback.",
        studentTask: "Notice what happened without defending the design.",
        expectedOutcome: "Students distinguish evidence from preference.",
      },
      {
        title: "Repair and explain",
        teacherPrompt: "Change one part and ask what should be tested next.",
        studentTask: "Make or describe one repair and its reason.",
        expectedOutcome: "Students complete a simple test-and-improve cycle.",
      },
    ],
    discussionPrompts: ["What actually happened?", "What criticism helped?", "What should be tested next?"],
    optionalReflection: "What did the failure teach that the original idea could not?",
    lightEvidenceMethod: "Optional alias-only test result: worked, needs repair, next test.",
    noMarkingOption: "Use a whole-class sample design and store no individual evidence.",
    offlineFallback: "Use the printable test, feedback and repair sheet.",
    safeStopCondition: "Stop feedback that labels, ranks or embarrasses a child; return to the shared sample design.",
    resetDeleteReminder: "Finish by deleting optional local evidence that is not needed and resetting the demonstration.",
    appDestination: "challenge",
    activityType: "create",
    evidenceType: "responsible-creator-promise",
    completionMessage: "You tested honestly, used criticism and improved the design.",
    extensionActivity: "Prioritise three possible repairs by impact and effort.",
    supportActivity: "Choose between two clear repairs and point to the one that best addresses the test result.",
  }),
];

export const LESSON_IDS: LessonId[] = LESSON_DEFINITIONS.map((lesson) => lesson.id);

const LESSON_BY_ID = new Map<LessonId, LessonDefinition>(
  LESSON_DEFINITIONS.map((lesson) => [lesson.id, lesson]),
);

const LESSON_BY_SLUG = new Map<string, LessonDefinition>(
  LESSON_DEFINITIONS.map((lesson) => [lesson.slug, lesson]),
);

export const TOTAL_LESSONS = LESSON_DEFINITIONS.length;

export function getLessonById(
  id: string | null | undefined,
): LessonDefinition | undefined {
  return id ? LESSON_BY_ID.get(id as LessonId) : undefined;
}

export function getLessonBySlug(
  slug: string | null | undefined,
): LessonDefinition | undefined {
  return slug ? LESSON_BY_SLUG.get(slug) : undefined;
}

export function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && LESSON_BY_ID.has(value as LessonId);
}
