"use client";

import type { ScriptedLessonCard } from "@/lib/education/lesson-cards";
import { Printer } from "lucide-react";

function buildWorksheetHtml(lesson: ScriptedLessonCard): string {
  const stepsHtml = lesson.steps
    .map(
      (s) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:600;">${s.order}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;">${s.durationMinutes} min</td>
          <td style="padding:6px 10px;border:1px solid #ddd;">${s.studentAction}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>${lesson.title} — Worksheet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 16px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #444; margin-bottom: 8px; border-bottom: 2px solid #e5e5e5; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 6px 10px; border: 1px solid #ddd; background: #f5f5f5; text-align: left; font-size: 12px; text-transform: uppercase; }
    .question-box { border: 2px solid #ddd; border-radius: 6px; padding: 12px; min-height: 80px; margin-bottom: 12px; }
    .question-label { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .safety { font-size: 11px; color: #888; text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e5e5; }
    @media print {
      body { padding: 12px; }
      .question-box { min-height: 60px; }
    }
  </style>
</head>
<body>
  <h1>${lesson.title}</h1>
  <p class="meta">${lesson.subtitle} &bull; ${lesson.durationMinutes} minutes &bull; ${lesson.pillar}</p>

  <div class="section">
    <div class="section-title">Steps</div>
    <table>
      <thead><tr><th>Step</th><th>Time</th><th>What to do</th></tr></thead>
      <tbody>${stepsHtml}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Before the activity</div>
    <div class="question-label">${lesson.prePrompt}</div>
    <div class="question-box"></div>
  </div>

  <div class="section">
    <div class="section-title">After the activity</div>
    <div class="question-label">${lesson.postPrompt}</div>
    <div class="question-box"></div>
  </div>

  <div class="section">
    <div class="section-title">What I noticed</div>
    <div class="question-label">Write or draw one thing that surprised you.</div>
    <div class="question-box" style="min-height:100px;"></div>
  </div>

  <p class="safety">${lesson.safetyNote} &bull; MetaPet Schools classroom activity</p>
</body>
</html>`;
}

export function openPrintableWorksheet(lesson: ScriptedLessonCard) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(buildWorksheetHtml(lesson));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function PrintWorksheetButton({
  lesson,
  className = "",
}: {
  lesson: ScriptedLessonCard;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openPrintableWorksheet(lesson)}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition ${className}`}
    >
      <Printer className="h-3.5 w-3.5" />
      Print Worksheet
    </button>
  );
}
