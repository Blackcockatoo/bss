import {
  LESSON_DEFINITIONS as BASE_LESSON_DEFINITIONS,
} from "./lessonDefinitions";
import type {
  LessonDefinition,
  LessonId,
  LessonPreviewContent,
  LessonStepDefinition,
} from "./types";

type StepCopy = Pick<
  LessonStepDefinition,
  "title" | "teacherPrompt" | "studentTask" | "whatDoINow" | "expectedOutcome"
>;

type LessonCopyUpgrade = Pick<
  LessonDefinition,
  | "durationMinutes"
  | "shortDescription"
  | "learningIntention"
  | "successCriteria"
  | "teacherIntroduction"
  | "teacherScript"
  | "studentInstructions"
  | "discussionPrompts"
  | "completionMessage"
  | "extensionActivity"
  | "supportActivity"
> & {
  preview: LessonPreviewContent;
  steps: [StepCopy, StepCopy, StepCopy, StepCopy, StepCopy];
};

/**
 * Classroom-ready copy layered over the stable lesson architecture.
 *
 * The underlying lesson ids, routes, activity components, evidence types and
 * progress records remain unchanged. This layer lets us strengthen teaching
 * quality without forking the seven-lesson engine or breaking saved progress.
 */
const LESSON_QUALITY_UPGRADES: Record<LessonId, LessonCopyUpgrade> = {
  "meet-your-metapet": {
    durationMinutes: 20,
    shortDescription:
      "Students observe a Meta-Pet, use precise describing words and learn why classroom aliases protect privacy.",
    learningIntention:
      "Use careful observation to describe a digital system and explain one privacy-safe classroom choice.",
    successCriteria: [
      "I can record three specific observations about shape, surface and movement.",
      "I can separate what I observed from what I guessed.",
      "I can explain why we use a made-up alias instead of a real name.",
    ],
    teacherIntroduction:
      "Begin with quiet noticing before students touch the controls. Model the difference between evidence ('it moved slowly') and interpretation ('it looks sleepy'), then connect the alias activity to practical digital privacy.",
    teacherScript:
      "Today we are digital field researchers. First we will notice what the Meta-Pet actually does, then we will describe it using evidence. We will also give it a made-up alias so nobody needs to enter a real name.",
    studentInstructions:
      "Look first, then choose precise words for what you can see. Use a made-up pet alias and finish with one question you would investigate next.",
    discussionPrompts: [
      "Which statement is an observation, and which is a guess?",
      "What changed when we interacted with the pet?",
      "How does using an alias protect a person's privacy?",
    ],
    completionMessage:
      "You observed carefully, used evidence and made a privacy-safe choice. Your first Meta-Pet field note is complete.",
    extensionActivity:
      "Write one observation, one inference and one testable question about the Meta-Pet.",
    supportActivity:
      "Use the sentence frame: 'I notice the pet is ___ because I can see ___.'",
    preview: {
      mainIdea:
        "Good digital inquiry begins with careful observation, clear evidence and privacy-safe choices.",
      majorInteraction:
        "Observe shape, surface and movement, then create a made-up pet alias and a question.",
      expectedOutcome:
        "Students distinguish observation from inference and explain why aliases are safer than real names.",
      resetBehaviour:
        "The demonstration pet returns to its starting state; locally saved lesson evidence remains under teacher controls.",
      completionPreview:
        "You observed carefully, used evidence and made a privacy-safe choice.",
    },
    steps: [
      {
        title: "Become a digital field researcher",
        teacherPrompt:
          "Set the purpose: observe before interacting. Ask students to keep their first ideas silent for ten seconds so every learner has thinking time.",
        studentTask:
          "Watch quietly and notice one detail without touching the controls.",
        whatDoINow:
          "Display the pet, allow ten seconds of silent observation, then invite two evidence-based notices before pressing Next.",
        expectedOutcome:
          "Students begin with independent observation rather than copying the first answer they hear.",
      },
      {
        title: "Collect three pieces of evidence",
        teacherPrompt:
          "Guide students to describe shape, surface and movement with precise words. Revoice vague answers into observable language.",
        studentTask:
          "Choose one word for the pet's shape, one for its surface and one for its movement.",
        whatDoINow:
          "Complete the three observation choices. Ask, 'What can you point to that supports that word?' before moving on.",
        expectedOutcome:
          "Students record three observations and can point to visible evidence for at least one.",
      },
      {
        title: "Make a privacy-safe interaction",
        teacherPrompt:
          "Explain that an alias is a made-up name used so a real full name is unnecessary. Invite a playful but classroom-appropriate pet alias.",
        studentTask:
          "Create a made-up alias for the pet without using any person's real name.",
        whatDoINow:
          "Enter an alias, check that it contains no real identifying information, then continue.",
        expectedOutcome:
          "Students complete an interaction while applying a concrete privacy rule.",
      },
      {
        title: "Separate observation from inference",
        teacherPrompt:
          "Compare a direct observation with an interpretation. Encourage 'might' language when the evidence does not prove a feeling or intention.",
        studentTask:
          "Share one thing you observed and one question or guess it made you think of.",
        whatDoINow:
          "Use one discussion prompt, sort responses into 'observed' and 'inferred', then record a question.",
        expectedOutcome:
          "Students explain that a clue can support an idea without proving it.",
      },
      {
        title: "Save the first field note",
        teacherPrompt:
          "Recap the inquiry pattern: notice, describe, protect privacy, then ask a question. Celebrate specific evidence rather than speed.",
        studentTask:
          "Check your alias, three observations and question, then save the card.",
        whatDoINow:
          "Review the completed card, correct any real-name entry, save it and complete the lesson.",
        expectedOutcome:
          "A complete, privacy-safe observation card is stored locally for teacher review.",
      },
    ],
  },
  "build-a-body": {
    durationMinutes: 20,
    shortDescription:
      "Students solve a creature design brief by choosing body parts for a purpose and explaining trade-offs.",
    learningIntention:
      "Design a body as a system of connected parts selected to suit a purpose and environment.",
    successCriteria: [
      "I can identify the job my creature needs to do.",
      "I can choose body parts that support that job.",
      "I can explain one benefit and one trade-off in my design.",
    ],
    teacherIntroduction:
      "Frame Body Forge as a design-and-justify challenge, not a decoration task. Give the class a clear purpose such as moving through water, climbing rough ground or staying balanced in strong wind.",
    teacherScript:
      "Designers do more than choose what looks cool. They decide what a creature needs to do, choose parts that help, test the whole system and explain the trade-offs.",
    studentInstructions:
      "Choose a purpose, build a body that suits it and be ready to defend one design choice with evidence.",
    discussionPrompts: [
      "Which part does the most important job in your design?",
      "What did your choice improve, and what might it make harder?",
      "How would the body change in a different environment?",
    ],
    completionMessage:
      "You designed a body for a purpose and explained a trade-off. That is systems thinking, not just decorating.",
    extensionActivity:
      "Keep the same purpose but redesign the body using a different set of parts, then compare the two solutions.",
    supportActivity:
      "Choose one job and one matching part using: 'My pet needs ___ because it helps ___.'",
    preview: {
      mainIdea:
        "A strong design connects every major part to a purpose while recognising that choices have trade-offs.",
      majorInteraction:
        "Build a Meta-Pet body for a selected environment or job and justify a key choice.",
      expectedOutcome:
        "Students describe the body as a system and explain at least one benefit and trade-off.",
      resetBehaviour:
        "The classroom demonstration design resets after the lesson; saved comparison evidence remains locally reviewable.",
      completionPreview:
        "You designed a body for a purpose and explained a trade-off.",
    },
    steps: [
      {
        title: "Accept the design brief",
        teacherPrompt:
          "Choose one shared challenge: swim, climb, glide or stay stable in wind. Ask what the body must be able to do before showing parts.",
        studentTask:
          "Name the creature's job and one feature it will probably need.",
        whatDoINow:
          "Select a class design brief, collect two predictions and press Next.",
        expectedOutcome:
          "Students understand that the design will be judged against a purpose.",
      },
      {
        title: "Inspect parts by function",
        teacherPrompt:
          "Examine available parts and ask what each could help the pet do. Accept multiple defensible answers rather than presenting one correct body.",
        studentTask:
          "Sort possible parts by the job they could help with.",
        whatDoINow:
          "Preview the available choices and ask students to link at least two parts to functions.",
        expectedOutcome:
          "Students evaluate parts by function instead of appearance alone.",
      },
      {
        title: "Build and test the system",
        teacherPrompt:
          "Build the body and pause after each major choice: 'How does this help the brief?' Encourage students to revise when parts conflict.",
        studentTask:
          "Choose parts, test the whole body against the brief and revise one choice if needed.",
        whatDoINow:
          "Complete the build, perform a quick purpose check and make one deliberate revision before continuing.",
        expectedOutcome:
          "Students produce a coherent design connected to the selected purpose.",
      },
      {
        title: "Defend a choice and name a trade-off",
        teacherPrompt:
          "Ask for claim-and-reason responses. Prompt students to name what a choice improves and what it may make more difficult.",
        studentTask:
          "Explain one design choice using 'I chose ___ because ___; the trade-off is ___.'.",
        whatDoINow:
          "Hear two contrasting solutions, compare their trade-offs and press Next.",
        expectedOutcome:
          "Students justify a choice and recognise that designs can solve the same problem differently.",
      },
      {
        title: "Capture the design reasoning",
        teacherPrompt:
          "Summarise the sequence: purpose, parts, system, test, revise. Praise reasoning and revision rather than a single preferred design.",
        studentTask:
          "Save the design comparison and one sentence explaining your strongest choice.",
        whatDoINow:
          "Check that the evidence names the purpose and a reason, then save and complete the lesson.",
        expectedOutcome:
          "A body design and its reasoning are recorded locally as learning evidence.",
      },
    ],
  },
  "dna-differences": {
    durationMinutes: 20,
    shortDescription:
      "Students compare digital genomes, change one variable at a time and connect code differences to visible traits.",
    learningIntention:
      "Use a simplified digital genome model to investigate how changing one variable can change an observable trait.",
    successCriteria: [
      "I can identify a visible difference between two Meta-Pets.",
      "I can compare the matching genome value and make a prediction.",
      "I can explain that this is a simplified model, not the whole story of real biology.",
    ],
    teacherIntroduction:
      "Use the Meta-Pet genome as a model for cause-and-effect investigation. Keep the science accurate by stating that real traits are often influenced by many genes and environments; the classroom model deliberately simplifies this.",
    teacherScript:
      "We are using a digital model of DNA. Models help us test ideas, but they leave things out. We will change or compare one value at a time, predict what it affects and use the visible result as evidence.",
    studentInstructions:
      "Compare the pets carefully, choose one genome difference and connect it to one visible change without claiming the model explains everything.",
    discussionPrompts: [
      "Which visible difference matches the genome value you compared?",
      "Why is changing one variable at a time useful in an investigation?",
      "What can this model show us, and what does it leave out about real living things?",
    ],
    completionMessage:
      "You used a digital genome model, controlled a comparison and supported a claim with visible evidence.",
    extensionActivity:
      "Predict a new trait result, change one value only, then record whether the evidence supported your prediction.",
    supportActivity:
      "Use a side-by-side sentence frame: 'Pet A has ___; Pet B has ___. The genome value that changed was ___.'.",
    preview: {
      mainIdea:
        "Digital models let students investigate relationships between code and traits when comparisons are controlled and claims stay within the evidence.",
      majorInteraction:
        "Compare two pets or vary one genome value, then connect the change to an observable trait.",
      expectedOutcome:
        "Students make a prediction, identify evidence and explain a limitation of the simplified model.",
      resetBehaviour:
        "Demonstration genome values return to their starting configuration; saved comparison evidence remains local.",
      completionPreview:
        "You used a digital genome model and supported a claim with evidence.",
    },
    steps: [
      {
        title: "Meet the model",
        teacherPrompt:
          "Define a model as a useful simplification. State clearly that Meta-Pet genome values are designed for learning and do not represent the full complexity of real genetics.",
        studentTask:
          "Name one thing a model can help us test and one thing it might leave out.",
        whatDoINow:
          "Give the model disclaimer, collect one example of a model and press Next.",
        expectedOutcome:
          "Students approach the activity as an investigation using a simplified representation.",
      },
      {
        title: "Compare before changing",
        teacherPrompt:
          "Display two pets side by side and establish a baseline. Ask students to scan systematically from overall shape to smaller details.",
        studentTask:
          "Record at least two similarities and one visible difference.",
        whatDoINow:
          "Allow quiet comparison time, then identify one shared trait and one difference before continuing.",
        expectedOutcome:
          "Students gather baseline evidence instead of jumping straight to a conclusion.",
      },
      {
        title: "Test one variable",
        teacherPrompt:
          "Choose one genome value to compare or vary. Ask for a prediction before revealing or applying the change.",
        studentTask:
          "Predict what one genome value will affect, then check the visible result.",
        whatDoINow:
          "Record the prediction, inspect one variable and note whether the result supports it.",
        expectedOutcome:
          "Students conduct a controlled comparison and connect one code change to evidence.",
      },
      {
        title: "Make a careful claim",
        teacherPrompt:
          "Use claim-evidence-reasoning language and challenge overstatements. Replace 'DNA decides everything' with a claim limited to this digital model.",
        studentTask:
          "State what changed, cite the visible evidence and name one limitation of the model.",
        whatDoINow:
          "Build one class claim from the evidence, then ask what additional test would strengthen it.",
        expectedOutcome:
          "Students communicate a supported claim without overgeneralising to real biology.",
      },
      {
        title: "Save the comparison",
        teacherPrompt:
          "Recap the investigation cycle: baseline, prediction, one-variable test, evidence, limitation.",
        studentTask:
          "Check that your comparison includes the changed value, visible result and a careful conclusion.",
        whatDoINow:
          "Review the evidence for a specific comparison, save it and complete the lesson.",
        expectedOutcome:
          "A controlled DNA comparison and evidence-based conclusion are recorded locally.",
      },
    ],
  },
  "needs-and-consequences": {
    durationMinutes: 20,
    shortDescription:
      "Students run predict-act-observe care trials and explain how choices affect a Meta-Pet's needs over time.",
    learningIntention:
      "Investigate cause and effect by predicting how a caring action will change a need, then checking the result.",
    successCriteria: [
      "I can identify a need using the available evidence.",
      "I can predict an action's likely consequence before acting.",
      "I can revise a care plan when the result is different from my prediction.",
    ],
    teacherIntroduction:
      "Keep this as a systems investigation rather than a reward loop. Students should read the pet's state, predict an action, observe more than one effect and revise their plan.",
    teacherScript:
      "Caring is not random button pressing. We will read the evidence, choose an action for a reason, predict the consequence and then check what actually changed.",
    studentInstructions:
      "Use the pet's needs as evidence. Predict first, act once, observe the changes and decide what the pet needs next.",
    discussionPrompts: [
      "Which need gave you the strongest evidence for acting?",
      "Did the action affect only one thing, or did it create a trade-off?",
      "How did the result change your next decision?",
    ],
    completionMessage:
      "You used evidence to plan care, tested a prediction and adjusted after seeing the consequence.",
    extensionActivity:
      "Create a three-action care plan and annotate the expected benefit and possible trade-off of each action.",
    supportActivity:
      "Use: 'The pet needs ___. I predict ___ will help because ___.'.",
    preview: {
      mainIdea:
        "Responsible care is a cycle of reading evidence, predicting consequences, acting and adjusting.",
      majorInteraction:
        "Choose a need, predict an action's effect and compare the prediction with the resulting vital changes.",
      expectedOutcome:
        "Students explain a cause-effect chain and revise a plan using feedback.",
      resetBehaviour:
        "The demonstration pet's needs return to a neutral classroom state; saved cause-effect evidence remains local.",
      completionPreview:
        "You used evidence to plan care and adjusted after seeing the consequence.",
    },
    steps: [
      {
        title: "Read the current state",
        teacherPrompt:
          "Ask students to identify the strongest need using visible indicators. Require evidence before accepting an action suggestion.",
        studentTask:
          "Choose the need that deserves attention first and point to the evidence.",
        whatDoINow:
          "Inspect the vitals, agree on the priority need and explain why before pressing Next.",
        expectedOutcome:
          "Students choose a care priority from evidence rather than preference.",
      },
      {
        title: "Predict a consequence",
        teacherPrompt:
          "Offer plausible actions and ask students to predict both the intended benefit and a possible secondary effect.",
        studentTask:
          "Choose one action and predict what will go up, down or stay similar.",
        whatDoINow:
          "Record a class prediction for one action before anyone activates it.",
        expectedOutcome:
          "Students state a testable prediction linked to the identified need.",
      },
      {
        title: "Act once and observe",
        teacherPrompt:
          "Apply one action only, then pause. Compare every visible change with the prediction rather than immediately pressing another control.",
        studentTask:
          "Take one caring action and observe all the changes it causes.",
        whatDoINow:
          "Apply the selected action, wait for the update and note at least one expected or unexpected effect.",
        expectedOutcome:
          "Students connect a specific action with its immediate consequences.",
      },
      {
        title: "Revise the care plan",
        teacherPrompt:
          "Ask whether the original priority is resolved and what the new evidence suggests. Normalise changing a plan when feedback disagrees with a prediction.",
        studentTask:
          "Explain what you would do next and how the evidence changed your plan.",
        whatDoINow:
          "Complete a cause-effect statement and hear one alternative next step before continuing.",
        expectedOutcome:
          "Students use feedback to revise rather than defend an ineffective choice.",
      },
      {
        title: "Save the cause-effect chain",
        teacherPrompt:
          "Recap the loop: evidence, prediction, action, consequence, adjustment. Connect it to responsible decisions beyond the pet.",
        studentTask:
          "Save the need, action, prediction, result and next-step decision.",
        whatDoINow:
          "Check that the chain contains a before-and-after explanation, save it and complete the lesson.",
        expectedOutcome:
          "A complete cause-effect care chain is available for local teacher review.",
      },
    ],
  },
  "feelings-without-words": {
    durationMinutes: 20,
    shortDescription:
      "Students interpret non-verbal clues, use uncertain language carefully and choose respectful responses.",
    learningIntention:
      "Use multiple non-verbal clues to form a careful emotion hypothesis and select a respectful response.",
    successCriteria: [
      "I can identify at least two clues before naming a possible feeling.",
      "I can use 'might' or 'could' because clues do not prove how someone feels.",
      "I can suggest a kind response that allows choice and space.",
    ],
    teacherIntroduction:
      "Avoid teaching body language as a certainty. Model that people and digital characters can show similar clues for different reasons, so a respectful observer checks rather than assumes.",
    teacherScript:
      "Movement, posture, colour and expression can give us clues, but clues are not mind reading. We will gather more than one clue, make a careful guess and choose a response that is kind even if our guess is wrong.",
    studentInstructions:
      "Collect two clues, name a feeling the pet might be showing and choose a respectful response without claiming you know for certain.",
    discussionPrompts: [
      "Which two clues support your idea?",
      "What is another possible explanation for the same clues?",
      "Which response would still be respectful if our guess is wrong?",
    ],
    completionMessage:
      "You read several clues, avoided mind reading and chose a response that protects dignity and choice.",
    extensionActivity:
      "Create two different emotion explanations for the same clue set and write a response that works safely for both.",
    supportActivity:
      "Choose from: 'The pet might feel ___. My clues are ___ and ___. I could ___.'.",
    preview: {
      mainIdea:
        "Non-verbal signals are useful clues, but respectful interpretation stays tentative and leaves room for another explanation.",
      majorInteraction:
        "Read movement, posture and visual cues, then select and justify a kind response.",
      expectedOutcome:
        "Students support an emotion hypothesis with multiple clues and avoid treating it as certainty.",
      resetBehaviour:
        "The demonstration mood returns to neutral; saved reflection evidence remains on the classroom device.",
      completionPreview:
        "You used clues carefully and chose a response that protects dignity and choice.",
    },
    steps: [
      {
        title: "Look for clues, not answers",
        teacherPrompt:
          "Introduce the rule that one clue can have many explanations. Ask students to describe what they see before naming any emotion.",
        studentTask:
          "Describe one movement or posture clue without using a feeling word.",
        whatDoINow:
          "Display the pet, collect two neutral descriptions and press Next.",
        expectedOutcome:
          "Students separate observable signals from emotion labels.",
      },
      {
        title: "Gather a clue set",
        teacherPrompt:
          "Direct attention to at least two channels such as movement, posture, colour or expression. Discuss whether the clues agree or conflict.",
        studentTask:
          "Select two clues and decide whether they point in the same direction.",
        whatDoINow:
          "Record two clues, then ask what additional information would help.",
        expectedOutcome:
          "Students base interpretation on a combination of signals rather than a single stereotype.",
      },
      {
        title: "Form a careful hypothesis",
        teacherPrompt:
          "Require tentative language: 'might', 'could' or 'possibly'. Invite a second plausible explanation to reduce certainty bias.",
        studentTask:
          "Name one possible feeling and one other explanation for the same clues.",
        whatDoINow:
          "Complete the emotion reflection with evidence and an alternative interpretation.",
        expectedOutcome:
          "Students express an evidence-based hypothesis while recognising uncertainty.",
      },
      {
        title: "Choose a respectful response",
        teacherPrompt:
          "Compare responses that control the pet with responses that offer help, space or choice. Ask which remains kind if the interpretation is wrong.",
        studentTask:
          "Choose a response that offers support without forcing interaction.",
        whatDoINow:
          "Discuss two possible responses, select the most respectful and explain why.",
        expectedOutcome:
          "Students connect emotional literacy with consent, choice and respectful care.",
      },
      {
        title: "Save the clue-to-care reflection",
        teacherPrompt:
          "Recap: describe, gather clues, hypothesise carefully, consider alternatives, respond respectfully.",
        studentTask:
          "Save your clues, possible feeling, alternative explanation and kind response.",
        whatDoINow:
          "Check for tentative language and at least two clues, save the reflection and complete the lesson.",
        expectedOutcome:
          "A nuanced emotion reflection is stored locally for teacher review.",
      },
    ],
  },
  "patterns-behind-the-pet": {
    durationMinutes: 20,
    shortDescription:
      "Students read a Meta-Pet visualisation, identify change over time and test a prediction against new data.",
    learningIntention:
      "Describe a pattern in data, make a prediction from it and evaluate whether new evidence supports the prediction.",
    successCriteria: [
      "I can describe what the visualisation measures or represents.",
      "I can identify a repeating pattern, trend or unusual point.",
      "I can make and check a prediction using new evidence.",
    ],
    teacherIntroduction:
      "Start with data literacy before pattern spotting: identify what each mark, position or movement represents. Encourage students to distinguish repetition, trend and anomaly rather than calling every visual feature a pattern.",
    teacherScript:
      "A visualisation is a picture made from data. Before we hunt for patterns, we need to know what the picture represents. Then we can describe a pattern, make a prediction and test it.",
    studentInstructions:
      "Decode the visualisation, describe one pattern precisely, predict what comes next and check your prediction against the data.",
    discussionPrompts: [
      "What does each part of this visualisation represent?",
      "Is the pattern repeating, trending or unusual—and what evidence shows that?",
      "What new evidence would make you change your prediction?",
    ],
    completionMessage:
      "You decoded a visualisation, described a pattern and tested a prediction with evidence.",
    extensionActivity:
      "Find an anomaly that does not fit the main pattern and propose two possible explanations.",
    supportActivity:
      "Use: 'I notice ___ repeats/changes. I predict ___ because ___.'.",
    preview: {
      mainIdea:
        "Data visualisations become meaningful when students decode what they represent, describe patterns precisely and test predictions.",
      majorInteraction:
        "Explore a Meta-Pet data view, classify a pattern and compare a prediction with new evidence.",
      expectedOutcome:
        "Students move from visual noticing to evidence-based pattern description and prediction.",
      resetBehaviour:
        "The visualisation returns to its default view; saved selection and reasoning remain local.",
      completionPreview:
        "You decoded a visualisation and tested a prediction with evidence.",
    },
    steps: [
      {
        title: "Decode the data picture",
        teacherPrompt:
          "Identify what the marks, colours, positions or movements represent. Do not ask for patterns until students can explain the visualisation's basic meaning.",
        studentTask:
          "Point to one visual feature and explain what data it represents.",
        whatDoINow:
          "Establish a shared key for the visualisation, then press Next.",
        expectedOutcome:
          "Students understand enough of the representation to make meaningful observations.",
      },
      {
        title: "Describe change precisely",
        teacherPrompt:
          "Ask students to use comparative language such as increases, decreases, repeats, clusters or stays stable.",
        studentTask:
          "Describe how one part of the data changes across the display.",
        whatDoINow:
          "Collect one precise change statement and ask another student to locate its evidence.",
        expectedOutcome:
          "Students describe a data relationship rather than only naming colours or shapes.",
      },
      {
        title: "Classify and predict",
        teacherPrompt:
          "Decide whether the evidence shows a repeating pattern, a trend or an anomaly. Ask for a prediction and the reason behind it.",
        studentTask:
          "Classify the pattern and predict what the next data point or state might be.",
        whatDoINow:
          "Record the selected pattern and prediction before revealing or generating more evidence.",
        expectedOutcome:
          "Students make a testable prediction grounded in a described pattern.",
      },
      {
        title: "Test the prediction",
        teacherPrompt:
          "Compare the prediction with new evidence. Treat a mismatch as useful information and ask how the explanation should change.",
        studentTask:
          "Check the prediction, then keep it, revise it or reject it with a reason.",
        whatDoINow:
          "Reveal the next state, compare it with the prediction and discuss any anomaly.",
        expectedOutcome:
          "Students evaluate a prediction honestly and revise their thinking when needed.",
      },
      {
        title: "Save the pattern explanation",
        teacherPrompt:
          "Recap the sequence: decode, describe, classify, predict, test. Ask for one sentence that connects the visual evidence to the conclusion.",
        studentTask:
          "Save the visualisation choice, pattern description, prediction and test result.",
        whatDoINow:
          "Check that the explanation names visible evidence, save it and complete the lesson.",
        expectedOutcome:
          "A pattern interpretation and tested prediction are stored locally.",
      },
    ],
  },
  "responsible-creator": {
    durationMinutes: 20,
    shortDescription:
      "Students audit a Meta-Pet design for care, privacy, fairness and wellbeing, then write a responsible creator promise.",
    learningIntention:
      "Evaluate a digital creation by considering who may be affected, what could go wrong and how the design can reduce harm.",
    successCriteria: [
      "I can identify people or systems affected by a design choice.",
      "I can name one benefit, one risk and one safeguard.",
      "I can write a specific creator promise that can guide future decisions.",
    ],
    teacherIntroduction:
      "Make this a genuine ethics-and-design capstone. Students should revisit evidence from earlier lessons, identify stakeholders, test a scenario and improve a design choice—not simply promise to be nice.",
    teacherScript:
      "Creators are responsible for more than making something work. We must ask who benefits, who could be excluded or harmed, what information is collected and how people keep choice and control.",
    studentInstructions:
      "Review a Meta-Pet choice, identify a benefit and risk, add a safeguard and write a creator promise you could actually follow.",
    discussionPrompts: [
      "Who is affected by this design choice, including people who may need extra support?",
      "What could go wrong even if the creator had good intentions?",
      "Which safeguard gives users more safety, privacy, fairness or control?",
    ],
    completionMessage:
      "You completed the seven-lesson journey by improving a design and making a specific responsible creator promise.",
    extensionActivity:
      "Run a second scenario from the viewpoint of a teacher, parent/carer or student with different access needs, then revise the safeguard.",
    supportActivity:
      "Use: 'My choice helps ___. A risk is ___. I will reduce it by ___.'.",
    preview: {
      mainIdea:
        "Responsible creators examine benefits, risks, affected people and safeguards, then commit to actions that preserve safety, privacy, fairness and choice.",
      majorInteraction:
        "Audit a Meta-Pet design decision, improve it with a safeguard and write a creator promise.",
      expectedOutcome:
        "Students justify an ethical design improvement and connect it to a specific future commitment.",
      resetBehaviour:
        "The capstone keeps the student's locally saved promise and approved choices unless a teacher deletes or resets them.",
      completionPreview:
        "You improved a design and made a specific responsible creator promise.",
    },
    steps: [
      {
        title: "Recall the creator's power",
        teacherPrompt:
          "Review one choice from each earlier lesson: observation, body design, genome model, care, emotion interpretation and data visualisation. Ask how creators shaped each experience.",
        studentTask:
          "Choose one earlier design decision that affected what a user could see, do or understand.",
        whatDoINow:
          "Name a design decision and the person or system it affects before pressing Next.",
        expectedOutcome:
          "Students recognise that digital experiences reflect creator choices rather than appearing automatically.",
      },
      {
        title: "Map benefit, risk and stakeholder",
        teacherPrompt:
          "Use a simple three-part audit: who benefits, who may be left out or harmed, and what risk deserves attention first.",
        studentTask:
          "Identify one stakeholder, one benefit and one realistic risk.",
        whatDoINow:
          "Complete the audit using a concrete scenario, not a vague statement about being responsible.",
        expectedOutcome:
          "Students evaluate a design choice from more than the creator's viewpoint.",
      },
      {
        title: "Add a safeguard",
        teacherPrompt:
          "Invite safeguards that increase privacy, consent, accessibility, fairness, transparency or user control. Ask how the safeguard would work in practice.",
        studentTask:
          "Improve the design with one safeguard and explain which risk it reduces.",
        whatDoINow:
          "Select or write a safeguard, test it against the scenario and revise if it does not address the risk.",
        expectedOutcome:
          "Students translate an ethical concern into a practical design improvement.",
      },
      {
        title: "Challenge the good intention",
        teacherPrompt:
          "Ask, 'What could still go wrong?' or switch viewpoints. Reinforce that good intentions do not replace testing, feedback and accountability.",
        studentTask:
          "Consider a second viewpoint and decide whether the safeguard needs improvement.",
        whatDoINow:
          "Hear one counterexample, update the decision if needed and prepare the creator promise.",
        expectedOutcome:
          "Students show intellectual humility and improve a choice after considering unintended consequences.",
      },
      {
        title: "Make the creator promise",
        teacherPrompt:
          "Require a specific, observable commitment beginning with 'When I create..., I will...'. Celebrate completion of all seven lessons and the quality of the reasoning.",
        studentTask:
          "Write and save a creator promise that names an action you will take in future projects.",
        whatDoINow:
          "Check that the promise is specific and connected to a risk or safeguard, save it and complete the programme.",
        expectedOutcome:
          "A practical responsible creator promise completes the seven-lesson local learning record.",
      },
    ],
  },
};

