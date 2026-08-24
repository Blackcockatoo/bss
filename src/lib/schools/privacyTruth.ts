import privacyTruthData from "./privacyTruth.data.json";

/**
 * Canonical, implementation-backed privacy language for MetaPet School.
 *
 * Public pages previously restated these boundaries independently. That made
 * small wording changes capable of turning into different technical claims.
 * Keep the short, reusable statements here; detailed governance documents
 * remain canonical Markdown under `docs/schools-au/` and are checked against
 * this registry.
 */

export const SCHOOLS_LOCAL_DATA_RETENTION_DAYS =
  privacyTruthData.retentionDays;

export const SCHOOL_PRIVACY_COMMITMENTS = {
  ...privacyTruthData.commitments,
  retention: `After ${SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use, expired classroom records are removed when a school route next opens; a website cannot erase browser storage while it is closed.`,
} as const;

export const SCHOOL_PROFILE_DESCRIPTION =
  privacyTruthData.profileDescription;

export const SCHOOL_PRIVACY_ARTIFACTS = [
  "Privacy policy",
  "Child-friendly privacy notice",
  "Parent/carer privacy notice",
  "Data inventory",
  "Retention and deletion schedule",
  "Third-party services register",
] as const;

export const SCHOOL_PRIVACY_SUMMARY_ITEMS = [
  {
    label: "What is stored",
    text: "Teacher-chosen aliases, lesson progress, classroom setup choices, class summary counts and any light evidence a teacher records.",
  },
  {
    label: "Where",
    text: `${SCHOOL_PRIVACY_COMMITMENTS.localRecords} ${SCHOOL_PRIVACY_COMMITMENTS.transmission}`,
  },
  {
    label: "Retention period",
    text: SCHOOL_PRIVACY_COMMITMENTS.retention,
  },
  {
    label: "Immediate deletion",
    text: SCHOOL_PRIVACY_COMMITMENTS.deletion,
  },
  {
    label: "Student identifiers",
    text: SCHOOL_PRIVACY_COMMITMENTS.accounts,
  },
] as const;

export const SCHOOL_DELETION_EXPLANATION = [
  SCHOOL_PRIVACY_COMMITMENTS.retention,
  `${SCHOOL_PRIVACY_COMMITMENTS.deletion} Schools should still clear site data when a device or pilot is retired.`,
] as const;

export const SCHOOL_DATA_LIFECYCLE: readonly {
  question: string;
  answer: string;
}[] = [
  {
    question: "What is stored?",
    answer: SCHOOL_PRIVACY_SUMMARY_ITEMS[0].text,
  },
  {
    question: "Where is it stored?",
    answer: `${SCHOOL_PRIVACY_COMMITMENTS.localRecords} Routine classroom use does not sync those record contents to B$S.`,
  },
  {
    question: "Why is it needed?",
    answer:
      "So a class can pause and resume a session, and so a teacher can review light evidence without re-running the lesson.",
  },
  {
    question: "Who can see it?",
    answer:
      "Anyone using this browser profile on this device. That is why it belongs on a teacher-controlled device or browser profile.",
  },
  {
    question: "When does it disappear?",
    answer: SCHOOL_PRIVACY_COMMITMENTS.retention,
  },
  {
    question: "How does a teacher delete it?",
    answer:
      "From the local-data controls, with an explicit confirmation. No deletion request to the studio is needed.",
  },
  {
    question: "What is never required?",
    answer: SCHOOL_PRIVACY_COMMITMENTS.accounts,
  },
];
