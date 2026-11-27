/**
 * Output-encoding helpers for the few places that build HTML strings by hand
 * (homemade markdown, DOM widgets) or embed JSON inside a <script> element.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for safe use in HTML element content and quoted attributes. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/**
 * Serialise a value as JSON that is safe to place inside
 * `<script type="application/json">`. `<`, `>` and `&` are written as Unicode
 * escapes so a string such as `</script><script>…` cannot close the element,
 * and U+2028/U+2029 are escaped for older JavaScript parsers. The output is
 * still valid JSON and parses back to the identical value.
 */
export function serializeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
