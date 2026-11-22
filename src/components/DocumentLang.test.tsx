import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/ja" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { DocumentLang } from "@/components/DocumentLang";
import { readStoredLocale, storeLocale } from "@/lib/appCopy";

describe("DocumentLang", () => {
  beforeEach(() => {
    window.localStorage.clear();
    nav.pathname = "/ja";
  });

  it("remembers /ja on arrival and sets <html lang>", () => {
    render(<DocumentLang />);
    expect(readStoredLocale()).toBe("ja");
    expect(document.documentElement.lang).toBe("ja");
  });

  it("does not overwrite an explicit EN pick made before leaving /ja", () => {
    const view = render(<DocumentLang />);
    expect(readStoredLocale()).toBe("ja");
    // The switcher stores "en" while /ja is still the committed route…
    act(() => storeLocale("en"));
    expect(readStoredLocale()).toBe("en");
    // …then the route moves to the English home.
    nav.pathname = "/";
    view.rerender(<DocumentLang />);
    expect(readStoredLocale()).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
