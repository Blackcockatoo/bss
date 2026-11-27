import { escapeHtml } from "@/lib/security/escape";

/**
 * Minimal inline markdown for the school document pack: **bold**, *italic*
 * and `code`. The source text is HTML-escaped *before* any markup is added,
 * so a document line can never inject its own tags, attributes or scripts.
 * The result is intended for `dangerouslySetInnerHTML`.
 */
export function renderMarkdownLine(line: string): string {
  return escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      '<code class="rounded bg-slate-800 px-1 py-0.5 text-amber-200">$1</code>',
    );
}
