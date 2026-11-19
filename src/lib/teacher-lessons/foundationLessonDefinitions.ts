/**
 * F–2 unplugged starter set — runnable lesson definitions.
 *
 * Identity comes from {@link FOUNDATION_SESSIONS}. This file supplies the
 * teacher script, five guided steps, success criteria and support/extension
 * so the shared Lesson Runner can present each session without a companion.
 */

import {
  FOUNDATION_SESSIONS,
  type FoundationSession,
} from "@/lib/schools/foundationSequence";
import type { LessonAudienceBand } from "@/lib/schools/lessonYearBands";

import type {
  LessonDefinition,
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

interface StepCopy {
  title: string;
  teacherPrompt: string;
  studentTask: string;
  whatDoINow: string;
  expectedOutcome: string;
}

interface FoundationRuntimeSpec {
  id: LessonId;
  yearBand: LessonAudienceBand;
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

const UNPLUGGED_CONTRACT = {
  usesDemonstrationPet: false,
  usesStudentRealPet: false,
  persistChanges: false,
  resetAtCompletion: true,
} as const;

function buildSteps(lessonId: LessonId, phases: StepCopy[]): LessonStepDefinition[] {
  return phases.map((phase, index) => ({
    id: `${lessonId}-step-${index + 1}`,
    order: index + 1,
    kind: STEP_KINDS[index] ?? "complete",
    title: phase.title,
    teacherPrompt: phase.teacherPrompt,
    studentTask: phase.studentTask,
    whatDoINow: phase.whatDoINow,
    expectedOutcome: phase.expectedOutcome,
  }));
}

const FOUNDATION_RUNTIME: Record<string, FoundationRuntimeSpec> = {
  "meet-a-system": {
    id: "meet-a-system",
    yearBand: "foundation",
    successCriteria: [
      "I can point to a digital system in the classroom.",
      "I can point to a part I can touch (hardware).",
      "I can say the job we used the system for (the purpose).",
    ],
    teacherScript:
      "A system helps us do a job. Hardware is a part we can touch. Software is the instructions we cannot touch, like a program or an app. Let's look at one digital system, point to a part we can touch, and use it for one job.",
    studentInstructions:
      "Look at the system. Point to a part you can touch. Help use it for one job.",
    shortDescription:
      "Students recognise one classroom digital system, point to a hardware part, and explore it for one purpose. Fully unplugged; no student devices or accounts.",
    discussionPrompts: [
      "What job did this system help us do?",
      "What part could we touch?",
      "How did we know the system was doing the job?",
    ],
    completionMessage:
      "You recognised a digital system, pointed to a part you can touch, and used it for a job.",
    extensionActivity:
      "Draw the system and label one part you can touch and the job it did.",
    supportActivity:
      "Point to the hardware part the teacher named, and repeat the job in one word or by pointing to a picture of that job.",
    mainIdea:
      "A digital system has hardware we can touch and software that is the instructions, and we use it for a purpose.",
    majorInteraction:
      "Look at one classroom digital system, point to a hardware part, and use it for one job.",
    expectedOutcome:
      "Every student can point to the system, point to a touchable part, and show or say the purpose.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"A system helps us do a job. Hardware is a part we can touch. Software is the instructions we cannot touch.\"",
        studentTask: "Look at the teacher and the system.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class is looking at the teacher and the system.",
      },
      {
        title: "Find a part we can touch",
        teacherPrompt:
          "Show the classroom digital system. Point to one hardware part and say its name. Ask everyone to point to it from their place, so the class does not need to crowd around the device.",
        studentTask: "Point to a part you can see and could touch.",
        whatDoINow: "Name one hardware part, then press Next.",
        expectedOutcome: "Students have pointed to a hardware part.",
      },
      {
        title: "Use it for one job",
        teacherPrompt:
          "Use the system for one purpose only, for example turning on a screen, showing the time, or playing one sound. If it is safe, invite one or two students to try the same one action. No photos and no names.",
        studentTask: "Watch the job, then help with one action if the teacher asks.",
        whatDoINow: "Do the one action, then press Next.",
        expectedOutcome: "The class has seen the system used for one purpose.",
      },
      {
        title: "Say the job",
        teacherPrompt:
          "Ask: \"What job did this system help us do?\" Take two or three answers. Students may speak, point or use thumbs.",
        studentTask: "Tell a partner, or show with thumbs, what job the system did.",
        whatDoINow: "Take two or three answers, then press Next.",
        expectedOutcome: "Students can show or say the purpose.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say that this lesson is finished. Students may point to the hardware part and the job, or draw them. No names or photos.",
        studentTask: "Point to, or draw, one part and the job.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished and nothing about a student is kept on paper in this pack.",
      },
    ],
  },
  "show-it-two-ways": {
    id: "show-it-two-ways",
    yearBand: "foundation",
    successCriteria: [
      "I can show data as a real object.",
      "I can show the same data as a picture.",
      "I can show the same data as a simple symbol.",
    ],
    teacherScript:
      "Data is information we can show. We can show the same data as a real object, as a picture, and as a simple symbol. Let's take one thing and show it in those three ways.",
    studentInstructions:
      "Use one object. Draw a picture of it. Show a simple symbol that stands for the same thing.",
    shortDescription:
      "Students represent the same data as an object, a picture and a symbol. Fully unplugged; no student devices, names or photos.",
    discussionPrompts: [
      "Do these three things show the same data?",
      "Which way was easiest to understand?",
      "How do you know they belong together?",
    ],
    completionMessage:
      "You showed the same data as an object, a picture and a symbol.",
    extensionActivity:
      "Choose a second object and show it in the same three ways.",
    supportActivity:
      "Point to the object, the picture and the symbol when the teacher names each one.",
    mainIdea:
      "The same data can be shown as an object, a picture and a symbol.",
    majorInteraction:
      "Take one classroom object and represent it as a picture and a simple symbol.",
    expectedOutcome:
      "Every student can point to all three representations and say they show the same thing.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"Data is information. We can show the same data as an object, a picture and a symbol.\"",
        studentTask: "Look at the teacher.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class is listening and looking.",
      },
      {
        title: "Watch three ways",
        teacherPrompt:
          "Hold up one object, show a drawing of it, and show a simple symbol (for example a short line for a pencil). Name each way as you show it.",
        studentTask: "Point to the object, the picture and the symbol when they are named.",
        whatDoINow: "Show the three ways, then press Next.",
        expectedOutcome: "Students have seen the same data in three representations.",
      },
      {
        title: "Show your three ways",
        teacherPrompt:
          "Give each pair or table one everyday object. They draw a picture of it and make or copy a simple symbol. Help pre-readers by letting them point and copy. No names on the work unless your usual classroom practice requires it, and do not collect photos.",
        studentTask: "Show your object, draw it, and make a simple symbol.",
        whatDoINow: "Give time to make the three ways, then press Next.",
        expectedOutcome: "Each pair has an object, a picture and a symbol for the same data.",
      },
      {
        title: "Do they show the same data?",
        teacherPrompt:
          "Ask: \"Do these three show the same data? How do you know?\" Students may speak, point or use thumbs.",
        studentTask: "Point to your three ways and show that they belong together.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can say or show that the three representations match.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. For the exit, students point to or circle the object, picture and symbol. Thumbs: I can show data in more than one way.",
        studentTask: "Point to or circle your three ways.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished without collecting names or photos.",
      },
    ],
  },
  "what-is-mine-to-keep": {
    id: "what-is-mine-to-keep",
    yearBand: "foundation",
    successCriteria: [
      "I can point to an example of data that is personal and owned.",
      "I can point to an example of data that is not personal.",
      "I can say that some data is mine to keep.",
    ],
    teacherScript:
      "Some information is about a person, and some of that information is theirs to keep. I have example cards ready. We will look only at my cards and decide: is this personal data that someone owns, or is it not? We will not write our names, share photos of ourselves, or tell personal details.",
    studentInstructions:
      "Look at the teacher's card. Point or use thumbs to show if the data is personal and owned, or not personal.",
    shortDescription:
      "Students identify some data that is personal and owned, using only teacher-prepared generic examples. No names, photos or personal details are collected.",
    discussionPrompts: [
      "Point to one of the teacher's cards that shows data someone should keep.",
      "How did you decide if an example was personal?",
      "What should we do if we are not sure?",
    ],
    completionMessage:
      "You identified some data that is personal and owned, and some data that is not.",
    extensionActivity:
      "Sort one more teacher-prepared card, such as a card that says “a drawing someone made” or “how many chairs are in the room”, and point to the group it belongs in.",
    supportActivity:
      "When the teacher holds up an example, point to the matching hoop after a classmate has modelled it.",
    mainIdea:
      "Some data is personal and owned by a person, and some data is not.",
    majorInteraction:
      "Sort teacher-prepared examples into personal-and-owned or not-personal, by pointing, thumbs or walking to a hoop.",
    expectedOutcome:
      "Every student can show one personal example and one that is not personal.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"Some information is about a person, and some of that information is theirs to keep. We will not write our names or share photos today.\"",
        studentTask: "Look at the teacher and the two hoops or signs.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class understands that no names or photos will be collected.",
      },
      {
        title: "See the two groups",
        teacherPrompt:
          "Show two labelled hoops or signs: \"Personal and owned\" and \"Not personal.\" Add a simple picture on each, such as a lock and a classroom object, so pre-readers can use them. Hold up one clearly not-personal card (for example, a card that says \"how many windows are in the room\") and one generic personal card (for example, a card that says \"a drawing someone made\" or \"a photo of a person\"). Use words or simple drawings on the cards. Do not use a real photograph, a voice recording, or anyone's actual work from the class.",
        studentTask: "Look at the two groups and the teacher's examples.",
        whatDoINow: "Show one example in each group, then press Next.",
        expectedOutcome: "Students can see the two groups.",
      },
      {
        title: "Sort a few examples",
        teacherPrompt:
          "Read or show three to five prepared cards. After each one, students point or use thumbs. Walking to a hoop is optional if you have space and time. Use only generic cards, for example: \"a drawing someone made\"; \"a photo of a person\"; \"a recording of someone's voice\"; \"how many chairs are in the room\"; \"the colour of the classroom door\". Do not use real student names, addresses, birthdays, photographs, voice recordings, or a student's actual work.",
        studentTask: "Show which group each example belongs to.",
        whatDoINow: "Sort a few examples, then press Next.",
        expectedOutcome: "The class has sorted several examples without sharing personal details.",
      },
      {
        title: "Which card should someone keep?",
        teacherPrompt:
          "Ask students to point to one of the teacher's cards that shows data someone should keep. They may also give a thumbs-up to a card you hold up. Do not ask children to tell personal details or to invent a new example about themselves.",
        studentTask: "Point to one of the teacher's cards that shows data someone should keep.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can identify some personal data without sharing their own.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. For the exit, thumbs or point: one personal example and one that is not. Collect no names, photos or personal details.",
        studentTask: "Point to one personal example and one that is not.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session ends with no student data collected.",
      },
    ],
  },
  "parts-of-a-system": {
    id: "parts-of-a-system",
    yearBand: "years-1-2",
    successCriteria: [
      "I can identify a digital system in the classroom.",
      "I can name two or more of its components.",
      "I can say the purpose we used it for.",
    ],
    teacherScript:
      "A digital system has parts, called components. Hardware is a part we can touch, such as a screen or a button. Software is the instructions we cannot touch, such as a program or an app. Let's look at one digital system, name more than one of its components, and use it for one purpose.",
    studentInstructions:
      "Name two or more components of the system, then help use it for one purpose.",
    shortDescription:
      "Students identify a digital system, explore its components, and use it for a purpose. Fully unplugged for students; the teacher may use one classroom device already in the room.",
    discussionPrompts: [
      "Which components did we need for the job we tried?",
      "Which parts were hardware, and which were software?",
      "Could the system do the job if one component was missing?",
    ],
    completionMessage:
      "You identified a digital system, named components, and used it for a purpose.",
    extensionActivity:
      "Name one more component and say whether it is hardware or software.",
    supportActivity:
      "Point to two components the teacher has already named, and repeat the purpose in a short phrase.",
    mainIdea:
      "A digital system has components, and we can explore those components for a purpose.",
    majorInteraction:
      "Name two or more components of a classroom digital system and use it for one purpose.",
    expectedOutcome:
      "Every student can name or point to two components and say the purpose.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"A digital system has parts, called components. Some we can touch. Some are the instructions.\"",
        studentTask: "Look at the teacher and the system.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class is looking at the system.",
      },
      {
        title: "Name the components",
        teacherPrompt:
          "Show one classroom digital system. Name two or more components (for example a screen, a button or keyboard, and the program or app that is running). Ask students to repeat or point from their place, so the class does not need to crowd around the device.",
        studentTask: "Point to, or name, two components.",
        whatDoINow: "Name at least two components, then press Next.",
        expectedOutcome: "Students have identified more than one component.",
      },
      {
        title: "Use it for one purpose",
        teacherPrompt:
          "Use the system for one purpose, and say which components you are using. If it is safe, invite a student or two to try the same one action. No photos and no names.",
        studentTask: "Watch which components are used for the job, and help with one action if asked.",
        whatDoINow: "Complete the one purpose, then press Next.",
        expectedOutcome: "The class has explored the system for a purpose.",
      },
      {
        title: "Which parts did the job need?",
        teacherPrompt:
          "Ask: \"Which components did we need for the job we tried?\" Take a few answers. Students may speak or point.",
        studentTask: "Tell a partner which components the job needed.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can connect components to the purpose.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: draw or point to two components and the purpose. No names or photos.",
        studentTask: "Point to, or draw, two components and the job.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "the-same-data-many-ways": {
    id: "the-same-data-many-ways",
    yearBand: "years-1-2",
    successCriteria: [
      "I can show data as a picture and as a symbol.",
      "I can show the same data as a number and as a word.",
      "I can say what stayed the same across those ways.",
    ],
    teacherScript:
      "The same data can be shown as a picture, a symbol, a number and a word. Let's take one simple piece of classroom data and show it in all four ways, then say what stayed the same.",
    studentInstructions:
      "Show one piece of data as a picture, a symbol, a number and a word, then say what stayed the same.",
    shortDescription:
      "Students represent the same data as pictures, symbols, numbers and words. Fully unplugged; no student devices, names or photos.",
    discussionPrompts: [
      "What stayed the same when we showed the data in four ways?",
      "Which way would you use to tell someone quickly?",
      "How do you know the four ways belong together?",
    ],
    completionMessage:
      "You showed the same data as a picture, a symbol, a number and a word.",
    extensionActivity:
      "Choose a second piece of classroom data, such as how many books are in a pile, and show it in the same four ways.",
    supportActivity:
      "Point to each of the four teacher examples when they are named, and copy one of them.",
    mainIdea:
      "The same data can be represented as pictures, symbols, numbers and words.",
    majorInteraction:
      "Represent one piece of classroom data in four ways and name what stayed the same.",
    expectedOutcome:
      "Every student can point to all four representations and say they show the same data.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"The same data can be shown as a picture, a symbol, a number and a word.\"",
        studentTask: "Look at the teacher.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class is listening.",
      },
      {
        title: "Watch four ways",
        teacherPrompt:
          "Use one simple classroom count, for example how many pencils are in a cup. Show it as a picture, a simple symbol, a numeral, and a word. Name each way.",
        studentTask: "Point to the picture, the symbol, the number and the word when they are named.",
        whatDoINow: "Show the four ways, then press Next.",
        expectedOutcome: "Students have seen one piece of data in four representations.",
      },
      {
        title: "Show your four ways",
        teacherPrompt:
          "Give each pair a small set of countable objects. They show the same count as a picture, a symbol, a number and a word. Help with the written word if needed. No names or photos.",
        studentTask: "Show your data in four ways.",
        whatDoINow: "Give time to make the four ways, then press Next.",
        expectedOutcome: "Each pair has four representations of the same data.",
      },
      {
        title: "What stayed the same?",
        teacherPrompt:
          "Ask: \"What stayed the same when we showed the data in four ways?\" Students may speak or point to the matching set.",
        studentTask: "Tell a partner what stayed the same.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can say the four ways show the same data.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: point to or circle the four ways, then thumbs — I can show data in more than one way.",
        studentTask: "Point to or circle your four ways.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no names or photos collected.",
      },
    ],
  },
  "follow-the-steps": {
    id: "follow-the-steps",
    yearBand: "years-1-2",
    successCriteria: [
      "I can follow a sequence of steps in order.",
      "I can follow a decision in the algorithm.",
      "I can follow a repeat, then describe the steps in my own words.",
    ],
    teacherScript:
      "An algorithm is a set of steps we can follow. Today we will follow one short algorithm together. It will have a sequence — an order of steps — a decision, and a repeat. Then we will say the steps in our own words.",
    studentInstructions:
      "Follow the class algorithm, then describe the order, the decision and the repeat.",
    shortDescription:
      "Students follow and describe an unplugged algorithm that includes a sequence of steps, a decision (branching) and a repeat (iteration). No devices, names or photos.",
    discussionPrompts: [
      "What was the decision in our algorithm?",
      "What did we repeat, and when did we stop?",
      "What would happen if we changed the order of the steps?",
    ],
    completionMessage:
      "You followed an algorithm and described its sequence, decision and repeat.",
    extensionActivity:
      "Change one step, one decision or the number of repeats, then describe the new algorithm.",
    supportActivity:
      "Stand with the teacher and copy each step, then point to the card that shows the decision or the repeat.",
    mainIdea:
      "An algorithm can have a sequence of steps, a decision and a repeat, and we can follow and describe it.",
    majorInteraction:
      "Act out a short class algorithm, then describe the order, the decision and the repeat.",
    expectedOutcome:
      "Every student has followed the algorithm and can name the sequence, the decision or the repeat.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"An algorithm is a set of steps we can follow. Ours will have an order, a decision, and a repeat.\"",
        studentTask: "Look at the teacher.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class is ready to follow the steps.",
      },
      {
        title: "Hear the algorithm",
        teacherPrompt:
          "Say the algorithm slowly, and show it in simple words or pictures on the board. Use this example, or another that does not sort students by clothing, appearance or personal details: \"1. Stand up. 2. Look at the teacher's card: if it is a circle, put your hands on your head; if it is a square, put your hands on your hips. 3. Tap your shoulders three times.\" The decision should come from an object you hold, and the repeat should be a set number of times.",
        studentTask: "Listen, and look at the steps.",
        whatDoINow: "Say and show the algorithm, then press Next.",
        expectedOutcome: "Students have heard the sequence, the decision and the repeat.",
      },
      {
        title: "Follow the algorithm",
        teacherPrompt:
          "Lead the class through the algorithm once, from their places if space is tight. Pause at the decision and show the card clearly. Lead the repeat a set number of times, such as three. No devices, names or photos.",
        studentTask: "Follow the steps, make the decision from the teacher's card, and do the last step three times.",
        whatDoINow: "Run the algorithm once, then press Next.",
        expectedOutcome: "The class has followed the algorithm.",
      },
      {
        title: "Describe it",
        teacherPrompt:
          "Ask students to describe the algorithm in their own words: the order, the decision, and the repeat. They may speak, point to the board, or draw the steps.",
        studentTask: "Tell a partner the order, the decision and the repeat.",
        whatDoINow: "Take a few descriptions, then press Next.",
        expectedOutcome: "Students can describe the sequence, branching and iteration in everyday words.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: point to the sequence, the decision and the repeat on the board, or draw them. Thumbs: I can follow and describe the steps.",
        studentTask: "Point to, or draw, the order, the decision and the repeat.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "a-problem-for-someone-we-know": {
    id: "a-problem-for-someone-we-know",
    yearBand: "years-1-2",
    successCriteria: [
      "I can say who the known user is, by role, not by a student's name.",
      "I can describe a simple problem that a digital system could help with.",
      "I can talk about whether an existing digital system would meet that need.",
    ],
    teacherScript:
      "A known user is someone we can describe by their job or role, such as a librarian or a teacher, not by writing a student's name or a staff member's name. Let's look at one simple problem for a school user, and talk about whether an existing digital system would help. We will not use real student names or photos.",
    studentInstructions:
      "Investigate one simple problem for a known user, then talk about whether an existing digital system would meet that need.",
    shortDescription:
      "Students investigate a simple problem for a known user and discuss whether an existing digital system would meet that need. Fully unplugged; no names or photos.",
    discussionPrompts: [
      "Who is the user, and what do they need?",
      "Would the system we talked about meet that need?",
      "Why, or why not?",
    ],
    completionMessage:
      "You investigated a simple problem for a known user and talked about whether an existing system would meet that need.",
    extensionActivity:
      "Suggest one change that might help the user more, still without using a student's name.",
    supportActivity:
      "Point to the user card and the system card, then use thumbs to show whether the system would help.",
    mainIdea:
      "We can investigate a simple problem for a known user and discuss whether an existing digital system would satisfy that need.",
    majorInteraction:
      "Look at one school problem for a known user and discuss one existing classroom or school digital system.",
    expectedOutcome:
      "Every student can show who the user is, what the problem is, and whether the existing system would help.",
    steps: [
      {
        title: "One sentence to start",
        teacherPrompt:
          "Say only this: \"We will look at a simple problem for a school user — someone we can describe by their job, not by a student's name. Then we will talk about whether a digital system would help.\"",
        studentTask: "Look at the teacher.",
        whatDoINow: "Say the sentence. Then press Next.",
        expectedOutcome: "The class knows the user will be described by role only.",
      },
      {
        title: "Meet the user and the problem",
        teacherPrompt:
          "Introduce one known user by role only, for example the librarian, a teacher taking the roll, or the class. State one simple problem, for example needing to know when it is time to pack up. Do not use a student's name, a staff member's name, or a private need.",
        studentTask: "Listen for who the user is and what the problem is.",
        whatDoINow: "Name the user and the problem, then press Next.",
        expectedOutcome: "Students can identify the known user and the simple problem.",
      },
      {
        title: "Look at an existing system",
        teacherPrompt:
          "Show or name one existing digital system already in the school (for example a digital classroom clock, a shared screen, or a school speaker). Ask the class: could this system help the user with this problem?",
        studentTask: "Look at the existing system and think about whether it would help.",
        whatDoINow: "Show the system and the question, then press Next.",
        expectedOutcome: "Students have a real existing system to discuss.",
      },
      {
        title: "Would it meet the need?",
        teacherPrompt:
          "Ask: \"Would this system meet the user's need? Why, or why not?\" Students may speak, or use thumbs up, sideways or down, then stand if they can give a reason.",
        studentTask: "Show whether the system would meet the need, and give a reason if you can.",
        whatDoINow: "Take a few reasons, then press Next.",
        expectedOutcome: "Students have discussed whether the existing system satisfies the need.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: point to the user, the problem and the system, then thumbs for whether it would help. No names or photos.",
        studentTask: "Point to the user, the problem and the system.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
};

function toFoundationLessonDefinition(session: FoundationSession): LessonDefinition {
  const runtime = FOUNDATION_RUNTIME[session.id];
  if (!runtime) {
    throw new Error(`Missing F–2 runtime for ${session.id}`);
  }

  return {
    id: session.id,
    number: session.number,
    slug: session.slug,
    title: session.title,
    shortDescription: runtime.shortDescription,
    durationMinutes: session.minutes,
    yearBand: runtime.yearBand,
    learningAreas: ["Digital Technologies", "Oral language"],
    learningIntention: session.learningIntention,
    successCriteria: runtime.successCriteria,
    teacherIntroduction: session.teacherIntroduction,
    teacherScript: runtime.teacherScript,
    studentInstructions: runtime.studentInstructions,
    discussionPrompts: runtime.discussionPrompts,
    appDestination: "unplugged",
    activityType: "unplugged",
    steps: buildSteps(session.id, runtime.steps),
    evidenceType: "classroom-observation",
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
        "This lesson is unplugged. Nothing about a student is kept by MetaPet School.",
      completionPreview: `"${runtime.completionMessage}"`,
    },
    requiredFeatureFlags: [],
    ...UNPLUGGED_CONTRACT,
  };
}

export const FOUNDATION_LESSON_DEFINITIONS: LessonDefinition[] =
  FOUNDATION_SESSIONS.map(toFoundationLessonDefinition);
