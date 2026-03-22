# Digital Engagement Taxonomy

Teacher-facing policy and classification framework for the Meta-Pet school product.

This document classifies digital use by observable student activity, not by moral judgment. It is intended to sit alongside the child-safe baseline and teacher implementation materials.

This is product policy guidance, not legal advice. Australian federal requirements set the baseline, and schools should verify state, territory, sector, and local department rules before deployment.

## Current Repo Surfaces

The existing repository already contains the main school-facing surfaces this taxonomy needs to govern:

| Surface | Evidence in repo | Why it matters |
| --- | --- | --- |
| Product principles | `README.md` | Already commits to offline-first, zero-account student mode, calm UX, and no ads in student use. |
| Child-safe baseline | `docs/compliance/child-safe-baseline.md` | Defines the hard floor for default student deployments and already excludes tracking, streaks, and adult-only surfaces. |
| Teacher roster and assignment flow | `src/components/ClassroomManager.tsx` | Teachers create alias-based rosters, local assignments, and local analytics without collecting student names. |
| Queue and lesson pathway | `src/components/EducationQueuePanel.tsx`, `src/app/school-game/page.tsx` | Students move through teacher-set lesson sequences with progress, quest gating, and calm pattern practice. |
| Teacher privacy/safety brief | `07_KPPS_Privacy_Safety_Brief.md` | Existing leadership-facing explanation of privacy-by-design and offline-first architecture. |
| Deployment guardrail | `scripts/assert-child-safe-deployment-lib.mjs` | Enforces the student deployment baseline flag in CI. |

## Six Engagement Categories

Each category describes what the student is doing on-device.

| Category | Plain definition | Operational markers | Teacher visibility | Typical school use | Risk markers | Primary mode |
| --- | --- | --- | --- | --- | --- | --- |
| Health digital use | The student is caring for the Meta-Pet's vitals or inspecting its current state. | Short care loops, vitals checks, cause-and-effect observation. | Medium | Systems thinking, responsibility, homeostasis routines. | Repetitive care loops can displace broader learning time. | Active + reflective |
| Learning | The student is completing a teacher-directed task with a clear learning objective. | Assigned lesson, fixed goal, checkpoint, prompt, or rubric. | High | Curriculum-aligned quests, structured inquiry, reflection, and evidence gathering. | Avoid hidden grading, public comparison, or analytics being repurposed as surveillance. | Guided + active |
| Exploring | The student is testing tools freely without a preset outcome. | Open sandbox, curiosity-driven trial, "what if" experimentation. | Medium | Sandbox discovery before or between structured lessons. | Keep exploration inside the child-safe baseline and away from networked or irrelevant content. | Exploratory |
| Training / practice | The student is repeating a narrow skill to build fluency. | Drill, recall task, repeated pattern or sequence practice, immediate feedback. | Medium | Pattern recall, logic drills, care sequence rehearsal. | Do not add streak pressure, countdowns, public ranking, or shame mechanics. | Repetitive + active |
| Mindfulness / regulation | The student is reflecting, calming, or regulating attention and emotion. | Untimed prompts, journaling, calm recall, optional private response. | Low | SEL check-ins, transitions, emotional vocabulary, self-regulation. | Do not force disclosure or save/share identifiable reflections without a clear basis and consent. | Reflective |
| Vegging / passive consumption | The student is watching, listening, or observing without active input. | Lean-back viewing, passive listening, short break content. | Low | Short teacher-approved decompression or recovery breaks. | Avoid autoplay feeds, social/video drift, advertising, and long passive sessions. | Passive |

## Distinguishing Similar Categories

| Distinction | Operational rule |
| --- | --- |
| Learning vs exploring | Learning has a teacher-set goal, expected output, or checkpoint. Exploring does not. |
| Training vs learning | Training repeats a known skill to build fluency. Learning introduces or integrates a new concept. |
| Mindfulness vs vegging | Mindfulness still asks the learner to notice, reflect, or regulate. Vegging is passive consumption. |
| Health digital use vs training | Health use is about maintaining or inspecting the pet's state. Training is about repeating a discrete skill. |
| Teacher-led vs unbounded use | Learning and most training are explicitly bounded. Exploring and vegging still require teacher oversight and time limits. |

## Definitions vs Measures

Definitions classify the type of use. Measures are optional and should never redefine the category.

| Category | Definition focus | Safe example measures |
| --- | --- | --- |
| Health digital use | Care actions and vitals observation. | Completed care loops, student explanation of cause and effect. |
| Learning | Teacher-directed work tied to a lesson objective. | Objective completion, rubric evidence, reasoning quality. |
| Exploring | Open-ended experimentation. | Features explored, questions generated, observations recorded. |
| Training / practice | Repetition for fluency. | Repetitions completed, error reduction, recall accuracy. |
| Mindfulness / regulation | Reflection or self-regulation activity. | Optional mood check-ins, emotional vocabulary used, teacher observation notes. |
| Vegging / passive consumption | Passive viewing or listening. | Duration and frequency of teacher-approved breaks. |

Do not convert these measures into streaks, public ranking, or missed-day penalties in child mode.

## Australian Legal and Policy Matrix

Federal law provides the baseline. State or sector rules may add stricter operational requirements.

