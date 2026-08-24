const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} = require("docx");
const CANONICAL_SESSIONS = require("../src/lib/schools/canonicalSequence.data.json");
const SCHOOL_PRIVACY_TRUTH = require("../src/lib/schools/privacyTruth.data.json");

// ── Brand colors ──
const NAVY = "1B2A4A";
const TEAL = "0D9488";
const LIGHT_TEAL = "E0F5F3";
const LIGHT_GRAY = "F1F5F9";
const MID_GRAY = "94A3B8";
const DARK_TEXT = "1E293B";
const BORDER_COLOR = "CBD5E1";

// ── Shared numbering config ──
const NUMBERING = {
  config: [
    {
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "\u2022",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
    {
      reference: "numbers",
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
  ],
};

// ── Shared styles ──
const STYLES = {
  default: {
    document: {
      run: { font: "Calibri", size: 22, color: DARK_TEXT },
      paragraph: { spacing: { after: 120, line: 276 } },
    },
  },
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 36, bold: true, font: "Calibri", color: NAVY },
      paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font: "Calibri", color: TEAL },
      paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1,
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL, space: 4 } },
      },
    },
    {
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, font: "Calibri", color: NAVY },
      paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
    },
  ],
};

// ── Shared header / footer ──
function makeHeader(subtitle) {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 6 } },
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "MetaPet Schools", font: "Calibri", size: 18, bold: true, color: NAVY }),
          new TextRun({ text: `  |  ${subtitle}`, font: "Calibri", size: 18, color: MID_GRAY }),
        ],
      }),
    ],
  });
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR, space: 6 } },
        alignment: AlignmentType.CENTER,
        spacing: { before: 0 },
        children: [
          new TextRun({ text: "Page ", font: "Calibri", size: 16, color: MID_GRAY }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: MID_GRAY }),
          new TextRun({ text: "  |  MetaPet Schools  |  Confidential", font: "Calibri", size: 16, color: MID_GRAY }),
        ],
      }),
    ],
  });
}

// ── Page properties ──
function pageProps(subtitle) {
  return {
    page: {
      size: { width: 11906, height: 16838 }, // A4
      margin: { top: 1440, right: 1260, bottom: 1260, left: 1260 },
    },
    headers: { default: makeHeader(subtitle) },
    footers: { default: makeFooter() },
  };
}

// ── Helpers ──
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, ...opts.run })],
  });
}
function boldP(label, text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text }),
    ],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun(text)],
  });
}
function num(text, ref = "numbers") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(text)],
  });
}
function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [] });
}

// ── Title block ──
function titleBlock(title, subtitle) {
  return [
    new Paragraph({
      spacing: { before: 600, after: 60 },
      children: [new TextRun({ text: "METAPET SCHOOLS", font: "Calibri", size: 20, bold: true, color: TEAL, allCaps: true })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: title, font: "Calibri", size: 48, bold: true, color: NAVY })],
    }),
    new Paragraph({
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 12 } },
      children: [new TextRun({ text: subtitle, font: "Calibri", size: 24, color: MID_GRAY })],
    }),
  ];
}

// ── Table helper ──
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })] })],
  });
}
function cell(text, width, shade) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Calibri" })] })],
  });
}

// ── Highlight box ──
function highlightBox(text) {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
    children: [new TextRun({ text, italics: true, color: NAVY, size: 22 })],
  });
}

// ──────────────────────────────────────
// DOCUMENT 1: Teacher Guide
// ──────────────────────────────────────
function makeTeacherGuide() {
  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Teacher Guide"),
      children: [
        ...titleBlock("Teacher Guide", "Quick-start reference for classroom delivery"),
        h2("Quick Setup"),
        bullet("Time: under 5 minutes"),
        bullet("Audience: Years 3\u20136"),
        bullet("Format: teacher-led lesson using aliases only"),
        spacer(),
        h2("Before Class"),
        num("Open the school runtime."),
        num("Add aliases only."),
        num("Queue the lesson you plan to run."),
        num("Confirm the family participation process before the first lesson."),
        num("Keep the parent note and staff brief available if questions arise."),
        spacer(),
        h2("During Class"),
        bullet("Introduce the tool as a digital companion used to explore systems, routines, and online safety habits."),
        bullet("Keep the session time-bounded."),
        bullet("Use whole-class or pair work where possible."),
        bullet("Use the reflection sheet or observation checklist only if it helps the lesson."),
        spacer(),
        h2("After Class"),
        bullet("Review the local class summary."),
        bullet("Export evidence only if the pilot plan requires it."),
        bullet("Delete local data when the pilot window ends or when the device is shared with another class."),
        spacer(),
        h2("Product Boundaries to Say Out Loud"),
        highlightBox("Read these aloud to your class at the start of the first session."),
        bullet("This is not social media."),
        bullet("This is not chat."),
        bullet("This is not therapy."),
        bullet("This is a classroom learning tool."),
      ],
    }],
  });
}

