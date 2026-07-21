/**
 * Meta-Pet Teacher Lesson System — the seven lesson definitions (Pass 1).
 *
 * Content here is intentionally lightweight placeholder copy. Every lesson has
 * the same five-phase placeholder structure (introduce → observe → interact →
 * discuss → complete) so the shared Lesson Runner can drive all of them.
 * Pass 2 will replace the placeholder step bodies with real Meta-Pet activities
 * (Body Forge, DNA Lab, vitals, emotions, visualisations) without changing the
 * Runner or this file's shape.
 */

import type {
  LessonDefinition,
  LessonId,
  LessonStepDefinition,
  LessonStepKind,
} from "./types";

/** Canonical order of the five placeholder phases. */
const STEP_KINDS: LessonStepKind[] = [
  "introduce",
  "observe",
  "interact",
  "discuss",
  "complete",
];

/**
 * Build the five placeholder steps for a lesson from concise per-phase copy.
 * Keeping this helper local guarantees all seven lessons share an identical
 * step contract, which the Runner and tests rely on.
 */
function buildSteps(
  lessonId: LessonId,
  phases: {
    title: string;
    teacherPrompt: string;
    studentTask: string;
    whatDoINow: string;
    expectedOutcome: string;
  }[],
): LessonStepDefinition[] {
  return phases.map((phase, index) => ({
    id: `${lessonId}-step-${index + 1}`,
    order: index + 1,
    kind: STEP_KINDS[index],
    ...phase,
  }));
}

