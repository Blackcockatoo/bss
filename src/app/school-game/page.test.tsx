import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
    expect(screen.getByText("Teacher Guide")).toBeInTheDocument();
    expect(screen.getByText("Pilot Evidence")).toBeInTheDocument();
    expect(screen.getByText("Classroom Manager")).toBeInTheDocument();
  });
});