// ──────────────────────────────────────
// DOCUMENT 2: Parent Note
// ──────────────────────────────────────
function makeParentNote() {
  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Parent/Carer Note"),
      children: [
        ...titleBlock("Parent/Carer Note", "Information for families about classroom use"),
        h2("What Is This?"),
        p("MetaPet Schools is a short teacher-led classroom activity for Years 3\u20136. Students use a digital companion to notice patterns, practise simple online safety habits, and talk about systems and regulation in age-appropriate language."),
        spacer(),
        h2("What It Does Not Require"),
        bullet(SCHOOL_PRIVACY_TRUTH.commitments.accounts),
        bullet("No public profile"),
        bullet("No social sharing"),
        bullet(SCHOOL_PRIVACY_TRUTH.commitments.advertising),
        bullet(SCHOOL_PRIVACY_TRUTH.commitments.tracking),
        spacer(),
        h2("What Is Stored During Normal Classroom Use"),
        bullet("A teacher-chosen alias"),
        bullet("Lesson progress on the classroom device"),
        bullet("A local class summary for pilot evidence"),
        spacer(),
        h2("How Participation Works"),
        bullet("The default pilot pack assumes parent/carer opt-in before direct student use."),
        bullet("If a school uses a different approved local process, it should explain that clearly before classroom use."),
        bullet("Students who are not the primary device user can still join through observation, discussion, or teacher-provided alternatives."),
        spacer(),
        h2("How Long Is It Kept?"),
        p(`${SCHOOL_PRIVACY_TRUTH.commitments.localRecords} ${SCHOOL_PRIVACY_TRUTH.commitments.transmission} After ${SCHOOL_PRIVACY_TRUTH.retentionDays} days without use, expired classroom records are removed when a school route next opens; a website cannot erase browser storage while it is closed. ${SCHOOL_PRIVACY_TRUTH.commitments.deletion}`),
        spacer(),
        h2("Who Should I Contact?"),
        p("Please contact the school if you have questions about classroom use, privacy, or whether your child participates in the pilot."),
      ],
    }],
  });
}

// ──────────────────────────────────────
// DOCUMENT 3: Staff Brief
// ──────────────────────────────────────
function makeStaffBrief() {
  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Staff Briefing"),
      children: [
        ...titleBlock("Staff Briefing", "One-page overview for school staff"),
        h2("One-Slide Briefing Script"),
        boldP("What it is: ", "a teacher-led, local-first classroom tool for Years 3\u20136"),
        boldP("What it teaches: ", "systems thinking, digital responsibility, and online safety habits"),
        boldP("What it avoids: ", "student accounts, social features, open chat, and retention pressure loops"),
        boldP("What schools review first: ", "privacy pack, safeguarding pack, teacher pack, and pilot prospectus"),
        spacer(),
        h2("Operating Rules"),
        bullet("Use aliases only"),
        bullet("Keep sessions time-bounded"),
        bullet("Do not position it as therapy or counselling"),
        bullet("Confirm the family participation protocol before launch"),
        bullet("Review any export before it leaves the device"),
        bullet("Delete local school data at the end of the pilot cycle"),
      ],
    }],
  });
}

// ──────────────────────────────────────
// DOCUMENT 4: Lesson Cards
// ──────────────────────────────────────
function sessionCard(session) {
  return [
    h3(`Session ${session.number}: ${session.title}`),
    new Table({
      width: { size: 9386, type: WidthType.DXA },
      columnWidths: [2400, 6986],
      rows: [
        new TableRow({ children: [headerCell("Time", 2400), cell(`${session.minutes} minutes`, 6986)] }),
        new TableRow({ children: [cell("Learning intention", 2400, LIGHT_GRAY), cell(session.learningIntention, 6986)] }),
        new TableRow({ children: [cell("Teacher introduction", 2400), cell(session.teacherIntroduction, 6986)] }),
        new TableRow({ children: [cell("Student activity", 2400, LIGHT_GRAY), cell(session.childActivity, 6986)] }),
        new TableRow({ children: [cell("Movement moment", 2400), cell(session.movementMoment, 6986)] }),
        new TableRow({ children: [cell("Reflection question", 2400, LIGHT_GRAY), cell(`\u201C${session.reflectionPrompt}\u201D`, 6986)] }),
        new TableRow({ children: [cell("Light evidence", 2400), cell(session.lightEvidence, 6986)] }),
        new TableRow({ children: [cell("Stopping point", 2400, LIGHT_GRAY), cell(session.stoppingPoint, 6986)] }),
        new TableRow({ children: [cell("Best-fit use case", 2400), cell(session.bestFit, 6986)] }),
      ],
    }),
    spacer(),
  ];
}

