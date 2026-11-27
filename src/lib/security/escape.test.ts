import { describe, expect, it } from "vitest";
import { escapeHtml, serializeJsonForScript } from "./escape";

describe("escapeHtml", () => {
  it("escapes markup and attribute-breaking characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });

  it("handles non-string values", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});

describe("serializeJsonForScript", () => {
  it("cannot close a script element", () => {
    const payload = { id: "</script><script>alert(1)</script>", note: "a & b\u2028" };
    const out = serializeJsonForScript(payload);
    expect(out).not.toMatch(/<|>|&|\u2028/);
    expect(out.toLowerCase()).not.toContain("</script");
  });

  it("round-trips to the identical value", () => {
    const payload = { id: "</script>", n: 3, nested: { s: "<b>&amp;</b>\u2029" } };
    expect(JSON.parse(serializeJsonForScript(payload))).toEqual(payload);
  });
});
