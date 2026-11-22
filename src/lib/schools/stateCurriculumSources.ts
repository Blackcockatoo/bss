/**
 * Official Victorian Curriculum 2.0 and NSW syllabus sources checked for the
 * state maps. Quote wording only from these sources. This is classroom
 * alignment, not a VCAA or NESA endorsement.
 */

export const STATE_CURRICULUM_CHECKED_AT =
  "21 November 2026, Australia/Sydney";

export interface OfficialStateSource {
  id: string;
  title: string;
  href: string;
  publisher: string;
  httpStatus: number;
  notes: string;
}

export const STATE_CURRICULUM_NOT_AN_ENDORSEMENT =
  "These maps are classroom alignment only. Reachable official pages and downloads are not a VCAA, NESA, Victorian Government or ACARA endorsement of MetaPet School.";

export const VICTORIAN_CURRICULUM_SOURCES: readonly OfficialStateSource[] = [
  {
    id: "vic-gov-downloads",
    title: "Victorian Curriculum F–10 downloads",
    href: "https://www.vic.gov.au/victorian-curriculum-f-10-downloads",
    publisher: "Victorian Government / VCAA",
    httpStatus: 200,
    notes:
      `Official Victorian Government downloads page for Victorian Curriculum F–10 Version 2.0 and Version 1.0. Checked ${STATE_CURRICULUM_CHECKED_AT} (HTTP 200). The official F–10 curriculum website at f10.vcaa.vic.edu.au returned HTTP 200 but was a site-maintenance page that directed readers here. The Version 1.0 site at victoriancurriculum.vcaa.vic.edu.au returned HTTP 503 (temporarily offline).`,
  },
  {
    id: "vic-vc2-technologies-docx",
    title: "Victorian Curriculum F–10 Version 2.0 — Technologies (Word)",
    href: "https://www.vic.gov.au/sites/default/files/2026-11/VC2-Technologies.docx",
    publisher: "VCAA, published via vic.gov.au",
    httpStatus: 200,
    notes:
      `Official Version 2.0 Technologies download, including Digital Technologies. Checked ${STATE_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    id: "vic-vc2-full-csv",
    title:
      "Victorian Curriculum F–10 Version 2.0 — full curriculum (CSV only)",
    href: "https://www.vic.gov.au/sites/default/files/2026-11/VC2-full-curriculum-%28CSV-only%29.zip",
    publisher: "VCAA, published via vic.gov.au",
    httpStatus: 200,
    notes:
      `Official Version 2.0 curriculum extract dated 20 October 2026 (file name VC2_AS-CD-Elab_20-10-2026.csv). Content-description wording used in these maps was copied from the Digital Technologies rows of that official extract. Checked ${STATE_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
];

export const NSW_SYLLABUS_SOURCES: readonly OfficialStateSource[] = [
  {
    id: "nsw-st-k6-2024-outcomes",
    title: "Science and Technology K–6 Syllabus (2024) — Outcomes",
    href: "https://curriculum.nsw.edu.au/learning-areas/science/science-and-technology-k-6-2024/outcomes",
    publisher: "NESA",
    httpStatus: 200,
    notes:
      `Official NESA outcomes page. Implementation from 2027; in 2026 schools plan and prepare, and may choose to implement during the planning phase. The Science and Technology K–6 Syllabus (2017) will not be available after December 2028. Checked ${STATE_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    id: "nsw-tech-78-2023-outcomes",
    title: "Technology 7–8 Syllabus (2023) — Outcomes",
    href: "https://curriculum.nsw.edu.au/learning-areas/tas/technology-7-8-2023/outcomes",
    publisher: "NESA",
    httpStatus: 200,
    notes:
      `Official NESA outcomes page. Implementation from 2026 (start teaching the new syllabus). The Technology Mandatory 7–8 Syllabus (2017) will not be available after December 2027. Checked ${STATE_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
];

export const ALL_STATE_CURRICULUM_SOURCES: readonly OfficialStateSource[] = [
  ...VICTORIAN_CURRICULUM_SOURCES,
  ...NSW_SYLLABUS_SOURCES,
];