function makeLessonCards() {
  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Lesson Cards"),
      children: [
        ...titleBlock("7 Lesson Cards", "15\u201320 minute teacher-led sessions for Years 3\u20136"),
        highlightBox("Each lesson card has one learning intention, one activity, one reflection and a visible stopping point. Light evidence only."),
        spacer(),
        ...CANONICAL_SESSIONS.flatMap(sessionCard),
        h2("Suggested Sequence Options"),
        boldP("Full sequence: ", "Use Sessions 1\u20137 in order across two weeks."),
        boldP("Short systems sequence: ", "Use Sessions 1\u20133."),
        boldP("Short digital responsibility sequence: ", "Use Sessions 1, 2 and 5."),
        boldP("Single-session taster: ", "Use Session 1 as a complete standalone lesson."),
      ],
    }],
  });
}

// ──────────────────────────────────────
// DOCUMENT 5: Assessment & Reflection
// ──────────────────────────────────────
function makeAssessment() {
  const blankW = [1600, 1500, 1500, 1500, 1786, 1500];
  const headers = ["Student or pair", "Reads companion state", "Cause & effect", "Systems language", "Regulation strategy", "Collaborative"];
  function blankRow() {
    return new TableRow({
      children: blankW.map((w, i) =>
        cell(i === 0 ? "__________" : "Yes / Not yet", w)
      ),
    });
  }

  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Assessment & Reflection"),
      children: [
        ...titleBlock("Assessment & Reflection", "Light evidence tools \u2014 no marking required"),
        h2("No Marking Required"),
        highlightBox("This sequence is designed for light classroom evidence, not grading."),
        p("Teachers do not need to:"),
        bullet("Mark written paragraphs"),
        bullet("Grade student performance"),
        bullet("Create reports from the sequence"),
        bullet("Manage formal rubrics"),
        p("Teachers can collect simple evidence through two optional tools only."),
        spacer(),

        h2("Tool 1: Student Reflection Sheet"),
        p("Use this once near the end of the sequence, or after any lesson where you want a written snapshot."),
        spacer(),
        boldP("Name or alias: ", "______________________________"),
        boldP("Session: ", "______________________________"),
        spacer(),
        num("My digital companion was showing this visible state: __________"),
        num("I chose this action: __________"),
        num("The system changed in this way: __________"),
        num("This shows cause and effect because: __________"),
        num("One pattern I noticed was: __________"),
        num("One strategy that helped the companion recover or settle was: __________"),
        num("One thing I learned about working with a partner or listening to others was: __________"),
        spacer(),
        p("Captures: cause/effect reasoning, systems vocabulary, regulation strategy, collaborative reflection.", { run: { italics: true, color: MID_GRAY, size: 20 } }),
        spacer(),

        new Paragraph({ children: [new PageBreak()] }),

        h2("Tool 2: Teacher Observation Checklist"),
        p("Use this while circulating. A quick classroom note, not a scoring sheet."),
        spacer(),
        new Table({
          width: { size: 9386, type: WidthType.DXA },
          columnWidths: blankW,
          rows: [
            new TableRow({ children: headers.map((h, i) => headerCell(h, blankW[i])) }),
            blankRow(), blankRow(), blankRow(), blankRow(),
          ],
        }),
        spacer(),
        p("Captures: cause/effect reasoning, systems vocabulary, regulation strategy, collaborative reflection.", { run: { italics: true, color: MID_GRAY, size: 20 } }),
        spacer(),

        h2("When To Use These Tools"),
        bullet("Use the student reflection sheet when you want one written sample for a portfolio or class discussion."),
        bullet("Use the teacher observation checklist when you want a fast in-the-moment record without stopping the lesson."),
        spacer(),
        highlightBox("That is enough evidence for this sequence."),
      ],
    }],
  });
}

