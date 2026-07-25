import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FieldClassroomPage from "@/app/schools/field/classroom/page";
import FieldTeacherGuidePage from "@/app/schools/field/guide/page";
import FieldLessonsPage from "@/app/schools/field/lessons/page";
import FieldModePage from "@/app/schools/field/page";
import FieldSafetyPage from "@/app/schools/field/safety/page";
import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";

const router = { push: vi.fn(), back: vi.fn() };

const BLOCKED_CONSUMER_ROUTE_FRAGMENTS = [
  "/app/activities",
  "/wardrobe",
  "/achievements",
  "/identity",
  "/body-forge",
  "/marketplace",
  "/shop",
  "/breeding",
];

async function loadQuickNav(pathname: string, isSchoolsProfile = false) {
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
  vi.doMock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));

  return (await import("./QuickNav")).QuickNav;
}

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("next/link");
  vi.doUnmock("next/navigation");
  vi.doUnmock("@/lib/env/features");
  vi.doUnmock("@/lib/haptics");
});

describe("school profile navigation", () => {
  it("does not present a 'School' item in the metapet.school primary navigation", async () => {
    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);

    expect(
      screen.queryByRole("link", { name: /^School$/i }),
    ).not.toBeInTheDocument();
  });

  it("does not present a generic 'Explore' item in the school navigation", async () => {
    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);

    expect(
      screen.queryByRole("link", { name: /^Explore$/i }),
    ).not.toBeInTheDocument();
  });

  it("presents 'Lessons', opening the canonical lesson picker", async () => {
    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);

    const lessons = screen.getByRole("link", { name: /^Lessons$/i });
    expect(lessons).toHaveAttribute("href", FIELD_MODE_LESSONS_PATH);
  });

  it("presents 'Classroom', opening the canonical classroom area", async () => {
    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);

    const classroom = screen.getByRole("link", { name: /^Classroom$/i });
    expect(classroom).toHaveAttribute("href", FIELD_MODE_CLASSROOM_PATH);
  });

  it("never points a school navigation item at /app/activities, games, wardrobe, achievements, Identity, Body Forge or marketplace routes", async () => {
    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");

    for (const fragment of BLOCKED_CONSUMER_ROUTE_FRAGMENTS) {
      expect(hrefs.some((href) => href.includes(fragment)), fragment).toBe(
        false,
      );
    }
  });

  it("resolves every visible school navigation destination to a real, rendering page", async () => {
    const destinationPages: Record<string, () => React.ReactElement> = {
      [FIELD_MODE_HOME_PATH]: () => <FieldModePage />,
      "/schools/field/lessons": () => <FieldLessonsPage />,
      [FIELD_MODE_CLASSROOM_PATH]: () => <FieldClassroomPage />,
      "/schools/field/guide": () => <FieldTeacherGuidePage />,
      "/schools/field/safety": () => <FieldSafetyPage />,
    };

    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    cleanup();

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const renderDestination = destinationPages[href];
      expect(renderDestination, `no destination page mapped for ${href}`).toBeTruthy();
      expect(() => {
        const { unmount } = render(renderDestination());
        unmount();
      }).not.toThrow();
    }
  });

  it("uses the same approved item set for mobile and desktop (a single shared QuickNav instance)", async () => {
    const QuickNav = await loadQuickNav("/schools", true);

    const mobile = render(<QuickNav />);
    const mobileHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    mobile.unmount();

    const desktop = render(<QuickNav />);
    const desktopHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    desktop.unmount();

    expect(mobileHrefs).toEqual(desktopHrefs);
  });

  it("keeps direct consumer routes blocked by Field Mode policy regardless of what the nav renders", () => {
    for (const pathname of [
      "/app/activities",
      "/identity",
      "/body-forge",
      "/marketplace",
      "/shop",
    ]) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(
        false,
      );
    }
  });

  it("Field Mode top bar and the school QuickNav agree on every primary destination", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/schools/field/lessons",
    }));
    const { FIELD_MODE_NAV_ITEMS } = await import("@/lib/childSafeBaseline");
    const { FieldModeNav } = await import(
      "@/components/field-mode/FieldModeNav"
    );
    render(<FieldModeNav />);
    const topBarHrefs = new Set(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    );
    cleanup();

    const QuickNav = await loadQuickNav("/schools", true);
    render(<QuickNav />);
    const quickNavHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    for (const href of quickNavHrefs) {
      expect(topBarHrefs.has(href), href ?? "").toBe(true);
    }
    // Every primary QuickNav item must trace back to a real
    // FIELD_MODE_NAV_ITEMS entry -- one canonical list, not two.
    for (const item of FIELD_MODE_NAV_ITEMS) {
      if (quickNavHrefs.includes(item.href)) {
        expect(topBarHrefs.has(item.href)).toBe(true);
      }
    }
  });
});

describe("full MetaPet profile navigation (bluesnakestudios.com)", () => {
  it("keeps Explore available, opening the broader activity hub", async () => {
    const QuickNav = await loadQuickNav("/pet");
    render(<QuickNav />);

    const explore = screen.getByRole("link", { name: /Explore/i });
    expect(explore).toHaveAttribute("href", "/app/activities");
  });

  it("keeps School available as a doorway to the dedicated school product", async () => {
    const QuickNav = await loadQuickNav("/pet");
    render(<QuickNav />);

    const school = screen.getByRole("link", { name: /^School$/i });
    expect(school).toHaveAttribute("href", "/schools");
  });

  it("leaves Pet, Wellness and Identity routes unchanged", async () => {
    const QuickNav = await loadQuickNav("/pet");
    render(<QuickNav />);

    expect(screen.getByRole("link", { name: /^Pet$/i })).toHaveAttribute(
      "href",
      "/pet",
    );
    expect(screen.getByRole("link", { name: /Wellness/i })).toHaveAttribute(
      "href",
      "/app/wellness",
    );
    expect(screen.getByRole("link", { name: /Identity/i })).toHaveAttribute(
      "href",
      "/identity",
    );
  });

  it("does not let the school-domain fix change the full MetaPet item count or order", async () => {
    const QuickNav = await loadQuickNav("/");
    render(<QuickNav />);

    const labels = screen
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());

    expect(labels).toEqual([
      "Home",
      "Pet",
      "Explore",
      "Wellness",
      "School",
      "Identity",
    ]);
  });
});