export const LESSON_DEFINITIONS: LessonDefinition[] = [
  {
    id: "meet-your-metapet",
    number: 1,
    slug: "meet-your-metapet",
    title: "Meet Your Meta-Pet",
    shortDescription:
      "Students meet a Meta-Pet and describe how it looks, moves and responds.",
    durationMinutes: 20,
    learningAreas: ["Digital literacy", "Science", "Oral language"],
    learningIntention:
      "Understand that a Meta-Pet is a digital companion we can observe and describe.",
    successCriteria: [
      "I can name at least two things I notice about the Meta-Pet.",
      "I can describe how the Meta-Pet responds to attention.",
      "I can explain that it lives on this device, not online.",
    ],
    teacherIntroduction:
      "This first lesson introduces the Meta-Pet as a calm, local, account-free companion. Keep it playful — the goal is curiosity and shared vocabulary.",
    teacherScript:
      "Today we meet a Meta-Pet. It is not a video or a toy from the internet — it lives right here on this screen. Let's watch it together and describe what we see.",
    studentInstructions:
      "Watch the Meta-Pet. Notice how it looks and moves. Get ready to describe one thing you see.",
    discussionPrompts: [
      "What is the first thing you noticed about the Meta-Pet?",
      "How can you tell it is paying attention?",
      "How is a Meta-Pet different from a video?",
    ],
    appDestination: "meet",
    activityType: "observe",
    evidenceType: "pet-observation-card",
    completionMessage:
      "You met your Meta-Pet and described what makes it special. Well done!",
    extensionActivity:
      "Draw the Meta-Pet and label three parts you noticed.",
    supportActivity:
      "Point to the Meta-Pet on screen and say one word that describes it.",
    requiredFeatureFlags: [],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "A Meta-Pet is a local, private digital companion students can observe and describe.",
      majorInteraction:
        "Watch the demonstration Meta-Pet and name what you notice.",
      expectedOutcome:
        "Students share observations and shared vocabulary about the pet.",
      resetBehaviour:
        "Nothing is saved to the pet; the demonstration returns to its starting state.",
      completionPreview:
        "\"You met your Meta-Pet and described what makes it special.\"",
    },
    steps: buildSteps("meet-your-metapet", [
      {
        title: "Introduce the Meta-Pet",
        teacherPrompt:
          "Explain that we are meeting a digital companion that lives on this device.",
        studentTask: "Sit ready to watch the shared screen.",
        whatDoINow:
          "Tell the class we are about to meet a Meta-Pet together. Then press Next.",
        expectedOutcome: "Students are focused on the shared screen.",
      },
      {
        title: "Observe how it looks and moves",
        teacherPrompt:
          "Ask students to silently notice colour, shape and movement.",
        studentTask: "Watch the Meta-Pet and pick one thing you notice.",
        whatDoINow:
          "Give students quiet watching time, then press Next when they are ready to share.",
        expectedOutcome: "Each student has one observation ready.",
      },
      {
        title: "Interact and see it respond",
        teacherPrompt:
          "Demonstrate giving the Meta-Pet attention and ask what changes.",
        studentTask: "Watch how the Meta-Pet responds to attention.",
        whatDoINow:
          "Show the pet reacting once or twice, then move on with Next.",
        expectedOutcome: "Students notice the pet responds to attention.",
      },
      {
        title: "Discuss what we saw",
        teacherPrompt: "Use a discussion prompt to gather observations.",
        studentTask: "Share one observation with the class.",
        whatDoINow:
          "Ask one discussion question and take a few answers, then press Next.",
        expectedOutcome: "The class has a shared list of observations.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise what the class learned about Meta-Pets.",
        studentTask: "Remember your favourite thing about the Meta-Pet.",
        whatDoINow:
          "Recap the lesson and press Complete Lesson to record it as done.",
        expectedOutcome: "The lesson is completed and recorded on the Hub.",
      },
    ]),
  },
  {
    id: "build-a-body",
    number: 2,
    slug: "build-a-body",
    title: "Build a Body",
    shortDescription:
      "Students use a simplified Body Forge to assemble a Meta-Pet body.",
    durationMinutes: 25,
    learningAreas: ["Design & technology", "Science", "Creativity"],
    learningIntention:
      "Understand that a body is made of parts that fit together for a purpose.",
    successCriteria: [
      "I can choose parts to build a Meta-Pet body.",
      "I can explain why I chose a part.",
      "I can describe how the parts work together.",
    ],
    teacherIntroduction:
      "This lesson previews the Body Forge as a classroom build. In Pass 1 it is a guided placeholder; later it opens a simplified Body Forge with real logic underneath.",
    teacherScript:
      "Every Meta-Pet has a body made of parts. Today you are the builders. We will choose parts and see how they fit together to make a whole creature.",
    studentInstructions:
      "Pick parts to build a Meta-Pet body. Think about why each part matters.",
    discussionPrompts: [
      "Why did you choose that part?",
      "What happens if a part is missing?",
      "How do the parts work together?",
    ],
    appDestination: "body-forge",
    activityType: "build",
    evidenceType: "body-design-comparison",
    completionMessage:
      "You built a Meta-Pet body and explained your choices. Great designing!",
    extensionActivity:
      "Redesign your body for a different job, like swimming or climbing.",
    supportActivity:
      "Choose just one part and say why it belongs on the body.",
    requiredFeatureFlags: ["body-forge"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "A body is a system of parts chosen to fit together for a purpose.",
      majorInteraction:
        "Assemble a Meta-Pet body from parts in a simplified Body Forge.",
      expectedOutcome:
        "Students produce a body design and justify their choices.",
      resetBehaviour:
        "The demonstration body clears back to empty at completion.",
      completionPreview:
        "\"You built a Meta-Pet body and explained your choices.\"",
    },
    steps: buildSteps("build-a-body", [
      {
        title: "Introduce building a body",
        teacherPrompt: "Explain that bodies are made of parts with jobs.",
        studentTask: "Listen and think of a part a pet might need.",
        whatDoINow: "Set up the idea of building, then press Next.",
        expectedOutcome: "Students understand the building task.",
      },
      {
        title: "Look at the available parts",
        teacherPrompt: "Show the placeholder set of body parts.",
        studentTask: "Look at the parts and pick a favourite.",
        whatDoINow: "Point out a few parts, then press Next.",
        expectedOutcome: "Students know what parts are available.",
      },
      {
        title: "Build the body",
        teacherPrompt: "Invite students to assemble a body from parts.",
        studentTask: "Choose parts to make a Meta-Pet body.",
        whatDoINow:
          "Let students build (or build together on screen), then press Next.",
        expectedOutcome: "A placeholder body has been assembled.",
      },
      {
        title: "Discuss the designs",
        teacherPrompt: "Ask students to justify one design choice.",
        studentTask: "Explain why you chose one of your parts.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students can justify a design choice.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise how parts form a whole body.",
        studentTask: "Remember the body you designed.",
        whatDoINow: "Recap and press Complete Lesson.",
        expectedOutcome: "The lesson is completed and recorded.",
      },
    ]),
  },
  {
    id: "dna-differences",
    number: 3,
    slug: "dna-differences",
    title: "DNA Makes Us Different",
    shortDescription:
      "Students compare Meta-Pets to see how DNA creates differences.",
    durationMinutes: 25,
    learningAreas: ["Science", "Biology", "Data & patterns"],
    learningIntention:
      "Understand that small differences in DNA lead to different pets.",
    successCriteria: [
      "I can spot differences between two Meta-Pets.",
      "I can connect a difference to its DNA.",
      "I can explain that DNA makes each pet unique.",
    ],
    teacherIntroduction:
      "This lesson previews the DNA Lab. In Pass 1 students compare two demonstration pets; later they will change real DNA values and watch results.",
    teacherScript:
      "No two Meta-Pets are exactly the same. The secret is their DNA — a tiny code inside them. Let's compare two pets and find where their DNA made them different.",
    studentInstructions:
      "Compare two Meta-Pets. Find the differences and think about what caused them.",
    discussionPrompts: [
      "What differences did you find?",
      "Which difference is the biggest?",
      "Why is it good that pets are different from each other?",
    ],
    appDestination: "dna-lab",
    activityType: "compare",
    evidenceType: "dna-comparison",
    completionMessage:
      "You compared Meta-Pets and connected their differences to DNA. Nice science!",
    extensionActivity:
      "Predict what a third pet would look like from a new DNA code.",
    supportActivity:
      "Find just one difference between the two pets and name it.",
    requiredFeatureFlags: ["dna-lab"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea: "Small differences in DNA produce visibly different pets.",
      majorInteraction:
        "Compare two demonstration Meta-Pets side by side.",
      expectedOutcome:
        "Students link observed differences to DNA and uniqueness.",
      resetBehaviour:
        "The comparison pets reset to their starting DNA at completion.",
      completionPreview:
        "\"You compared Meta-Pets and connected their differences to DNA.\"",
    },
    steps: buildSteps("dna-differences", [
      {
        title: "Introduce DNA",
        teacherPrompt: "Explain that DNA is a code that makes each pet unique.",
        studentTask: "Think about what makes two pets different.",
        whatDoINow: "Introduce the idea of DNA, then press Next.",
        expectedOutcome: "Students understand DNA causes differences.",
      },
      {
        title: "Observe two pets",
        teacherPrompt: "Show two demonstration pets side by side.",
        studentTask: "Look carefully at both pets.",
        whatDoINow: "Display the two pets, then press Next.",
        expectedOutcome: "Students are comparing the two pets.",
      },
      {
        title: "Find the differences",
        teacherPrompt: "Ask students to list the differences they see.",
        studentTask: "Find and note differences between the pets.",
        whatDoINow: "Give time to compare, then press Next.",
        expectedOutcome: "Students have found several differences.",
      },
      {
        title: "Discuss the causes",
        teacherPrompt: "Connect the differences back to DNA.",
        studentTask: "Share a difference and what might have caused it.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students link differences to DNA.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise how DNA makes every pet unique.",
        studentTask: "Remember one difference you found.",
        whatDoINow: "Recap and press Complete Lesson.",
        expectedOutcome: "The lesson is completed and recorded.",
      },
    ]),
  },
  {
    id: "needs-and-consequences",
    number: 4,
    slug: "needs-and-consequences",
    title: "Needs, Actions and Consequences",
    shortDescription:
      "Students care for a Meta-Pet and see how actions change its vitals.",
    durationMinutes: 25,
    learningAreas: ["Health", "Science", "Responsibility"],
    learningIntention:
      "Understand that actions have consequences for a pet's needs.",
    successCriteria: [
      "I can name a need a Meta-Pet has.",
      "I can predict what happens after an action.",
      "I can explain why looking after needs matters.",
    ],
    teacherIntroduction:
      "This lesson previews vitals and care. In Pass 1 it is a guided placeholder; later it opens a simplified vitals view driven by real Meta-Pet logic.",
    teacherScript:
      "Meta-Pets have needs, just like living things. When we act, something changes. Today we will care for a pet and watch how our actions have consequences.",
    studentInstructions:
      "Care for the Meta-Pet. Predict what each action will do before you try it.",
    discussionPrompts: [
      "What need did you take care of?",
      "What happened after your action?",
      "What would happen if a need was ignored?",
    ],
    appDestination: "vitals",
    activityType: "care",
    evidenceType: "cause-effect-chain",
    completionMessage:
      "You cared for a Meta-Pet and learned that actions have consequences. Well done!",
    extensionActivity:
      "Make a simple care plan for a whole day.",
    supportActivity:
      "Choose one caring action and say what it helps.",
    requiredFeatureFlags: ["vitals"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea: "Actions have consequences for a pet's needs and wellbeing.",
      majorInteraction:
        "Care for a demonstration pet and predict the effect of each action.",
      expectedOutcome:
        "Students connect caring actions to changes in the pet's needs.",
      resetBehaviour:
        "The demonstration pet's needs reset to a neutral state at completion.",
      completionPreview:
        "\"You cared for a Meta-Pet and learned that actions have consequences.\"",
    },
    steps: buildSteps("needs-and-consequences", [
      {
        title: "Introduce needs",
        teacherPrompt: "Explain that Meta-Pets have needs to look after.",
        studentTask: "Think of a need a pet might have.",
        whatDoINow: "Introduce needs, then press Next.",
        expectedOutcome: "Students can name a pet need.",
      },
      {
        title: "Observe the pet's needs",
        teacherPrompt: "Show the placeholder needs of the pet.",
        studentTask: "Look at how the pet is doing right now.",
        whatDoINow: "Show the current state, then press Next.",
        expectedOutcome: "Students see the pet's current needs.",
      },
      {
        title: "Take a caring action",
        teacherPrompt: "Invite a caring action and predict the result first.",
        studentTask: "Predict, then take one caring action.",
        whatDoINow: "Let students predict and act, then press Next.",
        expectedOutcome: "Students have seen an action's consequence.",
      },
      {
        title: "Discuss consequences",
        teacherPrompt: "Discuss what changed and why.",
        studentTask: "Share what happened after your action.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students explain action and consequence.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise why caring for needs matters.",
        studentTask: "Remember one caring action you took.",
        whatDoINow: "Recap and press Complete Lesson.",
        expectedOutcome: "The lesson is completed and recorded.",
      },
    ]),
  },
  {
    id: "feelings-without-words",
    number: 5,
    slug: "feelings-without-words",
    title: "Feelings Without Words",
    shortDescription:
      "Students read a Meta-Pet's emotions from how it looks and moves.",
    durationMinutes: 20,
    learningAreas: ["Social & emotional learning", "Wellbeing", "Oral language"],
    learningIntention:
      "Understand that feelings can be shown without words.",
    successCriteria: [
      "I can name an emotion the Meta-Pet is showing.",
      "I can point to a clue that shows the feeling.",
      "I can suggest a kind response.",
    ],
    teacherIntroduction:
      "This lesson previews the emotion system. In Pass 1 it is a guided placeholder; later it opens a simplified emotion view using real Meta-Pet signals.",
    teacherScript:
      "Meta-Pets can show feelings without saying a word. We read their clues — how they move, their colour, their shape. Let's practise reading feelings together.",
    studentInstructions:
      "Watch the Meta-Pet's clues. Guess how it feels and how you could respond kindly.",
    discussionPrompts: [
      "What feeling do you think the pet is showing?",
      "What clue told you that?",
      "How could you respond kindly?",
    ],
    appDestination: "emotions",
    activityType: "interpret",
    evidenceType: "emotion-reflection",
    completionMessage:
      "You read feelings without words and thought about kind responses. Beautiful work!",
    extensionActivity:
      "Match three feelings to three different clues.",
    supportActivity:
      "Choose a happy or sad face card that matches the pet.",
    requiredFeatureFlags: ["emotions"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea: "Feelings can be communicated and read without words.",
      majorInteraction:
        "Read a demonstration pet's emotional clues and name the feeling.",
      expectedOutcome:
        "Students identify feelings from clues and suggest kind responses.",
      resetBehaviour:
        "The demonstration pet returns to a neutral mood at completion.",
      completionPreview:
        "\"You read feelings without words and thought about kind responses.\"",
    },
    steps: buildSteps("feelings-without-words", [
      {
        title: "Introduce reading feelings",
        teacherPrompt: "Explain that feelings can be shown without words.",
        studentTask: "Think of a time you knew how someone felt without asking.",
        whatDoINow: "Introduce feelings-without-words, then press Next.",
        expectedOutcome: "Students understand the reading task.",
      },
      {
        title: "Observe the pet's mood",
        teacherPrompt: "Show the pet displaying a placeholder feeling.",
        studentTask: "Watch the pet's movement and colour.",
        whatDoINow: "Show the mood, then press Next.",
        expectedOutcome: "Students are watching for clues.",
      },
      {
        title: "Read the clues",
        teacherPrompt: "Ask students to name the feeling and its clue.",
        studentTask: "Guess the feeling and point to a clue.",
        whatDoINow: "Let students interpret, then press Next.",
        expectedOutcome: "Students name a feeling with a clue.",
      },
      {
        title: "Discuss kind responses",
        teacherPrompt: "Discuss how to respond kindly to the feeling.",
        studentTask: "Suggest a kind way to respond.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students suggest a kind response.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise how we read feelings without words.",
        studentTask: "Remember one clue you noticed.",
        whatDoINow: "Recap and press Complete Lesson.",
        expectedOutcome: "The lesson is completed and recorded.",
      },
    ]),
  },
  {
    id: "patterns-behind-the-pet",
    number: 6,
    slug: "patterns-behind-the-pet",
    title: "Patterns Behind the Pet",
    shortDescription:
      "Students explore the patterns and visualisations that describe a Meta-Pet.",
    durationMinutes: 25,
    learningAreas: ["Mathematics", "Data & patterns", "Science"],
    learningIntention:
      "Understand that patterns and data can describe a living-like system.",
    successCriteria: [
      "I can spot a pattern in the pet's data.",
      "I can describe how the pattern changes.",
      "I can explain what the pattern tells us about the pet.",
    ],
    teacherIntroduction:
      "This lesson previews advanced visualisations. In Pass 1 it is a guided placeholder; later it opens simplified visualisations of real Meta-Pet data.",
    teacherScript:
      "Behind every Meta-Pet are patterns — in its DNA, its moods, its choices. Today we become pattern detectives and find the shapes hiding inside the pet.",
    studentInstructions:
      "Explore the pet's patterns. Look for something that repeats or changes.",
    discussionPrompts: [
      "What pattern did you find?",
      "How does the pattern change?",
      "What does the pattern tell us about the pet?",
    ],
    appDestination: "visualisation",
    activityType: "predict",
    evidenceType: "visualisation-selection",
    completionMessage:
      "You found the patterns behind the pet and described what they mean. Excellent thinking!",
    extensionActivity:
      "Predict the next step in a pattern you found.",
    supportActivity:
      "Find one thing that repeats and point to it.",
    requiredFeatureFlags: ["advanced-visualisation"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea: "Patterns and data describe how a living-like system behaves.",
      majorInteraction:
        "Explore a simplified visualisation of the pet's patterns.",
      expectedOutcome:
        "Students identify a pattern and explain what it reveals.",
      resetBehaviour:
        "The visualisation resets to its default view at completion.",
      completionPreview:
        "\"You found the patterns behind the pet and described what they mean.\"",
    },
    steps: buildSteps("patterns-behind-the-pet", [
      {
        title: "Introduce patterns",
        teacherPrompt: "Explain that patterns hide inside the pet's data.",
        studentTask: "Think of a pattern you know from everyday life.",
        whatDoINow: "Introduce pattern-hunting, then press Next.",
        expectedOutcome: "Students understand the pattern task.",
      },
      {
        title: "Observe the visualisation",
        teacherPrompt: "Show a placeholder visualisation of the pet's data.",
        studentTask: "Look at the shapes and movement.",
        whatDoINow: "Show the visualisation, then press Next.",
        expectedOutcome: "Students are examining the visualisation.",
      },
      {
        title: "Explore a pattern",
        teacherPrompt: "Ask students to find something that repeats or changes.",
        studentTask: "Find a pattern in the visualisation.",
        whatDoINow: "Let students explore, then press Next.",
        expectedOutcome: "Students have found a pattern.",
      },
      {
        title: "Discuss the meaning",
        teacherPrompt: "Discuss what the pattern reveals about the pet.",
        studentTask: "Share the pattern you found.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students explain a pattern's meaning.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Summarise how patterns describe the pet.",
        studentTask: "Remember one pattern you found.",
        whatDoINow: "Recap and press Complete Lesson.",
        expectedOutcome: "The lesson is completed and recorded.",
      },
    ]),
  },
  {
    id: "responsible-creator",
    number: 7,
    slug: "responsible-creator",
    title: "The Responsible Creator Challenge",
    shortDescription:
      "Students bring it all together and make responsible choices as creators.",
    durationMinutes: 30,
    learningAreas: ["Ethics", "Digital citizenship", "Science"],
    learningIntention:
      "Understand that creating and caring come with responsibility.",
    successCriteria: [
      "I can make a choice and give a reason for it.",
      "I can explain a responsibility of a creator.",
      "I can reflect on what makes a caring creator.",
    ],
    teacherIntroduction:
      "This capstone lesson ties the previous six together. In Pass 1 it is a guided reflection placeholder; later it becomes a real challenge using the student's pet.",
    teacherScript:
      "You have met, built, compared, cared for, understood and studied your Meta-Pet. Now the big question: what does it mean to be a responsible creator? Let's decide together.",
    studentInstructions:
      "Make thoughtful choices for your Meta-Pet and be ready to explain your reasons.",
    discussionPrompts: [
      "What is one responsibility of a creator?",
      "What choice are you most proud of?",
      "How can we be caring creators?",
    ],
    appDestination: "challenge",
    activityType: "create",
    evidenceType: "responsible-creator-promise",
    completionMessage:
      "You completed the Responsible Creator Challenge. You have finished all seven lessons — congratulations!",
    extensionActivity:
      "Write a short creator's promise for your Meta-Pet.",
    supportActivity:
      "Say one kind choice you would make for your Meta-Pet.",
    requiredFeatureFlags: [],
    usesDemonstrationPet: false,
    usesStudentRealPet: true,
    persistChanges: true,
    resetAtCompletion: false,
    preview: {
      mainIdea: "Creating and caring for a Meta-Pet carry real responsibility.",
      majorInteraction:
        "Make and justify responsible choices for a Meta-Pet.",
      expectedOutcome:
        "Students reflect on what makes a caring, responsible creator.",
      resetBehaviour:
        "This capstone can keep the student's choices; nothing is forced to reset.",
      completionPreview:
        "\"You completed the Responsible Creator Challenge and finished all seven lessons.\"",
    },
    steps: buildSteps("responsible-creator", [
      {
        title: "Introduce the challenge",
        teacherPrompt: "Explain that this ties all the lessons together.",
        studentTask: "Recall one thing from an earlier lesson.",
        whatDoINow: "Introduce the capstone challenge, then press Next.",
        expectedOutcome: "Students understand the challenge.",
      },
      {
        title: "Review what we know",
        teacherPrompt: "Recap the six earlier lessons briefly.",
        studentTask: "Think about what you learned across the lessons.",
        whatDoINow: "Recap the journey so far, then press Next.",
        expectedOutcome: "Students recall the earlier learning.",
      },
      {
        title: "Make responsible choices",
        teacherPrompt: "Invite students to make caring choices for their pet.",
        studentTask: "Make a thoughtful choice for your Meta-Pet.",
        whatDoINow: "Let students choose and justify, then press Next.",
        expectedOutcome: "Students make a justified choice.",
      },
      {
        title: "Discuss responsibility",
        teacherPrompt: "Discuss what responsible creating means.",
        studentTask: "Share a responsibility of a creator.",
        whatDoINow: "Ask a discussion prompt, then press Next.",
        expectedOutcome: "Students articulate a responsibility.",
      },
      {
        title: "Save and finish",
        teacherPrompt: "Celebrate finishing all seven lessons.",
        studentTask: "Remember your creator's promise.",
        whatDoINow: "Celebrate and press Complete Lesson.",
        expectedOutcome: "All seven lessons are completed.",
      },
    ]),
  },
];

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
