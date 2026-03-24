import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PRIMARY_TEACHER_HUB_MENU_ACTIONS } from "@/app/school-game/menuActions";
import SchoolGamePage from "@/app/school-game/page";

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

vi.mock("@/components/ClassroomManager", () => ({
  ClassroomManager: () => <div>Classroom Manager</div>,
}));

vi.mock("@/lib/childSafeRoute.server", () => ({
  enforceChildSafeServerRoute: vi.fn(),
}));

describe("SchoolGamePage", () => {
  it("surfaces the teacher-led school runtime and download pack", () => {
    render(<SchoolGamePage />);

    expect(
      screen.getByRole("heading", { name: /Teacher-led classroom runtime/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Return to school overview/i }),
    ).toHaveAttribute("href", "/schools");
    expect(
      screen.getByText(
        /Use the school overview for reviewer-facing source materials and governance docs/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/No student sign-up/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^No internet$/i)).not.toBeInTheDocument();
    expect(screen.getByText("Pilot Evidence")).toBeInTheDocument();
    expect(screen.getByText("Classroom Manager")).toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();

    for (const action of PRIMARY_TEACHER_HUB_MENU_ACTIONS) {
      expect(
        screen.getByRole("link", { name: new RegExp(action.label, "i") }),
      ).toHaveAttribute("href", action.href);
      expect(action.href).toMatch(/\.docx$/);
    }
  });
});
