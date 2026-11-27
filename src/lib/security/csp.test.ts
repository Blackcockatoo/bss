import { describe, expect, it } from "vitest";
import {
  LEGACY_INLINE_SCRIPT_PAGES,
  buildContentSecurityPolicy,
  contentSecurityPolicyForPath,
  createCspNonce,
} from "./csp";

function directive(policy: string, name: string): string[] {
  const entry = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.split(/\s+/)[0] === name);
  return entry ? entry.split(/\s+/).slice(1) : [];
}

const prod = { isDevelopment: false, mapsEnabled: false, frameAncestors: "'self'" } as const;

describe("content security policy", () => {
  it("uses a nonce and no unsafe-inline/eval for app-route scripts in production", () => {
    const { nonce, header } = contentSecurityPolicyForPath("/pet", prod);
    expect(nonce).toBeTruthy();
    const scriptSrc = directive(header, "script-src");
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(directive(header, "script-src-attr")).toEqual(["'none'"]);
  });

  it("never allows cdnjs or any third-party script host by default", () => {
    for (const path of ["/", "/geometry-sound.html", "/moss60.html"]) {
      const { header } = contentSecurityPolicyForPath(path, prod);
      expect(header).not.toContain("cdnjs");
      for (const source of directive(header, "script-src")) {
        expect(source.startsWith("http")).toBe(false);
      }
    }
  });

  it("gives the static legacy HTML pages an inline-only policy without a nonce", () => {
    for (const path of LEGACY_INLINE_SCRIPT_PAGES) {
      const { nonce, header } = contentSecurityPolicyForPath(path, prod);
      expect(nonce).toBeNull();
      expect(directive(header, "script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    }
    // Only exact paths qualify.
    expect(contentSecurityPolicyForPath("/geometry-sound", prod).nonce).toBeTruthy();
    expect(contentSecurityPolicyForPath("/x/geometry-sound.html", prod).nonce).toBeTruthy();
  });

  it("mints a fresh, unguessable nonce per request", () => {
    const nonces = new Set(Array.from({ length: 200 }, () => createCspNonce()));
    expect(nonces.size).toBe(200);
    for (const nonce of nonces) {
      expect(Buffer.from(nonce, "base64")).toHaveLength(16);
    }
  });

  it("keeps the other hardening directives", () => {
    const header = buildContentSecurityPolicy({ ...prod, nonce: "abc" });
    expect(directive(header, "object-src")).toEqual(["'none'"]);
    expect(directive(header, "base-uri")).toEqual(["'self'"]);
    expect(directive(header, "form-action")).toEqual(["'self'"]);
    expect(directive(header, "frame-ancestors")).toEqual(["'self'"]);
    expect(directive(header, "connect-src")).toEqual(["'self'"]);
  });

  it("only relaxes for development and opt-in maps", () => {
    const dev = buildContentSecurityPolicy({ nonce: "abc", isDevelopment: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toEqual(["'self'", "ws:", "wss:"]);

    const maps = buildContentSecurityPolicy({
      nonce: "abc",
      mapsEnabled: true,
      mapsForgeOrigin: "https://forge.example",
    });
    expect(directive(maps, "script-src")).toEqual(
      expect.arrayContaining(["https://maps.googleapis.com", "https://forge.example"]),
    );
  });
});
