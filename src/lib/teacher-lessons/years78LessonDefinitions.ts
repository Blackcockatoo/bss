/**
 * Years 7–8 bridge unit — runnable lesson definitions.
 *
 * Identity comes from {@link YEARS_78_SESSIONS}. This file supplies the
 * teacher script, five guided steps, success criteria and support/extension.
 * Lessons are unplugged or use only the teacher's shared screen.
 */

import {
  YEARS_78_SESSIONS,
  type Years78Session,
} from "@/lib/schools/years78Sequence";
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

interface Years78RuntimeSpec {
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

const YEARS_78_RUNTIME: Record<string, Years78RuntimeSpec> = {
  "hardware-for-the-job": {
    id: "hardware-for-the-job",
    yearBand: "years-7-8",
    successCriteria: [
      "I can name a hardware specification and say how it can affect performance.",
      "I can select appropriate hardware for a particular task.",
      "I can give a reason for that selection, using a specification.",
    ],
    teacherScript:
      "Hardware is the equipment we can touch. Its specifications — such as processing, memory, storage and display — affect how well it can do a job. We will compare prepared hardware cards against two tasks, then select appropriate hardware for each task and explain our reasons.",
    studentInstructions:
      "Read the two tasks and the hardware cards. Select hardware for each task and explain how one specification would affect performance.",
    shortDescription:
      "Students compare teacher-prepared hardware cards, explain how a specification would affect performance, and select hardware for two tasks. Unplugged or teacher screen only; no student accounts.",
    discussionPrompts: [
      "Which specification made the biggest difference to your choice?",
      "What would happen if the storage or the display was not enough for the task?",
      "When might a cheaper or simpler device still be the appropriate choice?",
    ],
    completionMessage:
      "You explained how a hardware specification can affect performance and selected appropriate hardware for a task.",
    extensionActivity:
      "For the same two tasks, name one workload that would need different hardware, and say which specification would matter most.",
    supportActivity:
      "Use the highlighted specification on each card. Complete: “For this task I would choose ___ because the ___ would affect performance by ___.”",
    mainIdea:
      "Hardware specifications affect performance, so the right device depends on the task and the workload.",
    majorInteraction:
      "Compare prepared hardware cards and select a device for each of two tasks, with a reason.",
    expectedOutcome:
      "Every student can justify a hardware choice for a given task using at least one specification.",
    steps: [
      {
        title: "The job comes first",
        teacherPrompt:
          "Say: “Hardware specifications affect performance. We will choose hardware for a job, not the most expensive device.” Show two tasks, for example: show a slideshow to a class, and edit a short video. No student accounts or personal data.",
        studentTask: "Listen to the two tasks and look at the hardware cards.",
        whatDoINow: "Show the two tasks and the cards, then press Next.",
        expectedOutcome: "The class knows the two tasks they will judge hardware against.",
      },
      {
        title: "Read the specifications",
        teacherPrompt:
          "Walk through three teacher-prepared cards, such as a tablet, a school laptop and a data projector. Point to processing, memory, storage and display as they appear. Use only the specifications on the cards; do not invent benchmark claims.",
        studentTask: "Find one specification on each card and be ready to say what it is for.",
        whatDoINow: "Talk through the cards, then press Next.",
        expectedOutcome: "Students can locate at least one specification on each card.",
      },
      {
        title: "Select hardware for each task",
        teacherPrompt:
          "In pairs, students select appropriate hardware for each task and write one sentence: how a specification would affect performance. They may use the cards or a copy shown on the teacher's screen.",
        studentTask: "Select hardware for each task and explain one specification.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Each pair has a justified selection for both tasks.",
      },
      {
        title: "Compare choices",
        teacherPrompt:
          "Take a few reasons. Ask which specification made the biggest difference, and when a simpler device might still be appropriate.",
        studentTask: "Share one reason, and listen for a different justified choice.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can compare hardware choices using specifications.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: write or say one selection and one specification. No names or personal data.",
        studentTask: "Record one hardware choice and the specification that mattered most.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "data-as-numbers": {
    id: "data-as-numbers",
    yearBand: "years-7-8",
    successCriteria: [
      "I can represent a short piece of text as integers using a teacher-provided table.",
      "I can represent a simple image as integers on a grid.",
      "I can represent a simple sound as a sequence of integers, and say what was gained or lost.",
    ],
    teacherScript:
      "Digital systems represent text, image and audio data using integers — whole numbers. We will investigate a short word, a simple grid picture, and a simple sound pattern, and see what stays the same and what is lost when we use numbers.",
    studentInstructions:
      "Use the teacher’s table and grids to represent text, an image and a sound as integers, then note one gain and one loss.",
    shortDescription:
      "Students investigate how text, image and audio can be represented as integers, using teacher-provided tables and grids. Unplugged; no student photos or recordings.",
    discussionPrompts: [
      "What stayed the same when the data became integers?",
      "What was lost in the image or the sound?",
      "Why might a digital system still use integers for all three?",
    ],
    completionMessage:
      "You represented text, image and audio data as integers and discussed what was gained or lost.",
    extensionActivity:
      "Change one integer in the image or the sound and describe how the result would change.",
    supportActivity:
      "Complete the first text example and the first row of the image grid with a partner, using the teacher’s table.",
    mainIdea:
      "Digital systems represent text, image and audio data using integers, which makes the data easy to store and process but can lose some detail.",
    majorInteraction:
      "Encode a short word, a small grid image and a simple sound as integers, then discuss gain and loss.",
    expectedOutcome:
      "Every student has integers for all three kinds of data and can name one gain or one loss.",
    steps: [
      {
        title: "Integers behind the scenes",
        teacherPrompt:
          "Say: “Digital systems represent text, image and audio using integers.” Show a tiny example, such as the letter A as a number from your table. Do not use student names, photos or recordings.",
        studentTask: "Look at the example and the teacher’s table.",
        whatDoINow: "Show the example, then press Next.",
        expectedOutcome: "The class has seen one piece of text represented as an integer.",
      },
      {
        title: "Inspect three kinds of data",
        teacherPrompt:
          "Show the three prepared materials: a short word, a 4×4 grid for an image, and a short sequence of loud/soft or pitch numbers for a sound. Say that students will investigate all three.",
        studentTask: "Identify the text, image and audio examples.",
        whatDoINow: "Show the three materials, then press Next.",
        expectedOutcome: "Students know what they will represent.",
      },
      {
        title: "Represent all three as integers",
        teacherPrompt:
          "Students use the table to turn the word into integers, fill the grid with integers (for example 0 for empty and 1 for filled, or 0–3 for brightness), and write a short sound as a sequence of integers. Stay on paper.",
        studentTask: "Represent the text, the image and the sound as integers.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Each student or pair has integers for all three kinds of data.",
      },
      {
        title: "What was gained or lost?",
        teacherPrompt:
          "Ask what stayed the same, and what was lost — for example, colour in a 0–1 image, or the tone of a real sound. Take a few answers.",
        studentTask: "Name one gain and one loss from using integers.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can discuss a trade-off in the representation.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: point to one integer representation and write one gain or loss. No photos, names or recordings.",
        studentTask: "Point to one representation and note one gain or one loss.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "why-binary": {
    id: "why-binary",
    yearBand: "years-7-8",
    successCriteria: [
      "I can convert a small integer to binary and back.",
      "I can explain how a digital system represents integers in binary.",
      "I can explain why two states are useful in digital hardware.",
    ],
    teacherScript:
      "Binary uses only 0 and 1. Digital systems represent integers in binary because hardware can hold two clear states, such as off and on. We will convert a few integers and then explain how and why this works.",
    studentInstructions:
      "Convert a few integers to binary and back, then write a short explanation of how and why digital systems use binary.",
    shortDescription:
      "Students convert integers to binary and explain how and why digital systems use two states. Fully unplugged; no student devices or accounts.",
    discussionPrompts: [
      "How does place value work in binary?",
      "Why might hardware use two states rather than ten?",
      "What happens if one bit is changed?",
    ],
    completionMessage:
      "You converted integers to binary and explained how and why digital systems use it.",
    extensionActivity:
      "Write 18 or 25 in binary, or show what happens to a number if the 4’s bit is changed.",
    supportActivity:
      "Use a place-value row (8 4 2 1). Convert 5 and 10 with a partner, ticking the columns you need.",
    mainIdea:
      "Digital systems represent integers in binary because two hardware states can stand for 0 and 1, and place value still works.",
    majorInteraction:
      "Convert a few integers using a binary place-value row, then explain why two states are useful.",
    expectedOutcome:
      "Every student can convert at least one integer and give a reason why binary is used.",
    steps: [
      {
        title: "Two states",
        teacherPrompt:
          "Say: “Binary uses 0 and 1. Hardware can represent two states, such as off and on.” Show a place-value row: 8, 4, 2, 1. No student devices are needed.",
        studentTask: "Look at the place-value row.",
        whatDoINow: "Show the row, then press Next.",
        expectedOutcome: "The class can see how binary place value will be used.",
      },
      {
        title: "Watch one conversion",
        teacherPrompt:
          "Work 5 and 10 as a class: 5 is 0101, 10 is 1010, if you are using four bits. Say how you add the place values. Do not rush the first example.",
        studentTask: "Follow the first two conversions and copy them if it helps.",
        whatDoINow: "Convert 5 and 10 together, then press Next.",
        expectedOutcome: "Students have seen how and that integers can be written in binary.",
      },
      {
        title: "Convert a few integers",
        teacherPrompt:
          "Students convert 3, 6 and 13 to binary, and convert one binary number back, such as 1110. They may use the place-value row. Stay on paper.",
        studentTask: "Convert the given integers to binary and one binary number back.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Students have practised conversion in both directions.",
      },
      {
        title: "How and why",
        teacherPrompt:
          "Ask how a digital system represents integers in binary, and why two states are useful in hardware. Take a few answers. Keep the explanation tied to off/on and place value, not to extra claims.",
        studentTask: "Explain how binary works, and why two states are useful.",
        whatDoINow: "Take a few explanations, then press Next.",
        expectedOutcome: "Students can explain how and why binary is used.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: write one integer in binary and one sentence about why two states are useful. No student data.",
        studentTask: "Write one conversion and one short reason.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "trace-the-algorithm": {
    id: "trace-the-algorithm",
    yearBand: "years-7-8",
    successCriteria: [
      "I can trace an algorithm and record the values as I go.",
      "I can predict the output for a given input.",
      "I can identify an error and say how to correct it.",
    ],
    teacherScript:
      "To trace an algorithm is to follow each step, keep track of the values, and predict the output. We will trace a short prepared algorithm, predict the output for a given input, then find and correct an error.",
    studentInstructions:
      "Trace the algorithm on paper, predict the output for the given input, then find and correct the error.",
    shortDescription:
      "Students trace a teacher-prepared algorithm, predict output for a given input, and identify an error. Unplugged; no student accounts.",
    discussionPrompts: [
      "What output did you predict, and how did you get it?",
      "Which step revealed the error?",
      "What would change in the output after the correction?",
    ],
    completionMessage:
      "You traced an algorithm, predicted an output, and identified an error.",
    extensionActivity:
      "Change the input and predict the new output for the corrected algorithm.",
    supportActivity:
      "Use the trace table with the columns already labelled. Work the first two steps with a partner, then continue.",
    mainIdea:
      "Tracing an algorithm step by step lets us predict output for a given input and find errors.",
    majorInteraction:
      "Complete a trace table, predict an output, then locate and correct an error in the prepared algorithm.",
    expectedOutcome:
      "Every student has a trace, a predicted output, and a marked error with a correction.",
    steps: [
      {
        title: "What a trace is",
        teacherPrompt:
          "Say: “We will follow this algorithm step by step, write the values, and predict the output before we trust it.” Show the prepared algorithm and an empty trace table. Suggested algorithm: total starts at 0; for each number in a short list, if the number is greater than 3, add it to total; at the end, output total. Include one error, for example adding every number, or starting total at 1. Use this example or another short, non-personal one.",
        studentTask: "Look at the algorithm and the trace table.",
        whatDoINow: "Show the algorithm and table, then press Next.",
        expectedOutcome: "The class can see the algorithm they will trace.",
      },
      {
        title: "Predict before you trust it",
        teacherPrompt:
          "Give the input, for example the list 2, 5, 3, 7. Students first write a prediction for the intended rule (add numbers greater than 3). Then they begin the trace of the algorithm as written, including its error.",
        studentTask: "Write a predicted output for the given input, then start the trace.",
        whatDoINow: "Give the input and start the trace, then press Next.",
        expectedOutcome: "Students have a prediction and have begun recording values.",
      },
      {
        title: "Find the error",
        teacherPrompt:
          "Students finish the trace of the algorithm as written, compare it with their prediction, and mark the step that causes the error. Then they write a correction.",
        studentTask: "Finish the trace, identify the error, and write a correction.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Students have found and corrected the error.",
      },
      {
        title: "What the trace showed",
        teacherPrompt:
          "Compare predicted and traced outputs. Ask which step revealed the error, and what the corrected output should be.",
        studentTask: "Say which step revealed the error and what the corrected output is.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "Students can explain how the trace helped them find the error.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: leave the completed trace table and the correction. No student data is collected.",
        studentTask: "Keep the trace, the predicted output and the correction.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "design-an-algorithm": {
    id: "design-an-algorithm",
    yearBand: "years-7-8",
    successCriteria: [
      "I can design a short algorithm that includes a nested control structure.",
      "I can represent that algorithm as a flowchart.",
      "I can represent the same algorithm as pseudocode.",
    ],
    teacherScript:
      "A nested control structure is a decision or a repeat placed inside another decision or repeat. We will design a short algorithm for a school task, include one nested structure, and represent the same algorithm as a flowchart and as pseudocode.",
    studentInstructions:
      "Design a short algorithm with one nested decision or repeat, then show it as a flowchart and as pseudocode.",
    shortDescription:
      "Students design an algorithm with a nested control structure and represent it as a flowchart and as pseudocode. Unplugged, on paper or the board.",
    discussionPrompts: [
      "Where is the nested structure in your algorithm, and why is it there?",
      "Did the flowchart and the pseudocode show the same steps?",
      "What would happen if the inner decision were removed?",
    ],
    completionMessage:
      "You designed an algorithm with a nested control structure and represented it as a flowchart and as pseudocode.",
    extensionActivity:
      "Add one more condition or repeat, still nested, and update both representations.",
    supportActivity:
      "Use the prepared school task and the starter flowchart shapes. Place the inner decision in the box already marked “inside the repeat”.",
    mainIdea:
      "The same algorithm can be designed with a nested control structure and shown as both a flowchart and pseudocode.",
    majorInteraction:
      "Design a short school-task algorithm with one nested structure, then draw a flowchart and write pseudocode.",
    expectedOutcome:
      "Every student has both representations and can point to the nested structure.",
    steps: [
      {
        title: "Nested structures, two representations",
        teacherPrompt:
          "Say: “Today we will design one short algorithm, include a nested structure, and show it as a flowchart and as pseudocode.” Give a school task that needs a repeat and a decision inside it, for example: for each book in a return pile, if it is marked overdue, put it on the reminder tray, else put it on the shelf; repeat until the pile is empty. Do not use student names or personal data.",
        studentTask: "Listen to the task and look at the flowchart shapes and pseudocode example.",
        whatDoINow: "Show the task and a tiny example of nesting, then press Next.",
        expectedOutcome: "The class understands the task and the two representations.",
      },
      {
        title: "Look at a model",
        teacherPrompt:
          "Show a short model flowchart and the matching pseudocode for the return-pile task, or an equally simple school task. Point to the inner decision inside the repeat.",
        studentTask: "Point to the nested structure in the model.",
        whatDoINow: "Talk through the model, then press Next.",
        expectedOutcome: "Students can identify a nested structure in a model.",
      },
      {
        title: "Design both representations",
        teacherPrompt:
          "Students design the algorithm, or a close variant of it, and produce both a flowchart and pseudocode. They must include and label one nested structure. Work on paper.",
        studentTask: "Design the algorithm and show it as a flowchart and as pseudocode.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Each student or pair has both representations.",
      },
      {
        title: "Check the two views",
        teacherPrompt:
          "Partners swap and check that the flowchart and pseudocode match, and that the nested structure is present. Take one or two examples for the class.",
        studentTask: "Check a partner’s two representations and point to the nested structure.",
        whatDoINow: "Run the partner check, then press Next.",
        expectedOutcome: "Students can confirm both representations show the same algorithm.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: leave both representations with the nested structure labelled. No student data is collected.",
        studentTask: "Keep the flowchart and the pseudocode, with the nested structure labelled.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "what-data-is-essential": {
    id: "what-data-is-essential",
    yearBand: "years-7-8",
    successCriteria: [
      "I can identify data that an existing system collects, using a teacher-prepared description.",
      "I can assess whether that data is essential to the system’s purpose.",
      "I can suggest one way the digital footprint could be managed.",
    ],
    teacherScript:
      "A digital footprint is the data a system collects and keeps about people who use it. We will investigate a teacher-prepared description of an existing kind of system, sort what it collects into essential and not essential for its purpose, and suggest one way to manage the footprint. We will not log in, and we will not investigate anyone’s real footprint.",
    studentInstructions:
      "Read the prepared system description, sort each data item as essential or not essential, and suggest one way to manage the footprint.",
    shortDescription:
      "Students investigate a teacher-prepared system description, assess whether collected data is essential, and suggest a way to manage the footprint. No logins and no real student footprints.",
    discussionPrompts: [
      "Which item was essential to the purpose, and why?",
      "Which item was not essential?",
      "How could that footprint be managed?",
    ],
    completionMessage:
      "You investigated a system’s digital footprint, assessed what was essential, and suggested a way to manage it.",
    extensionActivity:
      "Suggest a second management step, such as deleting data after a set time, still using only the prepared example.",
    supportActivity:
      "Sort the cards with a partner. Start with two obvious items already discussed as a class.",
    mainIdea:
      "Existing systems collect a digital footprint; some of that data is essential to the purpose and some is not, and the footprint can be managed.",
    majorInteraction:
      "Sort prepared data items for a generic system and suggest one way to manage the footprint.",
    expectedOutcome:
      "Every student can classify at least one item and suggest one management step, using only the prepared example.",
    steps: [
      {
        title: "A footprint is data a system keeps",
        teacherPrompt:
          "Say: “A digital footprint is data a system collects and keeps. Today we will use only a prepared example. We will not log in, and we will not inspect anyone’s real account or footprint.”",
        studentTask: "Listen to the rule for this lesson.",
        whatDoINow: "State the rule clearly, then press Next.",
        expectedOutcome: "The class knows they will not use real accounts or personal data.",
      },
      {
        title: "Read the prepared system",
        teacherPrompt:
          "Give a generic, fictional system description, for example a school sports-results website that can show scores. List items such as: the team name, the score, a student year of birth, a home address, a photo of a person, and the date of the match. These must be invented examples, not data about the class.",
        studentTask: "Read the system’s purpose and the list of data it collects.",
        whatDoINow: "Show the purpose and the list, then press Next.",
        expectedOutcome: "Students know the purpose they will judge the data against.",
      },
      {
        title: "Essential or not?",
        teacherPrompt:
          "Students sort each item into Essential to the purpose or Not essential, and write one sentence suggesting how the footprint could be managed, for example not collecting an item, or deleting it when it is no longer needed.",
        studentTask: "Sort the items and suggest one way to manage the footprint.",
        whatDoINow: "Give working time, then press Next.",
        expectedOutcome: "Students have classified the items and suggested a management step.",
      },
      {
        title: "What should be managed?",
        teacherPrompt:
          "Compare a few sorts. Ask which item was not essential, and how the footprint could be managed. Remind students not to volunteer personal information.",
        studentTask: "Share one not-essential item and one management step.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "The class can discuss footprint management without using personal data.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: leave the sorted list and one management sentence. Collect no names, logins or personal data.",
        studentTask: "Keep the sorted list and one management suggestion.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "evaluate-a-system-for-a-user": {
    id: "evaluate-a-system-for-a-user",
    yearBand: "years-7-8",
    successCriteria: [
      "I can write a user story and two or three design criteria for a real-world school problem.",
      "I can decompose the problem into parts.",
      "I can evaluate an existing system against the user story, the criteria and a possible future impact.",
    ],
    teacherScript:
      "A user story describes a user by role, what they need, and why. Design criteria are the tests we will use to judge a solution. We will define a simple school problem, decompose it, write one user story and two or three criteria, then evaluate an existing system — on paper or on the teacher’s screen only — including one possible future impact.",
    studentInstructions:
      "Write a user story and design criteria, decompose the problem, then evaluate the existing system and note one possible future impact.",
    shortDescription:
      "Students define and decompose a school problem with a user story and design criteria, then evaluate an existing system, including a possible future impact. Teacher screen or paper only; no logins or student names.",
    discussionPrompts: [
      "Did the system meet the user story and the criteria?",
      "What possible future impact should be considered?",
      "Which part of the problem is still unsolved?",
    ],
    completionMessage:
      "You defined a problem with a user story and design criteria, and evaluated an existing system against them, including a possible future impact.",
    extensionActivity:
      "Suggest one change to the existing system that would better meet a criterion, still without using a student’s name.",
    supportActivity:
      "Use the sentence starters: “As a ___, I need ___ so that ___.” “One design criterion is ___.” “The system does / does not meet this because ___.”",
    mainIdea:
      "A problem can be defined and decomposed with a user story and design criteria, then an existing system can be evaluated against those tests and a possible future impact.",
    majorInteraction:
      "Write a user story and criteria, then evaluate a paper mock or teacher-screen example of an existing system.",
    expectedOutcome:
      "Every student has a user story, at least two criteria, a judgement, and one possible future impact.",
    steps: [
      {
        title: "The problem and the user",
        teacherPrompt:
          "Give a school problem that does not require student personal data, for example: a librarian needs to know which copies of a book are on the shelf so they can help someone find it. Say the user will be described by role, not by a person’s name. No logins.",
        studentTask: "Listen to the problem and who the user is.",
        whatDoINow: "State the problem and the user role, then press Next.",
        expectedOutcome: "The class has a real-world problem and a user described by role.",
      },
      {
        title: "Decompose, write a story and criteria",
        teacherPrompt:
          "As a class, decompose the problem into parts, for example: know which copies exist, know which are on the shelf, and show that quickly. Students then write one user story and two or three design criteria, such as accuracy, speed, and not needing a student’s personal data.",
        studentTask: "Write a user story and two or three design criteria.",
        whatDoINow: "Decompose the problem, then give writing time, and press Next.",
        expectedOutcome: "Students have a user story and design criteria.",
      },
      {
        title: "Evaluate the existing system",
        teacherPrompt:
          "Show an existing system on paper or on the teacher’s screen only, for example a simple catalogue mock or a handwritten list. Students evaluate it against the user story and each criterion, and note one possible future impact, such as what happens if the list is out of date or if extra personal data were added later.",
        studentTask: "Evaluate the system against your story and criteria, and note one possible future impact.",
        whatDoINow: "Show the system and give evaluation time, then press Next.",
        expectedOutcome: "Students have a judgement and a future-impact note.",
      },
      {
        title: "What did the tests show?",
        teacherPrompt:
          "Take a few evaluations. Ask whether the system met the user story, which criteria it met or missed, and what future impact should be considered.",
        studentTask: "Share one judgement and one possible future impact.",
        whatDoINow: "Take a few answers, then press Next.",
        expectedOutcome: "The class has discussed the evaluation in terms of the tests they wrote.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Say the lesson is finished. Exit: leave the user story, criteria, judgement and future-impact note. No names, logins or personal data.",
        studentTask: "Keep the user story, criteria, judgement and future-impact note.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
};

function toYears78LessonDefinition(session: Years78Session): LessonDefinition {
  const runtime = YEARS_78_RUNTIME[session.id];
  if (!runtime) {
    throw new Error(`Missing Years 7–8 runtime for ${session.id}`);
  }

  return {
    id: session.id,
    number: session.number,
    slug: session.slug,
    title: session.title,
    shortDescription: runtime.shortDescription,
    durationMinutes: session.minutes,
    yearBand: runtime.yearBand,
    learningAreas: ["Digital Technologies"],
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
        "This lesson is unplugged or uses only the teacher’s shared screen. Nothing about a student is kept by MetaPet School.",
      completionPreview: `"${runtime.completionMessage}"`,
    },
    requiredFeatureFlags: [],
    ...UNPLUGGED_CONTRACT,
  };
}

export const YEARS_78_LESSON_DEFINITIONS: LessonDefinition[] =
  YEARS_78_SESSIONS.map(toYears78LessonDefinition);
