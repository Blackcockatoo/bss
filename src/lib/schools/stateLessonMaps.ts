/**
 * Victorian Curriculum 2.0 and NSW syllabus maps for published MetaPet School
 * lessons. Official wording is copied only from the sources in
 * stateCurriculumSources.ts. Where a clear official match could not be
 * verified, the map is marked "not mapped yet" rather than guessed.
 */

import {
  STATE_CURRICULUM_CHECKED_AT,
  STATE_CURRICULUM_NOT_AN_ENDORSEMENT,
} from "@/lib/schools/stateCurriculumSources";
import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import { lessonDisplayTitle } from "@/lib/schools/lessonYearBands";

export type StateCurriculumJurisdiction = "victoria" | "nsw";
export type StateMapBand = "f-2" | "3-6" | "7-8" | "years-5-8" | "invisible-trail";

export interface OfficialStateDescription {
  code: string;
  wording: string;
  /** Official band, stage or syllabus label from the source. */
  officialBand: string;
}

export const OFFICIAL_VC2_DIGITAL_TECHNOLOGIES = {
  VC2TDI2S01: {
    code: "VC2TDI2S01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Foundation to Level 2",
    wording:
      "identify and explore digital systems including hardware and software components for a purpose",
  },
  VC2TDI2D01: {
    code: "VC2TDI2D01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Foundation to Level 2",
    wording:
      "explore patterns in data and represent data as objects, pictures, symbols, numbers and words",
  },
  VC2TDI2C01: {
    code: "VC2TDI2C01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Foundation to Level 2",
    wording:
      "investigate simple problems for known users that can be solved with digital systems",
  },
  VC2TDI2C02: {
    code: "VC2TDI2C02",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Foundation to Level 2",
    wording:
      "follow, describe and represent algorithms involving a sequence of steps, branching (decisions) and iteration (repetition) needed to solve simple problems",
  },
  VC2TDI2C03: {
    code: "VC2TDI2C03",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Foundation to Level 2",
    wording:
      "discuss how existing digital systems satisfy identified needs for known users",
  },
  VC2TDI4S01: {
    code: "VC2TDI4S01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 3 and 4",
    wording:
      "explore and describe a range of digital systems and their peripherals for a variety of purposes",
  },
  VC2TDI4D01: {
    code: "VC2TDI4D01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 3 and 4",
    wording:
      "recognise different types of data and explore how the same data can be represented differently depending on the purpose",
  },
  VC2TDI4C02: {
    code: "VC2TDI4C02",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 3 and 4",
    wording:
      "follow, describe and represent algorithms involving sequencing, comparison operators (branching) and iteration",
  },
  VC2TDI4C03: {
    code: "VC2TDI4C03",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 3 and 4",
    wording:
      "design a simple user interface, generate, communicate and compare the designs",
  },
  VC2TDI4D05: {
    code: "VC2TDI4D05",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 3 and 4",
    wording:
      "identify what personal data is stored and shared in their online accounts and discuss any associated risks",
  },
  VC2TDI6C02: {
    code: "VC2TDI6C02",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 5 and 6",
    wording:
      "design and represent algorithms involving multiple alternatives (branching) and iteration",
  },
  VC2TDI6C03: {
    code: "VC2TDI6C03",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 5 and 6",
    wording:
      "design and modify a user interface for a digital system, and generate, communicate and evaluate the designs",
  },
  VC2TDI6C05: {
    code: "VC2TDI6C05",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 5 and 6",
    wording:
      "evaluate existing and student-created solutions against the requirements and their broader community impact",
  },
  VC2TDI6D06: {
    code: "VC2TDI6D06",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 5 and 6",
    wording:
      "explain the creation and permanence of their personal digital footprint and consider privacy when collecting personal data",
  },
  VC2TDI8S01: {
    code: "VC2TDI8S01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "explain how hardware specifications affect performance and select appropriate hardware for particular tasks and workloads",
  },
  VC2TDI8D01: {
    code: "VC2TDI8D01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "investigate how digital systems represent text, image and audio data using integers and binary",
  },
  VC2TDI8C01: {
    code: "VC2TDI8C01",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "define and decompose real-world problems by taking into account functional requirements and constraints",
  },
  VC2TDI8C02: {
    code: "VC2TDI8C02",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "design algorithms involving nested control structures and represent them using flowcharts and pseudocode, and use tracing techniques to test and identify errors",
  },
  VC2TDI8C05: {
    code: "VC2TDI8C05",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "evaluate existing and student-created solutions against the requirements, constraints and possible future impacts",
  },
  VC2TDI8D06: {
    code: "VC2TDI8D06",
    officialBand: "Victorian Curriculum F–10 Version 2.0, Digital Technologies, Levels 7 and 8",
    wording:
      "investigate and manage the digital footprint that existing systems and student solutions collect, and assess if the data is essential to their purpose",
  },
} as const satisfies Record<string, OfficialStateDescription>;