function applyLessonQualityUpgrade(lesson: LessonDefinition): LessonDefinition {
  const upgrade = LESSON_QUALITY_UPGRADES[lesson.id];
  const { steps: upgradedSteps, ...lessonCopy } = upgrade;

  return {
    ...lesson,
    ...lessonCopy,
    steps: lesson.steps.map((step, index) => ({
      ...step,
      ...upgradedSteps[index],
    })),
  };
}

/** Canonical seven-lesson classroom programme used by routes and components. */
export const LESSON_DEFINITIONS: LessonDefinition[] =
  BASE_LESSON_DEFINITIONS.map(applyLessonQualityUpgrade);

/** All lesson ids in canonical order. */
export const LESSON_IDS: LessonId[] = LESSON_DEFINITIONS.map(
  (lesson) => lesson.id,
);

/** Total number of lessons in the school programme. */
export const TOTAL_LESSONS = LESSON_DEFINITIONS.length;

const LESSON_BY_ID = new Map<LessonId, LessonDefinition>(
  LESSON_DEFINITIONS.map((lesson) => [lesson.id, lesson]),
);

const LESSON_BY_SLUG = new Map<string, LessonDefinition>(
  LESSON_DEFINITIONS.map((lesson) => [lesson.slug, lesson]),
);

export function getLessonById(
  id: string | null | undefined,
): LessonDefinition | undefined {
  if (!id) return undefined;
  return LESSON_BY_ID.get(id as LessonId);
}

export function getLessonBySlug(
  slug: string | null | undefined,
): LessonDefinition | undefined {
  if (!slug) return undefined;
  return LESSON_BY_SLUG.get(slug);
}

export function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && LESSON_BY_ID.has(value as LessonId);
}
