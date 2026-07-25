/**
 * Meta-Pet Teacher Lesson System — the seven lesson definitions.
 *
 * Every lesson uses the same seven-stage classroom investigation rhythm
 * (Notice → Predict → Act → Observe → Explain → Create → Reflect, see
 * {@link LessonStepKind}) so the shared Lesson Runner can drive all of them
 * from data alone. Three duration depths — Quick Spark (10 min), Core Lesson
 * (20 min) and Deep Dive (40 min) — reuse this same seven-stage flow rather
 * than forking into separate lesson plans: {@link LessonTimingMode} controls
 * how much of the optional discussion / extension depth is shown, and
 * {@link LessonDefinition.deepDiveActivity} is the physical/creative/
 * collaborative extension unlocked only at Deep Dive depth.
 */

import type {
  LessonDefinition,
  LessonId,
  LessonStepDefinition,
  LessonStepKind,
} from "./types";

/** Canonical order of the seven investigation stages. */
const STEP_KINDS: LessonStepKind[] = [
  "notice",
  "predict",
  "act",
  "observe",
  "explain",
  "create",
  "reflect",
];

/**
 * Build the seven stage steps for a lesson from concise per-phase copy.
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
      "Students learn that a Meta-Pet is a connected system: its eyes, posture, breathing, colour and movement are outputs that give clues about what's happening inside.",
    durationMinutes: 20,
    learningAreas: [
      "Science",
      "Digital Technologies",
      "English",
      "Critical and Creative Thinking",
    ],
    learningIntention:
      "Understand that a Meta-Pet is a connected system we can observe, and that its signals (outputs) give clues about what is happening inside.",
    successCriteria: [
      "I can name at least two signals the Meta-Pet shows (eyes, posture, breathing, colour, movement).",
      "I can predict what a signal might mean before checking.",
      "I can explain how one changed signal is a clue about the system.",
    ],
    teacherIntroduction:
      "This first lesson introduces the Meta-Pet as a connected system, not only a character. Keep it playful and observational — the goal is shared vocabulary for 'signal' and 'clue' that later lessons build on.",
    teacherScript:
      "Today we meet a Meta-Pet. It is not a video or a toy from the internet — it lives right here on this screen, and it is a system: its eyes, posture, breathing, colour and movement all give us clues. Let's watch together and work out what those clues mean.",
    studentInstructions:
      "Watch the Meta-Pet. Notice its signals, predict what one of them means, then check your prediction.",
    discussionPrompts: [
      "What is the first signal you noticed about the Meta-Pet?",
      "How can you tell it is paying attention?",
      "What is one clue that changed, and what might that clue mean?",
    ],
    appDestination: "meet",
    activityType: "observe",
    evidenceType: "pet-observation-card",
    completionMessage:
      "You met your Meta-Pet, read its signals and explained what they might mean. Well done!",
    extensionActivity:
      "Draw the Meta-Pet and label all five signals you noticed (eyes, posture, breathing, colour, movement).",
    supportActivity:
      "Point to the Meta-Pet on screen and say one word that describes it.",
    keyConcept:
      "Outputs can provide clues about what is happening inside a system.",
    materials: ["A shared screen or projector"],
    preparation:
      "Have the lesson open and the demonstration Meta-Pet visible before students arrive.",
    physicalActivity:
      "Freeze-Frame Signals — in pairs, one student uses only posture and breathing (no words, no faces) to show a Meta-Pet signal such as sleepy, alert or excited, while their partner names the clue that gave it away.",
    deepDiveActivity:
      "Signal Gallery — small groups each choose one signal (eyes, posture, breathing, colour or movement) and act it out for the class as a short freeze-frame. The class votes on which clue was clearest and explains why, then the class agrees on one shared 'signal dictionary'.",
    safetyNotes: "",
    requiredFeatureFlags: [],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "A Meta-Pet is a connected system: its signals (eyes, posture, breathing, colour, movement) are outputs that give clues about its inside state.",
      majorInteraction:
        "Watch the demonstration Meta-Pet, predict what a signal means, then check by giving it attention.",
      expectedOutcome:
        "Students connect an observed signal to an idea about what is happening inside the system.",
      resetBehaviour:
        "Nothing is saved to the pet; the demonstration returns to its starting state.",
      completionPreview:
        "\"You met your Meta-Pet, read its signals and explained what they might mean.\"",
    },
    steps: buildSteps("meet-your-metapet", [
      {
        title: "Notice the Meta-Pet's signals",
        teacherPrompt:
          "Show the Meta-Pet on the shared screen without changing anything yet. Ask students to stay quiet and just look.",
        studentTask:
          "Look closely at the Meta-Pet. Notice its eyes, its posture, how it seems to breathe, its colour and how it moves.",
        whatDoINow:
          "Display the Meta-Pet, give about 30 seconds of silent looking time, then press Next.",
        expectedOutcome:
          "Each student can name one signal they noticed (eyes, posture, breathing, colour or movement).",
      },
      {
        title: "Predict what a signal means",
        teacherPrompt:
          "Ask students to choose one signal and predict what it might tell us about the Meta-Pet, before we test it.",
        studentTask:
          "Pick a word for the pet's shape, surface and movement, and predict what each might be telling you.",
        whatDoINow:
          "Ask 'What do you think that signal is telling us?' and take a few guesses before pressing Next.",
        expectedOutcome:
          "Students have made a prediction about what a signal might indicate, before checking.",
      },
      {
        title: "Act: give the Meta-Pet your attention",
        teacherPrompt:
          "Demonstrate giving the Meta-Pet attention and invite each student to choose a safe alias for it.",
        studentTask:
          "Give your Meta-Pet a safe nickname (an alias, not your real name), then watch it respond to attention.",
        whatDoINow:
          "Let students choose an alias, show the pet reacting once or twice, then press Next.",
        expectedOutcome:
          "Every student has chosen a safe alias and seen the pet respond to attention.",
      },
      {
        title: "Observe how the signals respond",
        teacherPrompt:
          "Ask students to compare the Meta-Pet now with how it looked at the very start.",
        studentTask:
          "Look again at the same signals. What is different now, after the pet had your attention?",
        whatDoINow:
          "Prompt 'What changed since we started watching?' then press Next.",
        expectedOutcome:
          "Students can describe at least one signal that changed after the pet received attention.",
      },
      {
        title: "Explain the clue",
        teacherPrompt:
          "Connect the observed change back to the earlier prediction, and ask what the clue tells us about the system inside.",
        studentTask:
          "Explain: was your prediction close? What does the changed signal tell you was happening inside the Meta-Pet? Write or say one question you still have.",
        whatDoINow:
          "Ask a discussion prompt and gather a few explanations, then press Next.",
        expectedOutcome:
          "Students link an observed output (a signal) to an idea about the system's inside state.",
      },
      {
        title: "Create your pet card",
        teacherPrompt:
          "Guide students to record their alias and observations on a simple pet card.",
        studentTask:
          "Create a pet card: your alias, three observations (shape, surface, movement) and your explanation.",
        whatDoINow: "Give time to complete the card, then press Next.",
        expectedOutcome: "Every student has produced a completed pet card.",
      },
      {
        title: "Reflect",
        teacherPrompt:
          "Ask the closing reflection question and invite one or two students to share.",
        studentTask:
          "In one sentence: what is one clue your Meta-Pet gives you, and what might it mean?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student has written or said one reflection sentence connecting a clue to a meaning.",
      },
    ]),
  },
  {
    id: "build-a-body",
    number: 2,
    slug: "build-a-body",
    title: "Build a Body",
    shortDescription:
      "Students assemble a Meta-Pet body by following an ordered sequence of choices — like teaching the pet a simple algorithm: Start, Choose, Check, Act, Repeat, Stop.",
    durationMinutes: 25,
    learningAreas: [
      "Digital Technologies",
      "Design and Technologies",
      "Critical and Creative Thinking",
    ],
    learningIntention:
      "Understand that a body — like a program — is built from an ordered sequence of choices that must fit together, and that checking your work catches mistakes.",
    successCriteria: [
      "I can follow an ordered sequence (Start, Choose, Check, Act, Repeat, Stop) to build a Meta-Pet body.",
      "I can explain why I chose a part.",
      "I can describe how checking helps catch a mismatch before finishing.",
    ],
    teacherIntroduction:
      "This lesson frames the Body Forge build as a simple, ordered algorithm. Keep the Start–Choose–Check–Act–Repeat–Stop language visible throughout; it is the same rule structure Lesson 5 later names explicitly.",
    teacherScript:
      "Every Meta-Pet has a body made of parts, and building it is a bit like giving instructions to a computer: Start, Choose a part, Check it fits, Act by applying it, Repeat for the next part, Stop when you're done. Today you are the builders — and the instruction-writers.",
    studentInstructions:
      "Follow Choose → Check → Act for each part of the body. Think about why each part matters, and what you would check if something looked wrong.",
    discussionPrompts: [
      "Why did you choose that part?",
      "What would you check first if two parts didn't seem to work together?",
      "Why does the order of steps matter when building something?",
    ],
    appDestination: "body-forge",
    activityType: "build",
    evidenceType: "body-design-comparison",
    completionMessage:
      "You built a Meta-Pet body by following ordered rules and explained your choices. Great designing!",
    extensionActivity:
      "Redesign your body for a different job, like swimming or climbing, using the same Choose → Check → Act rule.",
    supportActivity:
      "Choose just one part and say why it belongs on the body.",
    keyConcept:
      "Computers follow rules, so people must design those rules carefully.",
    materials: [
      "A shared screen or projector",
      "Optional: paper strips or index cards for the Human Robot activity",
    ],
    preparation:
      "Decide who will play 'the robot' for the Human Robot activity if running the Deep Dive option.",
    physicalActivity:
      "Human Robot — one student is the 'robot pet builder' and may only do exactly what they are told. The class gives instructions one step at a time using Start, Choose, Check, Act, Repeat, Stop. Skip a step on purpose once to show why order and checking matter.",
    deepDiveActivity:
      "Debug the Instructions — in small groups, students write a five-step instruction card for building a body, swap cards with another group, and try to follow someone else's instructions exactly. Groups find and fix one unclear or missing step, then explain the fix to the class.",
    safetyNotes: "",
    requiredFeatureFlags: ["body-forge"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "A body is a system of parts, assembled by following an ordered sequence of choices — a simple algorithm.",
      majorInteraction:
        "Assemble a Meta-Pet body from parts in a simplified Body Forge, following Choose → Check → Act.",
      expectedOutcome:
        "Students produce a body design, justify their choices and explain why order and checking matter.",
      resetBehaviour:
        "The demonstration body clears back to empty at completion.",
      completionPreview:
        "\"You built a Meta-Pet body by following ordered rules and explained your choices.\"",
    },
    steps: buildSteps("build-a-body", [
      {
        title: "Notice the starting body",
        teacherPrompt:
          "Show the starting body. Ask students to look at its shape, face, movement and surface before anything changes.",
        studentTask:
          "Look at the starting Meta-Pet body. Notice its shape, face, movement and surface.",
        whatDoINow: "Display the starting pet, then press Next.",
        expectedOutcome:
          "Students can describe the starting body in their own words.",
      },
      {
        title: "Predict how a shape choice matters",
        teacherPrompt:
          "Explain that building a body follows a set of rules in order: Start, Choose, Check, Act, Repeat, Stop. Ask what students think will happen if they choose a new shape.",
        studentTask:
          "Predict: if you choose a new body shape, what do you think will change about how the pet looks or moves?",
        whatDoINow:
          "Introduce the Start–Choose–Check–Act–Repeat–Stop idea, take a prediction, then press Next.",
        expectedOutcome:
          "Students have predicted an effect of choosing a shape before trying it.",
      },
      {
        title: "Act: choose a shape",
        teacherPrompt:
          "Model the rule: Choose a shape, Check it fits the pet you want, Act by applying it.",
        studentTask:
          "Choose a body shape for your Meta-Pet, following Choose → Check → Act.",
        whatDoINow: "Let students choose a shape, then press Next.",
        expectedOutcome: "Students have chosen and applied a body shape.",
      },
      {
        title: "Observe the shape, then repeat for a face",
        teacherPrompt:
          "Ask students to look at the shape they chose, then Repeat the same rule to choose a face.",
        studentTask:
          "Observe your chosen shape. Then repeat Choose → Check → Act to pick a face.",
        whatDoINow:
          "Point out the repeated pattern (Repeat), then press Next.",
        expectedOutcome:
          "Students see that the same simple rule can be repeated for a new choice.",
      },
      {
        title: "Explain the rule, and debug a mismatch",
        teacherPrompt:
          "Show or invite an example where a part doesn't fit (for example, a feature that clashes with the body) and ask students to debug it.",
        studentTask:
          "Choose movement and surface. Explain: what would you Check first if two of your choices didn't seem to work together?",
        whatDoINow:
          "Ask 'What would you check first if something looked wrong?' then press Next.",
        expectedOutcome:
          "Students can explain how Check helps catch a mismatch before finishing — a simple debugging idea.",
      },
      {
        title: "Create your design",
        teacherPrompt:
          "Guide students to compare their finished design with the starting body and justify their choices.",
        studentTask:
          "Compare before and after. Write: 'I chose this because…' and decide whether to keep your original or apply your new design.",
        whatDoINow: "Give time to compare and write, then press Next.",
        expectedOutcome:
          "Students have produced a finished design with a stated reason.",
      },
      {
        title: "Reflect",
        teacherPrompt: "Ask the closing reflection question.",
        studentTask:
          "In one sentence: why does the order of Start, Choose, Check, Act, Repeat, Stop matter when building something?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student connects ordered rules and checking to a successful, working design.",
      },
    ]),
  },
  {
    id: "dna-differences",
    number: 3,
    slug: "dna-differences",
    title: "DNA Makes Us Different",
    shortDescription:
      "Students compare Meta-Pets to see how a hidden DNA input creates a visible output difference, and that small input changes create real differences.",
    durationMinutes: 25,
    learningAreas: ["Science", "Digital Technologies", "Mathematics"],
    learningIntention:
      "Understand that a hidden input (DNA) can produce a visible output (a trait), and that small differences in that input lead to different pets.",
    successCriteria: [
      "I can predict a visible output before a hidden input is changed.",
      "I can spot the difference between two Meta-Pets after one input changes.",
      "I can explain that DNA is a hidden input that makes each pet unique.",
    ],
    teacherIntroduction:
      "This lesson previews the DNA Lab using input/output language that Lesson 5's algorithm framing and Lesson 4's feedback-loop framing both build on. Students compare two demonstration pets by changing one input and reading the one output it produces.",
    teacherScript:
      "No two Meta-Pets are exactly the same. The secret is their DNA — a hidden code (an input) inside them that we cannot see just by looking at a pet's face. Let's change one small part of that input and see what visible output it produces.",
    studentInstructions:
      "Predict what will change, then change one gene and compare the two pets. Record what changed and what stayed the same.",
    discussionPrompts: [
      "Which input (gene) changed, and which output (visible trait) changed because of it?",
      "What stayed the same, even though one input changed?",
      "Why is it useful that small input differences make each Meta-Pet unique?",
    ],
    appDestination: "dna-lab",
    activityType: "compare",
    evidenceType: "dna-comparison",
    completionMessage:
      "You changed a hidden input and explained the visible output it created. Nice science!",
    extensionActivity:
      "Predict what a third pet would look like from a new DNA input.",
    supportActivity:
      "Find just one difference between the two pets and name it.",
    keyConcept:
      "A hidden input can produce a visible output — small input differences create real, valued differences.",
    materials: ["A shared screen or projector"],
    preparation:
      "No setup beyond opening the lesson; the DNA strip and pets are generated automatically.",
    physicalActivity:
      "DNA Relay — in small groups, one student silently reads a short 4-symbol code card to a partner once (no repeats). The partner writes down what they heard, then the group compares the copy to the original to find any 'copying' differences.",
    deepDiveActivity:
      "Build a Class DNA Key — each group picks one gene (eye, pattern, shape or colour), draws a simple before/after key showing the input (the gene) and the output (the visible trait), then the class combines the keys into one wall chart.",
    safetyNotes: "",
    requiredFeatureFlags: ["dna-lab"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "A hidden input (DNA) produces a visible output (a trait); small input differences make every pet unique.",
      majorInteraction:
        "Predict, then change one gene on a demonstration Meta-Pet and compare the result.",
      expectedOutcome:
        "Students link one changed input to one changed output and explain what stayed the same.",
      resetBehaviour:
        "The comparison pets reset to their starting DNA at completion.",
      completionPreview:
        "\"You changed a hidden input and explained the visible output it created.\"",
    },
    steps: buildSteps("dna-differences", [
      {
        title: "Notice the original pet and its code",
        teacherPrompt:
          "Introduce the original pet and a short strip of its DNA — a hidden input inside it.",
        studentTask:
          "Look at the original Meta-Pet and its DNA strip. Notice that DNA is a hidden input we cannot see just by looking at the pet's face.",
        whatDoINow: "Show the pet and DNA strip together, then press Next.",
        expectedOutcome:
          "Students understand DNA is a hidden input inside the pet.",
      },
      {
        title: "Predict the effect of changing one gene",
        teacherPrompt:
          "Explain that we will change one gene (one input). Ask students to predict what visible output might change.",
        studentTask:
          "We will change one gene. Predict what you think might change about how the pet looks.",
        whatDoINow:
          "Take predictions using the choice options, then press Next.",
        expectedOutcome:
          "Students have predicted a visible output before the input is changed.",
      },
      {
        title: "Act: change one gene",
        teacherPrompt: "Invite a student to press the button that changes one gene.",
        studentTask:
          "Press the button to change one gene (one input). Watch what happens.",
        whatDoINow: "Let a student change the gene, then press Next.",
        expectedOutcome:
          "One gene has been changed and the class has watched it happen.",
      },
      {
        title: "Observe the changed output",
        teacherPrompt:
          "Place the original and changed pets side by side and ask what visibly changed.",
        studentTask:
          "Compare the original and changed pet side by side. Record what output changed.",
        whatDoINow: "Show both pets together, then press Next.",
        expectedOutcome:
          "Students can name the specific visible difference between the two pets.",
      },
      {
        title: "Explain input and output",
        teacherPrompt:
          "Connect the one changed input (gene) to the one changed output (trait), and ask what stayed the same.",
        studentTask:
          "Explain which input changed and which output changed because of it. Record one thing that stayed the same.",
        whatDoINow: "Ask the discussion prompt, then press Next.",
        expectedOutcome:
          "Students explain the input-output link and that most of the pet stayed the same.",
      },
      {
        title: "Create your final choice",
        teacherPrompt:
          "Guide students to decide whether to keep this variation, as a considered final decision.",
        studentTask:
          "Decide: would you keep this DNA variation on a real Meta-Pet, or restore the original? Explain your choice.",
        whatDoINow: "Give time to decide and record, then press Next.",
        expectedOutcome:
          "Students make and justify a final, considered decision about the variation.",
      },
      {
        title: "Reflect",
        teacherPrompt: "Ask the closing reflection question.",
        studentTask:
          "In one sentence: why is it useful that small input differences make each Meta-Pet unique?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student connects small input differences to real, valued uniqueness.",
      },
    ]),
  },
  {
    id: "needs-and-consequences",
    number: 4,
    slug: "needs-and-consequences",
    title: "Needs, Actions and Consequences",
    shortDescription:
      "Students notice a Meta-Pet's needs, predict and test an action, then identify whether the resulting chain of effects is a helpful or a harmful loop.",
    durationMinutes: 25,
    learningAreas: [
      "Health and Physical Education",
      "Science",
      "Personal and Social Capability",
    ],
    learningIntention:
      "Understand that one signal may have several causes, that noticing comes before responding, and that one action can start a feedback loop that helps or harms.",
    successCriteria: [
      "I can notice several needs before choosing a response, instead of guessing.",
      "I can predict, then test, what an action does to more than one need.",
      "I can identify whether a chain of effects is a helpful loop or a harmful loop, and explain how changing one part changes the outcome.",
    ],
    teacherIntroduction:
      "This lesson previews the vitals sandbox and introduces feedback loops directly: for example, less rest leads to lower energy, slower movement, less play and reduced mood. Keep the framing evidence-based ('the energy signal is low') rather than diagnostic.",
    teacherScript:
      "Meta-Pets have needs, just like living things, and one signal alone rarely tells the whole story. Today we will notice several needs first, test an action, and see whether it starts a loop that helps the pet recover or one that makes things harder.",
    studentInstructions:
      "Read all the needs before choosing. Predict, then act, then decide: is this loop helpful or harmful? Try changing one part of the loop.",
    discussionPrompts: [
      "What need did you notice, and did you check more than one signal first?",
      "What happened after your action — immediately, and then afterwards?",
      "Is your loop helpful or harmful, and what would happen if you changed just one part of it?",
    ],
    appDestination: "vitals",
    activityType: "care",
    evidenceType: "cause-effect-chain",
    completionMessage:
      "You noticed the pet's needs, tested a loop and explained how one action leads to another. Well done!",
    extensionActivity:
      "Make a simple care plan for a whole day that keeps the loop helpful.",
    supportActivity: "Choose one caring action and say what it helps.",
    keyConcept:
      "Notice first, then respond thoughtfully — one action can start a loop that helps or harms.",
    materials: ["A shared screen or projector"],
    preparation:
      "No setup beyond opening the lesson; the vitals sandbox resets automatically.",
    physicalActivity:
      "Loop Cards — arrange four cards (Action → Immediate effect → Secondary effect → Pet response) on the floor or desk in order, then physically swap out one card to test a different loop.",
    deepDiveActivity:
      "Break the Harmful Loop — in small groups, students are given a harmful loop written on cards (for example: less rest → lower energy → less play → lower mood), physically rearrange or replace one card to turn it into a helpful loop, and present their fix to the class.",
    safetyNotes:
      "Keep language about needs practical and evidence-based (for example, 'the energy signal is low'). Avoid suggesting a pet state represents a real medical or mental-health diagnosis, and never apply pet-state language to a student's own feelings.",
    requiredFeatureFlags: ["vitals"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "One signal may have several causes; one action can start a feedback loop that helps or harms.",
      majorInteraction:
        "Notice several needs, predict and test an action, then classify the resulting loop as helpful or harmful.",
      expectedOutcome:
        "Students connect noticing-first to a more thoughtful response, and explain a feedback loop.",
      resetBehaviour:
        "The demonstration pet's needs reset to a neutral state at completion.",
      completionPreview:
        "\"You noticed the pet's needs, tested a loop and explained how one action leads to another.\"",
    },
    steps: buildSteps("needs-and-consequences", [
      {
        title: "Notice all the needs",
        teacherPrompt:
          "Show the full set of needs (energy, hunger, curiosity, hygiene, trust, mood, stress) and ask which signal looks like it needs attention.",
        studentTask:
          "Read all seven needs. Which signal looks like it needs attention most? Remember: one signal alone doesn't tell the whole story.",
        whatDoINow: "Display the needs panel, then press Next.",
        expectedOutcome:
          "Students can name a need that looks low or high, without assuming they know the whole cause.",
      },
      {
        title: "Predict before you act",
        teacherPrompt:
          "Ask students to choose an action and predict its effect before trying it.",
        studentTask:
          "Choose an action you think will help most, and predict what it will do.",
        whatDoINow:
          "Take a prediction using the choice grid, then press Next.",
        expectedOutcome:
          "Students have predicted an action's effect before performing it.",
      },
      {
        title: "Act: perform the action",
        teacherPrompt:
          "Let students perform the predicted action and watch several needs change at once.",
        studentTask:
          "Perform your chosen action. Watch how more than one need changes.",
        whatDoINow: "Let students act, then press Next.",
        expectedOutcome:
          "Students see that one action changes several needs together.",
      },
      {
        title: "Observe the loop",
        teacherPrompt:
          "Ask whether the change looks like it is starting a helpful loop or a harmful one, and invite one or two more balancing actions.",
        studentTask:
          "Choose one or two more actions to bring the needs into balance. Decide: is this loop helpful or harmful?",
        whatDoINow: "Let students try balancing actions, then press Next.",
        expectedOutcome:
          "Students identify whether the sequence of changes forms a helpful or harmful pattern.",
      },
      {
        title: "Explain the chain",
        teacherPrompt:
          "Guide students to explain the chain: action → immediate effect → secondary effect → pet response.",
        studentTask:
          "Explain the chain: what was the action, the immediate effect, the secondary effect, and the pet's response?",
        whatDoINow: "Ask the discussion prompt, then press Next.",
        expectedOutcome:
          "Students can describe the full cause-and-effect chain in order.",
      },
      {
        title: "Create a loop diagram",
        teacherPrompt:
          "Guide students to record the chain as a simple loop diagram, classify it, and predict what happens if one part changes.",
        studentTask:
          "Record your loop as a diagram, mark it helpful or harmful, then predict: if you changed only the first action, what would happen instead?",
        whatDoINow:
          "Give time to record the diagram and prediction, then press Next.",
        expectedOutcome:
          "Students have a recorded loop diagram, a helpful/harmful classification and a prediction about changing one part.",
      },
      {
        title: "Reflect",
        teacherPrompt: "Ask the closing reflection question.",
        studentTask:
          "In one sentence: how can noticing a need before reacting help you choose a more helpful action?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student connects noticing-first to a more thoughtful response.",
      },
    ]),
  },
  {
    id: "feelings-without-words",
    number: 5,
    slug: "feelings-without-words",
    title: "Feelings Without Words",
    shortDescription:
      "Students read a Meta-Pet's signals, make a careful (not certain) guess about how it might be feeling, and practise responding thoughtfully rather than assuming.",
    durationMinutes: 20,
    learningAreas: [
      "Health and Physical Education",
      "Personal and Social Capability",
      "English",
    ],
    learningIntention:
      "Understand that feelings can be shown without words, that one signal may have more than one explanation, and that it is okay to ask instead of assuming.",
    successCriteria: [
      "I can name a clue the Meta-Pet is showing before making a guess.",
      "I can make a careful, non-certain guess and suggest a kind response.",
      "I can offer an alternative explanation for the same clue.",
    ],
    teacherIntroduction:
      "This lesson previews the emotion system, using deliberately tentative language ('the pet may be feeling…'). It reinforces Lesson 4's 'notice first' idea specifically for emotional signals. Keep responses gentle and evidence-based; never treat a pet state as a diagnosis of a student.",
    teacherScript:
      "Meta-Pets can show feelings without saying a word. We read their clues — how they move, their colour, their posture — but a clue can have more than one explanation. Let's practise gathering evidence, guessing carefully, and helping kindly.",
    studentInstructions:
      "Make a first guess, then gather clues, then decide your best-supported guess. Try to help, and offer an alternative explanation too.",
    discussionPrompts: [
      "What clue told you that, and could it mean something else?",
      "How did your guess change once you had more evidence?",
      "Why is it kind to say 'may be feeling' instead of 'is feeling'?",
    ],
    appDestination: "emotions",
    activityType: "interpret",
    evidenceType: "emotion-reflection",
    completionMessage:
      "You read feelings without words and thought about kind responses. Beautiful work!",
    extensionActivity: "Match three feelings to three different clues.",
    supportActivity:
      "Choose a happy or sad face card that matches the pet.",
    keyConcept:
      "Notice first, then respond thoughtfully — one signal may have more than one cause.",
    materials: ["A shared screen or projector"],
    preparation: "No setup beyond opening the lesson.",
    physicalActivity:
      "Feelings Charades — students take turns showing a feeling using only posture and stillness (no faces, no words) while classmates guess the clue, then discuss respectfully how they could check rather than assume.",
    deepDiveActivity:
      "More Than One Reason — in small groups, students list two or three different reasons a pet (or person) might show the same clue (for example, being still could mean resting, thinking, or feeling worried), then share one example with the class.",
    safetyNotes:
      "Use tentative language only ('may be feeling', 'a possible clue'). Never state that a pet state diagnoses a student's own feelings or a medical/mental-health condition. If a student shares something personal, thank them and follow your school's wellbeing process rather than responding as part of the lesson.",
    requiredFeatureFlags: ["emotions"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "Feelings can be communicated without words; one signal can have more than one explanation.",
      majorInteraction:
        "Guess first, gather clues, then form a best-supported (never certain) guess and help kindly.",
      expectedOutcome:
        "Students identify feelings from clues, offer an alternative explanation and suggest a kind response.",
      resetBehaviour:
        "The demonstration pet returns to a neutral mood at completion.",
      completionPreview:
        "\"You read feelings without words and thought about kind responses.\"",
    },
    steps: buildSteps("feelings-without-words", [
      {
        title: "Notice the pet's feeling",
        teacherPrompt:
          "Show the pet displaying a feeling. Ask students to watch carefully before guessing.",
        studentTask:
          "Here is a pet showing a feeling. Watch carefully — what clues can you see?",
        whatDoINow: "Show the mood, then press Next.",
        expectedOutcome: "Students are watching for clues before guessing.",
      },
      {
        title: "Predict a first guess",
        teacherPrompt:
          "Ask for a quick first guess, before gathering more evidence — this is just a starting point, not a final answer.",
        studentTask:
          "Before you look closely, make a first guess: what do you think the pet might be feeling?",
        whatDoINow: "Take a quick first guess, then press Next.",
        expectedOutcome:
          "Students have made an initial, low-stakes guess before gathering evidence.",
      },
      {
        title: "Act: gather clues and choose your best guess",
        teacherPrompt:
          "Ask students to select every visible clue, then choose their best-supported guess.",
        studentTask:
          "Select every clue you can see, then choose the feeling you think is best supported by the evidence.",
        whatDoINow: "Let students select clues and choose, then press Next.",
        expectedOutcome:
          "Students have gathered evidence and chosen a best-supported (not certain) guess.",
      },
      {
        title: "Observe the pet respond",
        teacherPrompt:
          "Invite students to try guiding the pet toward calm and observe how its signals respond.",
        studentTask:
          "Try guiding the pet toward calm. Observe how its eyes, posture, breathing, brightness and movement respond.",
        whatDoINow: "Let students try the calming controls, then press Next.",
        expectedOutcome:
          "Students observe the pet's signals change in response to a kind action.",
      },
      {
        title: "Explain your reasoning",
        teacherPrompt:
          "Ask students to explain their guess and offer an alternative explanation for the same clues.",
        studentTask:
          "Explain how you helped, and offer another explanation for the same clues — remember, we cannot be certain.",
        whatDoINow: "Ask the discussion prompt, then press Next.",
        expectedOutcome:
          "Students explain their reasoning and can offer at least one alternative explanation.",
      },
      {
        title: "Create your feelings card",
        teacherPrompt:
          "Guide students to record the clues, their guess, how they helped and their alternative explanation.",
        studentTask:
          "Create your feelings card: the clues you noticed, your best-supported guess, how you helped, and an alternative explanation.",
        whatDoINow: "Give time to complete the card, then press Next.",
        expectedOutcome: "Every student has a completed feelings card.",
      },
      {
        title: "Reflect",
        teacherPrompt: "Ask the closing reflection question.",
        studentTask:
          "In one sentence: why is it kind to say 'the pet may be feeling…' instead of 'the pet is feeling…'?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student connects tentative language to kindness and respect.",
      },
    ]),
  },
  {
    id: "patterns-behind-the-pet",
    number: 6,
    slug: "patterns-behind-the-pet",
    title: "Patterns Behind the Pet",
    shortDescription:
      "Students explore the patterns behind a Meta-Pet's DNA visualisation: repetition, symmetry and rule changes. Years 3-4 continue a pattern; Years 5-6 explain the rule, test it and find an exception.",
    durationMinutes: 25,
    learningAreas: ["Mathematics", "Digital Technologies", "Science"],
    learningIntention:
      "Understand that patterns are instructions expressed through repetition, and that the same information can be represented in different ways.",
    successCriteria: [
      "I can predict what a different representation of the same pattern might look like.",
      "I can identify something that repeats, is symmetrical, or stays consistent across representations.",
      "(Years 5-6) I can explain the rule behind a pattern, test it, and find an exception.",
    ],
    teacherIntroduction:
      "This lesson previews advanced visualisations using the real DNA visualiser. The same DNA seed drives every mode, so students see the modes differ while the identity holds — a concrete example of 'same information, different representation'. Use Support presentation for a simpler continue-the-pattern task (Years 3-4) and Extension presentation for rule-testing (Years 5-6).",
    teacherScript:
      "Behind every Meta-Pet are patterns — in its DNA, its moods, its choices. Today we become pattern detectives: we'll predict, compare representations, and find the shapes hiding inside the pet.",
    studentInstructions:
      "Predict, then explore. Find something that stays the same across different representations, and explain the rule behind it.",
    discussionPrompts: [
      "What pattern did you find, and did your prediction match?",
      "What feature stayed the same across more than one representation?",
      "(Years 5-6) What is the rule, and can you find a case that breaks it?",
    ],
    appDestination: "visualisation",
    activityType: "predict",
    evidenceType: "visualisation-selection",
    completionMessage:
      "You found the patterns behind the pet and described what they mean. Excellent thinking!",
    extensionActivity:
      "Predict the next step in a pattern you found, then test whether your prediction holds.",
    supportActivity: "Find one thing that repeats and point to it.",
    keyConcept: "Patterns are instructions expressed through repetition.",
    materials: ["A shared screen or projector"],
    preparation:
      "No setup beyond opening the lesson; choose Support or Extension presentation mode to match your year band.",
    physicalActivity:
      "Pattern Hunt — students find and sketch (no photos needed) one repeating pattern in the classroom or playground (tiles, brickwork, leaves), then compare it with a partner's pattern for shared rules.",
    deepDiveActivity:
      "Pattern Mutation Table — small groups take a simple drawn or arranged pattern, deliberately change one rule (for example, alternate colours instead of repeating one), and challenge another group to spot the rule change and describe it precisely.",
    safetyNotes: "",
    requiredFeatureFlags: ["advanced-visualisation"],
    usesDemonstrationPet: true,
    usesStudentRealPet: false,
    persistChanges: false,
    resetAtCompletion: true,
    preview: {
      mainIdea:
        "Patterns are instructions expressed through repetition; the same information can look different depending on representation.",
      majorInteraction:
        "Predict, then explore a simplified visualisation of the pet's patterns across several representations.",
      expectedOutcome:
        "Students identify a pattern, explain what stays consistent, and (Years 5-6) test a rule for exceptions.",
      resetBehaviour:
        "The visualisation resets to its default view at completion.",
      completionPreview:
        "\"You found the patterns behind the pet and described what they mean.\"",
    },
    steps: buildSteps("patterns-behind-the-pet", [
      {
        title: "Notice the first pattern",
        teacherPrompt:
          "Show the pet's DNA as a Sigil — a radial pattern. Ask students what they notice about how it holds together.",
        studentTask:
          "This is the pet's DNA shown as a Sigil, a radial pattern. Notice how it holds together.",
        whatDoINow: "Show the Sigil view, then press Next.",
        expectedOutcome:
          "Students can describe the Sigil pattern in their own words.",
      },
      {
        title: "Predict another representation",
        teacherPrompt:
          "Ask students to predict what a different representation of the same DNA might look like, before switching.",
        studentTask:
          "Predict: if we show the same DNA a different way, what do you think will stay the same, and what might look different?",
        whatDoINow: "Take a prediction, then press Next.",
        expectedOutcome:
          "Students have predicted what will stay consistent across representations.",
      },
      {
        title: "Act: change the representation",
        teacherPrompt:
          "Let students change the representation. The DNA is the same — only how we draw it changes.",
        studentTask: "Change the representation and see how it looks.",
        whatDoINow: "Let students choose a mode, then press Next.",
        expectedOutcome:
          "Students have actively switched between at least two representations.",
      },
      {
        title: "Observe two representations together",
        teacherPrompt:
          "Show two representations side by side and ask what appears in both.",
        studentTask:
          "Compare two representations side by side. What appears in both?",
        whatDoINow: "Show the comparison view, then press Next.",
        expectedOutcome:
          "Students identify at least one feature present across representations.",
      },
      {
        title: "Explain the pattern",
        teacherPrompt:
          "Standard/Support: ask students to describe a pattern that repeats. Extension (Years 5-6): ask students to state the rule, then look for an exception.",
        studentTask:
          "Explain a pattern you noticed and a feature that appears in more than one representation. (Years 5-6: state the rule behind it, and try to find a case that breaks it.)",
        whatDoINow: "Ask the discussion prompt, then press Next.",
        expectedOutcome:
          "Students explain a consistent pattern; Years 5-6 students state and test a rule.",
      },
      {
        title: "Create your chosen representation",
        teacherPrompt:
          "Guide students to choose the representation that shows the DNA most clearly, and explain why.",
        studentTask:
          "Choose the representation you think shows the pattern most clearly, and explain your choice.",
        whatDoINow: "Give time to choose and write, then press Next.",
        expectedOutcome:
          "Students have chosen and justified their preferred representation.",
      },
      {
        title: "Reflect",
        teacherPrompt: "Ask the closing reflection question.",
        studentTask:
          "In one sentence: what does a pattern tell you about the rules behind it?",
        whatDoINow: "Ask the reflection question, then press Complete Lesson.",
        expectedOutcome:
          "Each student connects a pattern to the idea of an underlying rule.",
      },
    ]),
  },
  {
    id: "responsible-creator",
    number: 7,
    slug: "responsible-creator",
    title: "The Responsible Creator Challenge",
    shortDescription:
      "The capstone: students balance several competing needs for a Meta-Pet and its environment, then produce a habitat plan, three system rules, a cause-and-effect diagram and a trade-off explanation.",
    durationMinutes: 30,
    learningAreas: [
      "Ethical Understanding",
      "Digital Technologies",
      "Personal and Social Capability",
      "Critical and Creative Thinking",
    ],
    learningIntention:
      "Understand that responsible design balances several competing needs rather than searching for one perfect answer.",
    successCriteria: [
      "I can identify which competing need matters most in a given moment, and explain why.",
      "I can make and justify a responsible choice across privacy, care, emotion, accessibility and sharing scenarios.",
      "I can explain one trade-off, write three system rules, and complete a final reflection.",
    ],
    teacherIntroduction:
      "This capstone ties the previous six lessons together. Students meet a Meta-Pet and environment with competing needs (health, energy, curiosity, safety, trust, habitat, resources, device use) and must balance them, not chase one 'perfect' answer.",
    teacherScript:
      "You have met, built, compared, cared for, understood and studied your Meta-Pet. Its environment now has several competing needs — health, energy, curiosity, safety, trust, habitat, resources and device use. There is no single perfect answer. Let's balance them thoughtfully.",
    studentInstructions:
      "Predict which competing need matters most, make thoughtful choices across the scenarios, explain a trade-off, and design a small set of rules for a balanced habitat.",
    discussionPrompts: [
      "Which competing need did you predict would matter most, and why?",
      "What is one responsibility of a creator?",
      "Describe a trade-off you made — what did you gain, and what did you give up?",
    ],
    appDestination: "challenge",
    activityType: "create",
    evidenceType: "responsible-creator-promise",
    completionMessage:
      "You completed the Responsible Creator Challenge. You have finished all seven lessons — congratulations!",
    extensionActivity:
      "Write a short creator's promise for your Meta-Pet, and add a fourth system rule.",
    supportActivity:
      "Say one kind, responsible choice you would make for your Meta-Pet.",
    keyConcept:
      "Responsible design balances several needs rather than searching for one perfect answer.",
    materials: [
      "A shared screen or projector",
      "Optional: blocks, paper or recycled classroom materials for the habitat build",
    ],
    preparation:
      "Gather simple building materials in advance if running the Deep Dive habitat build.",
    physicalActivity:
      "Habitat Build — in small groups, students build a small physical or drawn habitat model using classroom materials (blocks, paper, recycled items), balancing at least three of the listed needs.",
    deepDiveActivity:
      "Habitat Showcase — each group presents their habitat build, states their three system rules aloud, and the class asks one respectful question about a trade-off the group made.",
    safetyNotes: "",
    requiredFeatureFlags: [],
    usesDemonstrationPet: false,
    usesStudentRealPet: true,
    persistChanges: true,
    resetAtCompletion: false,
    preview: {
      mainIdea:
        "Creating and caring for a Meta-Pet carries real responsibility: balancing several needs, not chasing one perfect answer.",
      majorInteraction:
        "Predict a priority need, make and justify responsible choices, then design three system rules and a cause-and-effect diagram for a balanced habitat.",
      expectedOutcome:
        "Students reflect on what makes a caring, responsible creator and produce a small habitat plan.",
      resetBehaviour:
        "This capstone can keep the student's choices; nothing is forced to reset.",
      completionPreview:
        "\"You completed the Responsible Creator Challenge and finished all seven lessons.\"",
    },
    steps: buildSteps("responsible-creator", [
      {
        title: "Notice the competing needs",
        teacherPrompt:
          "Recap the six earlier lessons briefly, then introduce the environment's competing needs: health, energy, curiosity, safety, trust, habitat, resources, device use.",
        studentTask:
          "Notice the competing needs in your Meta-Pet's environment. Recall one thing you learned in an earlier lesson.",
        whatDoINow: "Recap the journey and introduce the needs, then press Next.",
        expectedOutcome:
          "Students can name several competing needs and recall earlier learning.",
      },
      {
        title: "Predict the priority need",
        teacherPrompt:
          "Ask students to predict which competing need would cause the biggest problem if ignored.",
        studentTask:
          "Predict: which need do you think would cause the biggest problem if it were ignored? Why?",
        whatDoINow: "Take a prediction, then press Next.",
        expectedOutcome:
          "Students have predicted and justified a priority need.",
      },
      {
        title: "Act: privacy, care and difference choices",
        teacherPrompt:
          "Work through the privacy, care and difference scenarios. Choose the responsible action.",
        studentTask:
          "Make a choice for each scenario: privacy, care and difference.",
        whatDoINow: "Let students choose, discuss feedback, then press Next.",
        expectedOutcome:
          "Students have made and seen feedback on three responsible-choice scenarios.",
      },
      {
        title: "Observe more choices in action",
        teacherPrompt:
          "Now the emotion, accessibility and sharing scenarios.",
        studentTask:
          "Make a choice for each scenario: emotion, accessibility and sharing, and observe the feedback.",
        whatDoINow: "Let students choose, discuss feedback, then press Next.",
        expectedOutcome:
          "Students have made and seen feedback on three more responsible-choice scenarios.",
      },
      {
        title: "Explain a trade-off",
        teacherPrompt:
          "Ask students to explain one trade-off: a time they couldn't fully satisfy two needs at once.",
        studentTask:
          "Explain one trade-off you made: what did you gain, and what did you decide to give up?",
        whatDoINow: "Ask the discussion prompt, then press Next.",
        expectedOutcome:
          "Students can explain a genuine trade-off, not just a single 'correct' choice.",
      },
      {
        title: "Create your habitat plan",
        teacherPrompt:
          "Guide students to design three system rules and one cause-and-effect diagram for a balanced habitat, then write their promise.",
        studentTask:
          "Create your habitat plan: write three system rules, one cause-and-effect diagram (cause → effect), and your responsible creator promise.",
        whatDoINow: "Give time to complete the plan and promise, then press Next.",
        expectedOutcome:
          "Students have produced three system rules, a cause-and-effect diagram and a promise.",
      },
      {
        title: "Reflect",
        teacherPrompt:
          "Celebrate finishing all seven lessons and ask the final reflection question.",
        studentTask:
          "In one sentence: what does it mean to be a responsible creator?",
        whatDoINow: "Celebrate, ask the reflection question, then press Complete Lesson.",
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