export type OfficialVc2Code = keyof typeof OFFICIAL_VC2_DIGITAL_TECHNOLOGIES;

export const OFFICIAL_NSW_OUTCOMES = {
  "ST1-DAT-01": {
    code: "ST1-DAT-01",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 1",
    wording:
      "collects, represents and uses data to identify patterns and relationships",
  },
  "ST2-DAT-01": {
    code: "ST2-DAT-01",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 2",
    wording:
      "uses and interprets data to describe patterns and relationships",
  },
  "ST2-DDT-01": {
    code: "ST2-DDT-01",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 2",
    wording:
      "uses a design process to create products to address user needs or opportunities",
  },
  "ST2-DDT-02": {
    code: "ST2-DDT-02",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 2",
    wording:
      "designs and uses algorithms, represents data and uses digital systems for a purpose",
  },
  "ST3-DAT-01": {
    code: "ST3-DAT-01",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 3",
    wording: "interprets data to support explanations and arguments",
  },
  "ST3-DDT-01": {
    code: "ST3-DDT-01",
    officialBand:
      "Science and Technology K–6 Syllabus (2024), Stage 3",
    wording:
      "uses design processes to create, evaluate and modify designed solutions",
  },
  "TE4-MSC-01": {
    code: "TE4-MSC-01",
    officialBand: "Technology 7–8 Syllabus (2023), Stage 4",
    wording:
      "explains how materials, systems and components contribute to solutions",
  },
  "TE4-DIG-01": {
    code: "TE4-DIG-01",
    officialBand: "Technology 7–8 Syllabus (2023), Stage 4",
    wording:
      "demonstrates technological literacy to safely interact in digital environments",
  },
  "TE4-DIG-02": {
    code: "TE4-DIG-02",
    officialBand: "Technology 7–8 Syllabus (2023), Stage 4",
    wording:
      "uses data and digital systems to code, design and produce projects",
  },
  "TE4-DES-01": {
    code: "TE4-DES-01",
    officialBand: "Technology 7–8 Syllabus (2023), Stage 4",
    wording: "communicates and evaluates design ideas and solutions",
  },
} as const satisfies Record<string, OfficialStateDescription>;

export type OfficialNswCode = keyof typeof OFFICIAL_NSW_OUTCOMES;

export type StateMapResult =
  | { status: "mapped"; codes: OfficialStateDescription[] }
  | { status: "not-mapped-yet"; reason: string };

export interface LessonStateMap {
  id: string;
  band: StateMapBand;
  title: string;
  australianCodes: readonly string[];
  victorian: StateMapResult;
  nsw: StateMapResult;
}

const NSW_K6_NO_SYSTEMS =
  "No official Science and Technology K–6 Syllabus (2024) outcome is a clear match for this lesson’s learning intention. Early Stage 1 and Stage 1 technologies outcomes focus on making products to address user needs, which this lesson does not do.";

const NSW_NO_PRIVACY =
  "No official Science and Technology K–6 Syllabus (2024) outcome is a clear match for this lesson’s privacy or personal-data focus.";

const VIC_NO_PERSONAL_OWNED =
  "The official Foundation to Level 2 descriptions that mention personal data also refer to school accounts and passwords, or to websites and apps storing data online. This no-account lesson is about identifying data that is personal and owned by the student, so it has not been mapped to those codes.";