| Area | Federal baseline | State / territory verification point | Meta-Pet product implication |
| --- | --- | --- | --- |
| Privacy and personal information | The Privacy Act 1988 (Cth) and Australian Privacy Principles require APP entities to collect only what is reasonably necessary, notify people about collection, use/disclose information lawfully, and protect it with reasonable security steps. | Government schools and departments may have additional privacy directions or procurement rules. | Keep student mode zero-account by default, use aliases instead of names, keep routine data local, and avoid third-party analytics in child mode. |
| Child safety and online environments | National child-safe guidance expects organisations to reduce online harm and create safe environments for children. | Departmental child-safe standards and school policies differ by jurisdiction. | No open chat, social feeds, public UGC, or external community features in student mode. Teacher oversight remains required even in offline mode. |
| Consent and sharing boundaries | If student information, work, recordings, or identifiers are collected or disclosed beyond what is necessary for local classroom use, schools may need parental/carer notice or consent depending on the context and school policy. | Verify sector rules for parent notice, AI use, recordings, and online publication. | Student mode should avoid accounts, cloud sync, and identifiable exports by default. Any future sync or media capture flow should be adult-controlled and policy-gated. |
| Advertising, upsell, and profiling | Privacy and consumer law settings make child profiling and misleading advertising high-risk, especially when tied to minors. | Some departments may be stricter than the federal baseline. | Keep all child-facing modes ad-free, tracking-free, and free of manipulative monetisation. Adult pricing belongs in clearly separate adult/admin surfaces only. |
| Accessibility and disability access | The Disability Discrimination Act 1992 (Cth) and the Disability Standards for Education 2005 require reasonable adjustments so students with disability can participate on the same basis as peers. | School accessibility accommodations vary by learner and context. | Maintain keyboard access, readable contrast, captions/transcripts where needed, and avoid making critical information audio-only or motion-only. |
| Copyright and teaching materials | The Copyright Act 1968 (Cth) and school statutory licences allow some educational copying, but schools still need to respect licence scope and attribution rules. | Sector guidance may differ on what staff can upload or redistribute. | Prefer original or school-licensed media in the product. Do not embed third-party commercial media in the student flow without permission. |
| Safety escalation | Schools must follow wellbeing, mandatory reporting, and incident-escalation processes when a student's digital activity suggests harm or risk. | Reporting pathways differ by school and jurisdiction. | Reflection tools should stay optional and local-first. If concerning content is surfaced to staff, the response belongs in school wellbeing processes, not inside automated student-facing flows. |

Local verification examples: parent notice and consent wording, staff rules for recording or publishing student work, approved device/image capture policies, and any department-specific restrictions on external platforms or age-restricted services.

## Can / Cannot Statements

### Can

- Teachers can assign standards-aligned lessons and track progress locally using aliases only.
- Teachers can tag activities with an engagement category so the class mix of learning, exploration, practice, reflection, and passive time stays visible.
- Students can explore sandbox features when the session remains inside the child-safe baseline and under teacher supervision.
- Teachers can use calm, untimed practice activities that build fluency without pressure mechanics.
- Teachers can offer short, teacher-approved passive breaks if the content is local or curated and does not drift into ads, feeds, or social platforms.
- Reflection activities can remain private or optional unless a school process requires staff review for safety reasons.

### Cannot

- Child-facing modes cannot show advertising, upsells, targeted profiling, public leaderboards, or manipulative streak/countdown mechanics.
- Student mode cannot require accounts, routine cloud sync, or identifiable data collection as a condition of classroom participation.
- Students cannot be routed into open chat, public comments, or age-restricted social platforms through the classroom product.
- Teachers cannot rely on the taxonomy as a substitute for parent notice, school privacy obligations, or local wellbeing escalation procedures.
- Reflection exports cannot include personal identifiers by default.

## Repository Placement

Recommended long-term placement inside this repository:

| Location | Purpose |
| --- | --- |
| `docs/compliance/digital-engagement-taxonomy.md` | Canonical policy and legal framing. |
| `docs/compliance/child-safe-baseline.md` | Baseline guardrail document that links here for classroom classification detail. |
| `07_KPPS_Privacy_Safety_Brief.md` | Leadership-facing summary that points technical reviewers to the taxonomy. |
| `src/lib/education/engagement.ts` | Single source of truth for the six categories used by product code. |
| `src/components/ClassroomManager.tsx` | Teacher assignment form where categories are selected. |
| `src/components/EducationQueuePanel.tsx` | Teacher and student surfaces where the assigned category is visible. |

## Minimal Implementation Plan

1. Keep the policy in `docs/compliance` so it stays close to the child-safe baseline and deployment guidance.
2. Store the category on each queued lesson so the teacher-facing UI and any future analytics use the same source of truth.
3. Display the category in teacher assignment creation, teacher queue review, and the student lesson path.
4. Treat missing historical values as `learning` until all persisted local state has migrated.
5. Review any future networked or media-heavy features against this taxonomy before shipping them into child mode.

## Validation Checklist

- Run `npm run lint`.
- Run `npm test -- src/lib/education/engagement.test.ts src/lib/education/store.test.ts src/lib/education/quests.test.ts src/app/school-game/page.test.tsx`.
- Confirm `ClassroomManager` can create a lesson with each category and queue it without errors.
- Confirm `EducationQueuePanel` shows category labels in teacher and student views.
- Confirm historical local queue data without a category still renders with a safe default.
- If `NEXT_PUBLIC_CHILD_SAFE_BASELINE=true`, confirm no new category path introduces networking, ads, or account requirements.

## Official Reference Points

- Privacy Act 1988 (Cth): <https://www.legislation.gov.au/C2004A03712/latest/text>
- OAIC Australian Privacy Principles guidance: <https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines>
- National child safety guidance and online safety resources: <https://www.acecqa.gov.au/information-sheets-child-safety>
- eSafety school safety guidance: <https://www.esafety.gov.au/educators>
- Disability Standards for Education 2005: <https://www.legislation.gov.au/F2005L00767>
- Smartcopying school copyright guidance: <https://smartcopying.edu.au/>

State and territory confirmation points should be checked against the relevant education department, school sector policy, and local leadership approval path before rollout.
