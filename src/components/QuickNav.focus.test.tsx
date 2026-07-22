import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), back: vi.fn() };

/**
 * Load QuickNav, ClassroomFocusMode and the (shared) classroom focus signal
 * from a single fresh module graph so they all reference the same signal
 * singleton.
 */
async function loadFocusHarness() {
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
    usePathname: () => "/pet",
    useRouter: () => router,
  }));
  vi.doMock("@/lib/env/features", () => ({
    ENABLE_CHILD_SAFE_BASELINE: false,
    IS_SCHOOLS_PROFILE: false,
  }));
  vi.doMock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));

  const { QuickNav } = await import("./QuickNav");
  const { ClassroomFocusMode } = await import(
    "./teacher-lessons/ClassroomFocusMode"
  );
  const signal = await import("@/lib/teacher-lessons/classroomFocusSignal");
  return { QuickNav, ClassroomFocusMode, signal };
}

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.doUnmock("next/link");
  vi.doUnmock("next/navigation");
  vi.doUnmock("@/lib/env/features");
  vi.doUnmock("@/lib/haptics");
});

describe("global bottom bar during Classroom Focus Mode", () => {
  it("is a navigation landmark in normal mode", async () => {
    const { QuickNav } = await loadFocusHarness();
    render(<QuickNav />);
    expect(screen.getByRole("navigation")).toBeTruthy();
  });

  it("is completely removed while focus mode is active", async () => {
    const { QuickNav, signal } = await loadFocusHarness();
    render(<QuickNav />);
    act(() => signal.setClassroomFocusActive(true));
    // Removed from the DOM — cannot receive focus, pointer, or layout space.
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("restores when focus mode ends", async () => {
    const { QuickNav, signal } = await loadFocusHarness();
    render(<QuickNav />);
    act(() => signal.setClassroomFocusActive(true));
    expect(screen.queryByRole("navigation")).toBeNull();
    act(() => signal.setClassroomFocusActive(false));
    expect(screen.getByRole("navigation")).toBeTruthy();
  });

  it("never shows two persistent bottom bars at once", async () => {
    const { QuickNav, signal } = await loadFocusHarness();
    render(<QuickNav />);
    act(() => signal.setClassroomFocusActive(true));
    expect(screen.queryAllByRole("navigation")).toHaveLength(0);
  });

  it("ClassroomFocusMode drives the signal by active prop and unmount", async () => {
    const { ClassroomFocusMode, signal } = await loadFocusHarness();
    const props = {
      lessonTitle: "Test",
      onEnter: () => undefined,
      onExit: () => undefined,
    };
    const { rerender, unmount } = render(
      <ClassroomFocusMode active {...props}>
        <p>lesson</p>
      </ClassroomFocusMode>,
    );
    expect(signal.isClassroomFocusActive()).toBe(true);

    // Turning focus off restores the global bar.
    rerender(
      <ClassroomFocusMode active={false} {...props}>
        <p>lesson</p>
      </ClassroomFocusMode>,
    );
    expect(signal.isClassroomFocusActive()).toBe(false);

    // Unmount (route change / exit) also restores it.
    act(() => signal.setClassroomFocusActive(true));
    unmount();
    expect(signal.isClassroomFocusActive()).toBe(false);
  });
});