const VIC_HPE_ONLY_PRIVACY =
  "This lesson currently lists Australian Curriculum v9 Health and Physical Education codes only. A Victorian Curriculum 2.0 Health and Physical Education map has not been verified. Official Digital Technologies privacy descriptions in this band refer to personal data in online accounts, which this lesson does not ask students to use.";

function vc(codes: readonly OfficialVc2Code[]): StateMapResult {
  return {
    status: "mapped",
    codes: codes.map((code) => OFFICIAL_VC2_DIGITAL_TECHNOLOGIES[code]),
  };
}

function nsw(codes: readonly OfficialNswCode[]): StateMapResult {
  return {
    status: "mapped",
    codes: codes.map((code) => OFFICIAL_NSW_OUTCOMES[code]),
  };
}

function unmapped(reason: string): StateMapResult {
  return { status: "not-mapped-yet", reason };
}

function lessonTitle(id: string, fallback: string): string {
  const lesson = ALL_LESSON_DEFINITIONS.find((item) => item.id === id);
  return lesson ? lessonDisplayTitle(lesson) : fallback;
}

function acCodes(id: string, number: number): string[] {
  return curriculumAlignmentForLesson({ id, number }).codes;
}

export const INVISIBLE_TRAIL_STATED_CODES = [
  "AC9TDI4P09",
  "VC2TDI4D05",
  "AC9TDI6P10",
  "VC2TDI6D06",
] as const;

export const INVISIBLE_TRAIL_STATE_MAP: LessonStateMap = {
  id: "invisible-trail",
  band: "invisible-trail",
  title: "The Invisible Trail",
  australianCodes: ["AC9TDI4P09", "AC9TDI6P10"],
  victorian: vc(["VC2TDI4D05", "VC2TDI6D06"]),
  nsw: unmapped(NSW_NO_PRIVACY),
};

