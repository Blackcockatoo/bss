/**
 * Years 5–8 topical mini-lessons — runnable lesson definitions.
 *
 * Identity comes from {@link TOPICAL_SESSIONS}. This file supplies the
 * teacher script, five guided steps, success criteria and support/extension.
 * Lessons are unplugged.
 */

import {
  TOPICAL_SESSIONS,
  type TopicalSession,
} from "@/lib/schools/topicalSequence";
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

interface TopicalRuntimeSpec {
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

const TOPICAL_RUNTIME: Record<string, TopicalRuntimeSpec> = {
  "chatbots-and-checking": {
    id: "chatbots-and-checking",
    yearBand: "years-5-8",
    successCriteria: [
      "I can explain, in my own words, how a chatbot makes text.",
      "I can give one reason a fluent reply can still be wrong.",
      "I can check a prepared reply against a fact card and say whether it matches.",
      "I can write a short user story and two design criteria, then judge the fictional chatbot and suggest one change.",
    ],
    teacherScript:
      "A chatbot is a computer program that writes a reply in everyday language. One simple way to think about it is this: it keeps choosing a next word that often followed the words before it in a large collection of text. That can sound fluent, and it can still be wrong, because the program is not checking a trusted source unless a person does that. Today we will check prepared replies against a fact card I will give you. We will not open a live chatbot, and we will not type anyone’s name or personal information.",
    studentInstructions:
      "Listen to the model. Then check each prepared reply against the fact card, write a short user story and two design criteria, and judge the fictional chatbot.",
    shortDescription:
      "A 25-minute unplugged lesson on how chatbots make text, why a fluent reply can be wrong, and how to check an answer against a trusted source.",
    discussionPrompts: [
      "Why can a reply sound confident and still be wrong?",
      "What would make a trusted source good enough to check against?",
      "What might happen if someone copied a wrong reply into their work?",
    ],
    completionMessage:
      "You have checked prepared chatbot replies against a fact card and judged the design against your criteria. Nothing about you was collected.",
    extensionActivity:
      "Write one more design criterion, such as “the reply says when it is unsure”, and judge the same fictional chatbot against it.",
    supportActivity:
      "Check the first reply with a partner using the fact card. Complete: “This reply matches / does not match the fact card because ___.”",
    mainIdea:
      "A chatbot can write fluent text without checking a trusted source, so a person needs to check a reply before relying on it.",
    majorInteraction:
      "Students check prepared replies against a teacher-provided fact card, then evaluate a fictional chatbot against a user story and design criteria.",
    expectedOutcome:
      "Students can explain the unplugged model, give a reason a reply can be wrong, and complete a check against the fact card.",
    steps: [
      {
        title: "Meet the idea",
        teacherPrompt:
          "Read the script. Use three word cards on the board if it helps: prompt, next word, reply. Stress that we will not open a live chatbot and will not type personal information.",
        studentTask: "Listen to how a chatbot makes text, and hear why a fluent reply can still be wrong.",
        whatDoINow: "Check that students can repeat the model in their own words, then press Next.",
        expectedOutcome: "Students have heard the unplugged model and the reason a reply can be wrong.",
      },
      {
        title: "See a worked check",
        teacherPrompt:
          "Show one prompt, one fact card, and two replies. Think aloud as you check each reply against the fact card. Mark one as a match and one as fluent but wrong.",
        studentTask: "Watch one worked example of checking a reply against a fact card.",
        whatDoINow: "Leave the worked example visible, then press Next.",
        expectedOutcome: "Students have seen how to compare a reply with a fact card.",
      },
      {
        title: "Check the replies",
        teacherPrompt:
          "Give each pair the remaining prompt, reply and fact cards. They mark match or not, and write one short reason. Circulate and listen for the reason, not just the tick.",
        studentTask: "Check each prepared reply against the fact card and write whether it matches, with a short reason.",
        whatDoINow: "When most pairs have checked at least one prompt, press Next.",
        expectedOutcome: "Students have completed at least one check against the fact card.",
      },
      {
        title: "Judge the design",
        teacherPrompt:
          "As a class, write a user story by role only, such as “As a Year 6 student, I need a clear answer about a science fact so that I can finish my work accurately.” Agree two design criteria, for example: the reply matches a trusted source, and the reply says when it is unsure. Students judge the fictional chatbot and suggest one change. Note one possible impact of a wrong reply.",
        studentTask: "Write a short user story and two design criteria, judge the fictional chatbot, and suggest one change.",
        whatDoINow: "Take two or three judgements, then press Next.",
        expectedOutcome: "Students have judged the chatbot against criteria they can point to.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Ask the reflection question. Exit: keep the check notes and the judgement. Say the lesson is finished. No names, accounts or personal information.",
        studentTask: "Answer the reflection question and keep your check notes.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "feeds-and-recommendations": {
    id: "feeds-and-recommendations",
    yearBand: "years-5-8",
    successCriteria: [
      "I can design a simple recommendation rule that uses branching.",
      "I can repeat that rule to fill a short fictional feed.",
      "I can sort invented data items into essential and not essential to the system’s purpose.",
      "I can explain that a feed can add to a digital footprint because the system keeps data about use.",
    ],
    teacherScript:
      "A feed is a list of posts or videos chosen for a person. A recommendation system uses data about what has been watched or tapped, then follows rules to choose what to show next. Today we will design a simple rule with a decision and a repeat, and we will sort invented data items into essential and not essential. We will use a fictional feed only. We will not log in, and we will not look at anyone’s real feed or digital footprint.",
    studentInstructions:
      "Design a simple if-then rule for a fictional feed, repeat it to fill the slots, then sort invented data items into essential and not essential.",
    shortDescription:
      "A 25-minute unplugged lesson on how recommendation systems choose what appears in a social or video feed, using a fictional example only.",
    discussionPrompts: [
      "What might happen to a feed if the same rule is repeated many times?",
      "Which invented data item was not essential to choosing the next video?",
      "How can a feed add to a digital footprint even if you never type your name?",
    ],
    completionMessage:
      "You have designed a simple feed rule and sorted invented data items. Nothing about your real feed was collected.",
    extensionActivity:
      "Change the rule so that after two sport videos, the feed must show a different topic. Fill the five slots again and say what changed.",
    supportActivity:
      "Use the starter rule: “If the last video was sport, show sport; if it was cooking, show cooking.” Repeat it to fill the feed, then sort two data cards already discussed as a class.",
    mainIdea:
      "A recommendation system follows rules and uses data to choose what appears next in a feed, and not all of that data is essential to the purpose.",
    majorInteraction:
      "Students design a branching recommendation rule for a fictional feed, then sort invented data items.",
    expectedOutcome:
      "Students can describe their rule, fill a short feed by repeating it, and say whether an invented data item is essential.",
    steps: [
      {
        title: "Meet the idea",
        teacherPrompt:
          "Read the script. Show a blank five-slot feed on the board. Stress that the viewing history is invented, and that we will not log in or look at anyone’s real feed.",
        studentTask: "Listen to how a recommendation system chooses what to show next.",
        whatDoINow: "Check that the fictional-only rule is clear, then press Next.",
        expectedOutcome: "Students have heard what a feed and a recommendation system are.",
      },
      {
        title: "See a starter rule",
        teacherPrompt:
          "Show a short invented history, such as two sport titles and one cooking title. Model a starter rule: if the last video was sport, show sport; if it was cooking, show cooking. Fill two slots on the board by repeating the rule.",
        studentTask: "Watch a starter rule that uses a decision and a repeat.",
        whatDoINow: "Leave the starter rule visible, then press Next.",
        expectedOutcome: "Students have seen branching and iteration in a simple feed rule.",
      },
      {
        title: "Design and fill a feed",
        teacherPrompt:
          "Pairs write their own rule with at least one decision and a repeat, then fill five fictional slots. They may adapt the starter rule. Invented titles only.",
        studentTask: "Write a simple branching rule and repeat it to fill a five-slot fictional feed.",
        whatDoINow: "When most pairs have filled the feed, press Next.",
        expectedOutcome: "Students have a written rule and a completed fictional feed.",
      },
      {
        title: "Sort the data",
        teacherPrompt:
          "Give invented data-item cards, such as “which video was watched”, “how long it was watched”, “the viewer’s home address”, and “the viewer’s school name”. The purpose is: choose the next video in this fictional feed. Students sort cards into Essential and Not essential, then say how keeping this data could add to a digital footprint. Do not inspect real accounts.",
        studentTask: "Sort the invented data items and say which are essential to choosing the next video.",
        whatDoINow: "Take a few reasons, then press Next.",
        expectedOutcome: "Students have sorted invented data items and used the word essential correctly.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Ask the reflection question. Exit: keep the rule and the sorted list. Say the lesson is finished. No logins or real footprints.",
        studentTask: "Answer the reflection question and keep your rule and data sort.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
  "loot-boxes-and-purchases": {
    id: "loot-boxes-and-purchases",
    yearBand: "years-5-8",
    successCriteria: [
      "I can explain that a loot box is a purchase that gives a chance item.",
      "I can use a class tally of draws to support a statement about chance.",
      "I can write a short user story and design criteria, then judge a fictional game’s design.",
      "I can suggest one change that would make the chance clearer before someone spends.",
    ],
    teacherScript:
      "A loot box is a purchase in a game that gives a chance item. You pay, or spend in-game currency, then chance decides what you get. You might not get the item you wanted, and some designs make it easy to try again. Today we will use ten cards — one rare and nine common — to see what chance can look like, record a class tally, and judge a fictional game against tests we set. We will not talk about anyone’s real spending, payment details, or the games you play at home.",
    studentInstructions:
      "Take part in the class chance model, help record the tally, then write a user story and design criteria and judge the fictional game.",
    shortDescription:
      "A 25-minute unplugged lesson on loot boxes and in-game purchases: chance, a simple tally, and evaluating a fictional game’s design.",
    discussionPrompts: [
      "What does the class tally show about getting the rare item?",
      "Which design choice would make the chance clearer before someone spends?",
      "What is one possible later impact if a design makes it very easy to open another box?",
    ],
    completionMessage:
      "You have used a chance model and judged a fictional loot-box design against your criteria. Nothing about your spending was collected.",
    extensionActivity:
      "Write one more design criterion, such as “it is easy to stop after one purchase”, and judge the fictional game against it.",
    supportActivity:
      "Use the sentence starters: “A loot box is ___.” “The tally shows ___.” “As a player, I need ___ so that ___.” “This design does / does not meet this test because ___.”",
    mainIdea:
      "A loot box gives a chance item after a purchase, and a game’s design can be judged against tests such as clear chance and an easy way to stop.",
    majorInteraction:
      "Students take part in a ten-card chance model, interpret a class tally, then evaluate a fictional game and suggest one change.",
    expectedOutcome:
      "Students can explain the chance purchase, use the tally to support a statement, and judge the fictional design against a criterion.",
    steps: [
      {
        title: "Meet the idea",
        teacherPrompt:
          "Read the script. Keep the language descriptive: chance item, pay or spend, try again. Do not make legal claims, and do not ask about real spending or games students play at home.",
        studentTask: "Listen to what a loot box is, and hear that chance decides the item.",
        whatDoINow: "Check that the “no real spending” boundary is clear, then press Next.",
        expectedOutcome: "Students have heard a plain description of a loot box.",
      },
      {
        title: "See the chance model",
        teacherPrompt:
          "Show the ten cards: one rare, nine common. Shuffle them face down. Do one teacher draw, show the result, put the card back, and shuffle again. Explain that this is our model of chance for this lesson, not a claim about any real game’s odds.",
        studentTask: "Watch one draw from the ten-card model and see the card go back in.",
        whatDoINow: "Leave the ten-card model visible, then press Next.",
        expectedOutcome: "Students have seen that each draw is a chance from the same set of cards.",
      },
      {
        title: "Record a class tally",
        teacherPrompt:
          "Each student or pair draws once (or a small set number of times if the class is small). Record rare or common on a class tally, then return the card and shuffle. When the tally is complete, ask: did everyone get the rare item? What does the tally show? Students write one sentence that uses the tally.",
        studentTask: "Take part in the draws, add to the class tally, and write one sentence that uses the tally.",
        whatDoINow: "When the tally is visible and most students have a sentence, press Next.",
        expectedOutcome: "Students have a class tally and a sentence that uses it.",
      },
      {
        title: "Judge the design",
        teacherPrompt:
          "Give a fictional game card, for example a design that hides the chance and pushes “open another box”. As a class, write a user story by role only, such as “As a player, I need a fair, clear game so that I know what I am spending.” Agree criteria, such as: the chance is explained; it is clear you may get a common item; it is easy to stop. Students judge the design, note one possible future impact, and suggest one change.",
        studentTask: "Write a user story and design criteria, judge the fictional game, and suggest one change.",
        whatDoINow: "Take two or three suggested changes, then press Next.",
        expectedOutcome: "Students have judged the fictional design against tests they can point to.",
      },
      {
        title: "Stop here",
        teacherPrompt:
          "Ask the reflection question. Exit: keep the tally sentence and the judgement. Say the lesson is finished. Do not collect spending details or names.",
        studentTask: "Answer the reflection question and keep your tally sentence and judgement.",
        whatDoINow: "Press Complete to record the session on this device.",
        expectedOutcome: "The session is finished with no student data collected.",
      },
    ],
  },
};

function toTopicalLessonDefinition(session: TopicalSession): LessonDefinition {
  const runtime = TOPICAL_RUNTIME[session.id];
  if (!runtime) {
    throw new Error(`Missing topical runtime for ${session.id}`);
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
        "This lesson is unplugged. Nothing about a student is kept by MetaPet School.",
      completionPreview: `"${runtime.completionMessage}"`,
    },
    requiredFeatureFlags: [],
    ...UNPLUGGED_CONTRACT,
  };
}

export const TOPICAL_LESSON_DEFINITIONS: LessonDefinition[] =
  TOPICAL_SESSIONS.map(toTopicalLessonDefinition);
