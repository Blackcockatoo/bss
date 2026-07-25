import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

const router = { push: vi.fn(), back: vi.fn() };

async function loadQuickNav({
  pathname,
  isSchoolsProfile = false,
}: {
  pathname: string;
  isSchoolsProfile?: boolean;
}) {
  vi.resetModules();
  vi.doMock("next/link", () => ({
    default: ({
      children,
      href,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }));
  vi.doMock("next/navigation", () => ({
    usePathname: () => pathname,
    useRouter: () => router,
  }));
  vi.doMock("@/lib/env/features", () => ({
    ENABLE_CHILD_SAFE_BASELINE: false,
    IS_SCHOOLS_PROFILE: isSchoolsProfile,
  }));
  vi.doMock("@/lib/haptics", () => ({
    triggerHaptic: vi.fn(),
  }));

  return (await import("./QuickNav")).QuickNav;
}

afterEach(() => {
  cleanup();
  document.cookie = "metapet-field-ui=; Max-Age=0; path=/";
  vi.resetModules();
  vi.doUnmock("next/link");
  vi.doUnmock("next/navigation");
  vi.doUnmock("@/lib/env/features");
  vi.doUnmock("@/lib/haptics");
});

// Regression coverage for the dead/blocked "Explore" button reported on the
// metapet.school (school) product profile.
//
// The bottom navigation previously decided which item set to show using a
// client-only, best-effort marker (a non-HttpOnly "presentation" cookie) and
// a narrow path regex that only recognised "/schools" and "/school-game".
// Any approved school page outside that narrow regex (privacy/safety notices,
// teacher pages, or simply the moment before the cookie check resolves) fell
// through to the full consumer item set, which includes an "Explore" link to
// "/app/activities". That route is not part of the school/Field Mode policy,
// so Field Mode's own boundary silently bounced the click back to Field Home
// -- the button rendered, but had no working destination on this profile.
describe("school profile navigation: Explore/Lessons regression", () => {
  it("never renders a generic Explore link on an approved school page, even before any presentation cookie is set", async () => {
    // "/legal/safety" is an approved school/Field page (see
    // CHILD_SAFE_ROUTE_POLICIES.schools / .field) but is outside the nested
    // Field layout and outside the legacy "/schools"-only path heuristic.
    const pathname = "/legal/safety";
    const QuickNav = await loadQuickNav({ pathname });

    render(<QuickNav />);

    const exploreLink = screen.queryByRole("link", { name: /^Explore$/i });
    expect(exploreLink).not.toBeInTheDocument();
  });

  it("replaces the dead Explore action with a working Lessons destination on the school profile", async () => {
    const pathname = "/legal/safety";
    const QuickNav = await loadQuickNav({ pathname });

    render(<QuickNav />);

    const lessonsLink = screen.getByRole("link", { name: /Lessons/i });
    const href = lessonsLink.getAttribute("href") ?? "";
    expect(href).not.toBe("");
    // The Lessons destination must actually be reachable under the Field
    // Mode boundary -- not just present in the DOM.
    expect(isPathnameAllowedByPolicy(href, "field"), href).toBe(true);
  });

  it("never sends a school-profile visitor to /app/activities from the primary navigation", async () => {
    const pathname = "/schools";
    const QuickNav = await loadQuickNav({ pathname, isSchoolsProfile: true });

    render(<QuickNav />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).not.toContain("/app/activities");
    for (const href of hrefs) {
      expect(isPathnameAllowedByPolicy(href ?? "", "field"), href ?? "").toBe(
        true,
      );
    }
  });

  it("keeps Explore available and working on the full MetaPet (core) profile", async () => {
    const QuickNav = await loadQuickNav({ pathname: "/pet" });

    render(<QuickNav />);

    const exploreLink = screen.getByRole("link", { name: /Explore/i });
    expect(exploreLink).toHaveAttribute("href", "/app/activities");
  });
});