export const LESSON_STATE_MAPS: readonly LessonStateMap[] = [
  {
    id: "meet-a-system",
    band: "f-2",
    title: lessonTitle("meet-a-system", "Meet a System"),
    australianCodes: acCodes("meet-a-system", 1),
    victorian: vc(["VC2TDI2S01"]),
    nsw: unmapped(NSW_K6_NO_SYSTEMS),
  },
  {
    id: "show-it-two-ways",
    band: "f-2",
    title: lessonTitle("show-it-two-ways", "Show It Three Ways"),
    australianCodes: acCodes("show-it-two-ways", 2),
    victorian: vc(["VC2TDI2D01"]),
    nsw: unmapped(
      "The official Stage 1 data outcome (ST1-DAT-01) is a Years 1–2 outcome. This Foundation-focused lesson has not been mapped to that later-stage outcome.",
    ),
  },
  {
    id: "what-is-mine-to-keep",
    band: "f-2",
    title: lessonTitle("what-is-mine-to-keep", "What Is Mine to Keep?"),
    australianCodes: acCodes("what-is-mine-to-keep", 3),
    victorian: unmapped(VIC_NO_PERSONAL_OWNED),
    nsw: unmapped(NSW_NO_PRIVACY),
  },
  {
    id: "parts-of-a-system",
    band: "f-2",
    title: lessonTitle("parts-of-a-system", "Parts of a System"),
    australianCodes: acCodes("parts-of-a-system", 4),
    victorian: vc(["VC2TDI2S01"]),
    nsw: unmapped(NSW_K6_NO_SYSTEMS),
  },
  {
    id: "the-same-data-many-ways",
    band: "f-2",
    title: lessonTitle("the-same-data-many-ways", "The Same Data, Many Ways"),
    australianCodes: acCodes("the-same-data-many-ways", 5),
    victorian: vc(["VC2TDI2D01"]),
    nsw: nsw(["ST1-DAT-01"]),
  },
  {
    id: "follow-the-steps",
    band: "f-2",
    title: lessonTitle("follow-the-steps", "Follow the Steps"),
    australianCodes: acCodes("follow-the-steps", 6),
    victorian: vc(["VC2TDI2C02"]),
    nsw: unmapped(
      "The official outcome that names algorithms, ST2-DDT-02, is a Stage 2 (Years 3–4) outcome. This F–2 lesson has not been mapped to that later-stage outcome.",
    ),
  },
  {
    id: "a-problem-for-someone-we-know",
    band: "f-2",
    title: lessonTitle(
      "a-problem-for-someone-we-know",
      "A Problem for a School User",
    ),
    australianCodes: acCodes("a-problem-for-someone-we-know", 7),
    victorian: vc(["VC2TDI2C01", "VC2TDI2C03"]),
    nsw: unmapped(NSW_K6_NO_SYSTEMS),
  },
  {
    id: "meet-the-system",
    band: "3-6",
    title: lessonTitle("meet-the-system", "Meet the System"),
    australianCodes: acCodes("meet-the-system", 1),
    victorian: vc(["VC2TDI4S01"]),
    nsw: nsw(["ST2-DDT-02"]),
  },
  {
    id: "read-the-signals",
    band: "3-6",
    title: lessonTitle("read-the-signals", "Read the Signals"),
    australianCodes: acCodes("read-the-signals", 2),
    victorian: unmapped(
      "No official Victorian Curriculum 2.0 Digital Technologies content description is a clear match for this lesson’s focus on reading the signals a system shows.",
    ),
    nsw: nsw(["ST2-DDT-02"]),
  },
  {
    id: "one-identity-many-representations",
    band: "3-6",
    title: lessonTitle(
      "one-identity-many-representations",
      "One Identity, Many Representations",
    ),
    australianCodes: acCodes("one-identity-many-representations", 3),
    victorian: vc(["VC2TDI4D01"]),
    nsw: nsw(["ST2-DAT-01", "ST2-DDT-02"]),
  },
  {
    id: "choices-and-algorithms",
    band: "3-6",
    title: lessonTitle("choices-and-algorithms", "Choices and Algorithms"),
    australianCodes: acCodes("choices-and-algorithms", 4),
    victorian: vc(["VC2TDI4C02", "VC2TDI6C02"]),
    nsw: nsw(["ST2-DDT-02"]),
  },
  {
    id: "privacy-and-responsible-design",
    band: "3-6",
    title: lessonTitle(
      "privacy-and-responsible-design",
      "Privacy and Responsible Design",
    ),
    australianCodes: acCodes("privacy-and-responsible-design", 5),
    victorian: unmapped(VIC_HPE_ONLY_PRIVACY),
    nsw: unmapped(NSW_NO_PRIVACY),
  },
  {
    id: "design-a-better-feature",
    band: "3-6",
    title: lessonTitle("design-a-better-feature", "Design a Better Feature"),
    australianCodes: acCodes("design-a-better-feature", 6),
    victorian: vc(["VC2TDI4C03", "VC2TDI6C03"]),
    nsw: nsw(["ST2-DDT-01", "ST3-DDT-01"]),
  },
  {
    id: "test-reflect-and-improve",
    band: "3-6",
    title: lessonTitle("test-reflect-and-improve", "Test, Reflect and Improve"),
    australianCodes: acCodes("test-reflect-and-improve", 7),
    victorian: vc(["VC2TDI6C05"]),
    nsw: nsw(["ST3-DDT-01"]),
  },
  {
    id: "hardware-for-the-job",
    band: "7-8",
    title: lessonTitle("hardware-for-the-job", "Hardware for the Job"),
    australianCodes: acCodes("hardware-for-the-job", 1),
    victorian: vc(["VC2TDI8S01"]),
    nsw: nsw(["TE4-MSC-01"]),
  },
  {
    id: "data-as-numbers",
    band: "7-8",
    title: lessonTitle("data-as-numbers", "Data as Numbers"),
    australianCodes: acCodes("data-as-numbers", 2),
    victorian: vc(["VC2TDI8D01"]),
    nsw: nsw(["TE4-DIG-02"]),
  },
  {
    id: "why-binary",
    band: "7-8",
    title: lessonTitle("why-binary", "Why Binary?"),
    australianCodes: acCodes("why-binary", 3),
    victorian: vc(["VC2TDI8D01"]),
    nsw: nsw(["TE4-DIG-02"]),
  },
  {
    id: "trace-the-algorithm",
    band: "7-8",
    title: lessonTitle("trace-the-algorithm", "Trace the Algorithm"),
    australianCodes: acCodes("trace-the-algorithm", 4),
    victorian: vc(["VC2TDI8C02"]),
    nsw: nsw(["TE4-DIG-02"]),
  },
  {
    id: "design-an-algorithm",
    band: "7-8",
    title: lessonTitle("design-an-algorithm", "Design an Algorithm"),
    australianCodes: acCodes("design-an-algorithm", 5),
    victorian: vc(["VC2TDI8C02"]),
    nsw: nsw(["TE4-DIG-02"]),
  },
  {
    id: "what-data-is-essential",
    band: "7-8",
    title: lessonTitle("what-data-is-essential", "What Data Is Essential?"),
    australianCodes: acCodes("what-data-is-essential", 6),
    victorian: vc(["VC2TDI8D06"]),
    nsw: nsw(["TE4-DIG-01"]),
  },
  {
    id: "evaluate-a-system-for-a-user",
    band: "7-8",
    title: lessonTitle(
      "evaluate-a-system-for-a-user",
      "Evaluate a System for a User",
    ),
    australianCodes: acCodes("evaluate-a-system-for-a-user", 7),
    victorian: vc(["VC2TDI8C01", "VC2TDI8C05"]),
    nsw: nsw(["TE4-DES-01"]),
  },
  {
    id: "chatbots-and-checking",
    band: "years-5-8",
    title: lessonTitle("chatbots-and-checking", "Chatbots and Checking Answers"),
    australianCodes: acCodes("chatbots-and-checking", 1),
    victorian: vc(["VC2TDI6C05", "VC2TDI8C05"]),
    nsw: nsw(["ST3-DDT-01", "TE4-DES-01"]),
  },
  {
    id: "feeds-and-recommendations",
    band: "years-5-8",
    title: lessonTitle("feeds-and-recommendations", "Feeds and Recommendations"),
    australianCodes: acCodes("feeds-and-recommendations", 2),
    victorian: vc(["VC2TDI6C02", "VC2TDI6D06", "VC2TDI8D06"]),
    nsw: unmapped(
      "No official Science and Technology K–6 Syllabus (2024) or Technology 7–8 Syllabus (2023) outcome is a clear match for this unplugged lesson. The official Stage 3 outcome ST3-DDT-02 refers to creating, evaluating and modifying algorithms to code or control digital devices and systems, which this lesson does not do. TE4-DIG-02 requires using data and digital systems to code, design and produce projects.",
    ),
  },
  {
    id: "loot-boxes-and-purchases",
    band: "years-5-8",
    title: lessonTitle("loot-boxes-and-purchases", "Loot Boxes and In-game Purchases"),
    australianCodes: acCodes("loot-boxes-and-purchases", 3),
    victorian: vc(["VC2TDI6C05", "VC2TDI8C05"]),
    nsw: nsw(["ST3-DAT-01", "ST3-DDT-01", "TE4-DES-01"]),
  },
  INVISIBLE_TRAIL_STATE_MAP,
];

