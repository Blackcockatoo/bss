import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = {
  push: vi.fn(),
  back: vi.fn(),
};

async function loadQuickNav({
  pathname,
  isSchoolsProfile,
}: {
  pathname: string;
  isSchoolsProfile: boolean;
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
  vi.resetModules();
  vi.doUnmock("next/link");
  vi.doUnmock("next/navigation");
  vi.doUnmock("@/lib/env/features");
  vi.doUnmock("@/lib/haptics");
});

describe("QuickNav render behavior", () => {
  it("does not show the install button in school mode", async () => {
    const QuickNav = await loadQuickNav({
      pathname: "/schools",
      isSchoolsProfile: true,
    });

    render(<QuickNav />);

    const installEvent = new Event("beforeinstallprompt");
    Object.assign(installEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });

    await act(async () => {
      window.dispatchEvent(installEvent);
      await Promise.resolve();
    });

    expect(
      screen.queryByRole("button", { name: /Install app/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute(
      "href",
      "/schools",
    );
  });

  it("shows the install button in core mode when the install prompt is available", async () => {
    const QuickNav = await loadQuickNav({
      pathname: "/",
      isSchoolsProfile: false,
    });

    render(<QuickNav />);

    const installEvent = new Event("beforeinstallprompt");
    Object.assign(installEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });

    await act(async () => {
      window.dispatchEvent(installEvent);
      await Promise.resolve();
    });

    expect(
      screen.getByRole("button", { name: /Install app/i }),
    ).toBeInTheDocument();
  });
});
