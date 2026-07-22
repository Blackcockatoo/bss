import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FieldTeacherGuidePage from "@/app/schools/field/guide/page";
import FieldSafetyPage from "@/app/schools/field/safety/page";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

afterEach(cleanup);

describe("Field-owned support pages", () => {
  it("keeps the concise teacher guide available inside the Field boundary", () => {
    render(<FieldTeacherGuidePage />);

    expect(
      screen.getByRole("heading", { name: /Field Mode teacher guide/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Before class/i)).toBeInTheDocument();
    expect(screen.getByText(/During the lesson/i)).toBeInTheDocument();
    expect(screen.getByText(/After the lesson/i)).toBeInTheDocument();
  });

  it("keeps safeguarding, retention and parent information offline", () => {
    render(<FieldSafetyPage />);

    expect(
      screen.getByRole("heading", { name: /Safety and privacy at a glance/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Parent and carer information/i)).toBeInTheDocument();
    expect(screen.getByText(/35 days/i)).toBeInTheDocument();
    expect(screen.getByText(/If a concern arises/i)).toBeInTheDocument();
  });

  it("only links to routes approved by the Field profile", () => {
    for (const Page of [FieldTeacherGuidePage, FieldSafetyPage]) {
      const { container, unmount } = render(<Page />);
      for (const anchor of container.querySelectorAll("a[href]")) {
        const href = anchor.getAttribute("href");
        expect(href).not.toBeNull();
        expect(isPathnameAllowedByPolicy(href ?? "", "field"), href ?? "").toBe(
          true,
        );
      }
      unmount();
    }
  });
});