export const STATE_MAP_BAND_LABELS: Record<StateMapBand, string> = {
  "f-2": "F–2 unplugged starter set",
  "3-6": "Years 3–6 classroom lessons",
  "7-8": "Years 7–8 bridge unit",
  "years-5-8": "Years 5–8 topical mini-lessons",
  "invisible-trail": "The Invisible Trail (optional companion)",
};

export function stateMapsForBand(band: StateMapBand): LessonStateMap[] {
  return LESSON_STATE_MAPS.filter((item) => item.band === band);
}

export function stateMapForId(id: string): LessonStateMap | undefined {
  return LESSON_STATE_MAPS.find((item) => item.id === id);
}

export const STATE_MAP_INTRO = `These maps sit beside the Australian Curriculum v9 codes already listed on each lesson. Victorian wording is copied from official Victorian Curriculum F–10 Version 2.0 Digital Technologies content descriptions. NSW wording is copied from official NESA outcomes in the Science and Technology K–6 Syllabus (2024) and the Technology 7–8 Syllabus (2023). Sources were checked on ${STATE_CURRICULUM_CHECKED_AT}. ${STATE_CURRICULUM_NOT_AN_ENDORSEMENT} A row marked “not mapped yet” means no clear official match was verified; it is not a judgement that the lesson cannot be used.`;
