import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SchoolGamePage from "@/app/school-game/page";

const educationStore = {
  queue: [
    {
      id: "lesson-1",
      title: "Pattern Warmup",
      description: "Notice a simple strand pattern.",
      engagementCategory: "learning",
      focusArea: "pattern-recognition",
      targetMinutes: 8,
      dnaMode: "journey",
      standardsRef: [],
      prePrompt: null,
      postPrompt: null,
    },
  ],
  activeLesson: null,
  activateLesson: vi.fn(),
  lessonProgress: [],
  generateQuickFire: vi.fn(() => ({
    id: "quick-fire-1",
    pattern: [0, 1, 2],
  })),
  scoreQuickFire: vi.fn(() => ({
    success: true,
    xpAwarded: 5,
  })),
};

vi.mock("next/link", () => ({
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

vi.mock("framer-motion", () => {
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
            React.createElement(tag, props, children),
      },
    ),
  };
});

vi.mock("@/components/DigitalDNAHub", () => ({
  default: () => <div>DNA Hub</div>,
}));

vi.mock("@/components/EduVibeBoard", () => ({
  EduVibeBoard: () => <div>Edu Vibe Board</div>,
}));

vi.mock("@/components/EducationQueuePanel", () => ({
  EducationQueuePanel: () => <div>Education Queue</div>,
}));

vi.mock("@/components/RouteProgressionCard", () => ({
  RouteProgressionCard: () => <div>Route Progression Card</div>,
}));

vi.mock("@/components/RouteTutorialControls", () => ({
  RouteTutorialControls: () => <button type="button">Replay tutorial</button>,
}));

vi.mock("@/lib/journeyProgress", () => ({
  useJourneyProgressTracker: () => ({
    progress: {},
    markCompleted: vi.fn(),
  }),
}));

vi.mock("@/lib/education", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/education")>("@/lib/education");

  return {
    ...actual,
    useEducationStore: (selector: (store: typeof educationStore) => unknown) =>
      selector(educationStore),
  };
});

describe("SchoolGamePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps coming-soon actions out of the primary teacher hub menu", () => {
    render(<SchoolGamePage />);

    expect(screen.getByText("Pair with Pet via QR")).toBeInTheDocument();
    expect(screen.getByText("Planned extensions")).toBeInTheDocument();
    expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument();
  });
});