// ──────────────────────────────────────
// DOCUMENT 6: Pilot Prospectus
// ──────────────────────────────────────
function makePilotProspectus() {
  return new Document({
    styles: STYLES, numbering: NUMBERING,
    sections: [{
      properties: pageProps("Pilot Prospectus"),
      children: [
        ...titleBlock("Pilot Prospectus", "Independent proposal for a classroom trial"),
        h2("Problem Statement"),
        p("Australian schools need low-friction classroom tools that help students discuss systems, routines, and online safety habits without adding teacher admin or introducing avoidable privacy and safeguarding risk."),
        spacer(),
        h2("Pilot Scope"),
        new Table({
          width: { size: 9386, type: WidthType.DXA },
          columnWidths: [3000, 6386],
          rows: [
            new TableRow({ children: [headerCell("Parameter", 3000), headerCell("Detail", 6386)] }),
            new TableRow({ children: [cell("Year levels", 3000, LIGHT_GRAY), cell("Years 3\u20136", 6386)] }),
            new TableRow({ children: [cell("Schools", 3000), cell("1", 6386)] }),
            new TableRow({ children: [cell("Classes", 3000, LIGHT_GRAY), cell("1", 6386)] }),
            new TableRow({ children: [cell("Lead teacher", 3000), cell("1", 6386)] }),
            new TableRow({ children: [cell("Duration", 3000, LIGHT_GRAY), cell("Initial single-class pilot with a stop/go review after the first fortnight", 6386)] }),
            new TableRow({ children: [cell("Delivery model", 3000, LIGHT_GRAY), cell("Teacher-led classroom use only", 6386)] }),
          ],
        }),
        spacer(),
        h2("Pilot Boundaries"),
        bullet("No student accounts"),
        bullet("Alias-only classroom roster"),
        bullet("No social features"),
        bullet("No generative chat"),
        bullet("No always-on companion use"),
        spacer(),
        h2("Evidence Set"),
        bullet("Teacher interview"),
        bullet("Anonymous student exit feedback"),
        bullet("Parent/carer feedback"),
        bullet("Pre/post measure"),
        bullet("Incident log"),
        bullet("Dropout and engagement counts"),
        bullet("Implementation fidelity notes"),
        spacer(),
        h2("Operational Materials"),
        bullet("Acceptance Runbook"),
        bullet("Pilot Runbook"),
        bullet("School Partner Checklist"),
        bullet("Family Participation Protocol"),
        bullet("ICT/Privacy Review Checklist"),
        bullet("Parent Readability Checklist"),
        bullet("End-of-Pilot Summary"),
        spacer(),
        h2("Success Criteria"),
        bullet("Teachers can set up and run the sequence without account administration"),
        bullet("Leadership and ICT reviewers can understand the privacy and safety position quickly"),
        bullet("Students can explain simple system rules, state changes, or online safety habits after the sequence"),
        bullet("No significant safeguarding, privacy, or over-engagement incidents occur"),
        spacer(),
        h2("Stop Conditions"),
        highlightBox("The pilot will be paused or stopped if any of the following occur:"),
        bullet("The school profile exposes non-school product surfaces"),
        bullet("Teachers report unacceptable workload or setup burden"),
        bullet("Families or staff cannot distinguish the school deployment from the broader product"),
        bullet("A privacy or safeguarding issue remains unresolved"),
      ],
    }],
  });
}

// ──────────────────────────────────────
// Generate all documents
// ──────────────────────────────────────
async function main() {
  const base = path.resolve("public/docs/schools-au");

  const docs = [
    { doc: makeTeacherGuide(), file: path.join(base, "teacher-pack", "teacher-guide.docx") },
    { doc: makeParentNote(), file: path.join(base, "teacher-pack", "parent-note.docx") },
    { doc: makeStaffBrief(), file: path.join(base, "teacher-pack", "staff-brief.docx") },
    { doc: makeLessonCards(), file: path.join(base, "02-lesson-cards.docx") },
    { doc: makeAssessment(), file: path.join(base, "03-assessment-and-reflection.docx") },
    { doc: makePilotProspectus(), file: path.join(base, "pilot", "pilot-prospectus.docx") },
  ];

  for (const { doc, file } of docs) {
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(file, buffer);
    console.log(`Created: ${path.relative(process.cwd(), file)}`);
  }

  console.log(`\nDone. ${docs.length} documents created.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
