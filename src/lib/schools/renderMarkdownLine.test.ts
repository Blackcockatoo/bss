import { describe, expect, it } from "vitest";
import { renderMarkdownLine } from "./renderMarkdownLine";

describe("renderMarkdownLine", () => {
  it("renders bold, italic and code", () => {
    expect(renderMarkdownLine("**Bold** and *soft* with `code`")).toBe(
      '<strong>Bold</strong> and <em>soft</em> with <code class="rounded bg-slate-800 px-1 py-0.5 text-amber-200">code</code>',
    );
  });

  it("escapes raw HTML in the source line", () => {
    const out = renderMarkdownLine('<img src=x onerror="alert(1)"> **hi**');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(out).toContain("<strong>hi</strong>");
  });

  it("escapes HTML inside markdown spans", () => {
    expect(renderMarkdownLine("`<script>alert(1)</script>`")).toContain(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(renderMarkdownLine("**<b onclick=x>**")).toBe(
      "<strong>&lt;b onclick=x&gt;</strong>",
    );
  });

  it("keeps ampersands readable", () => {
    expect(renderMarkdownLine("Parents & carers")).toBe("Parents &amp; carers");
  });
});
