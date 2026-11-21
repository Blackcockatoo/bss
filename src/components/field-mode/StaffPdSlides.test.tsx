import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { STAFF_PD_SLIDES } from "@/lib/schools/staffPd";

import { StaffPdSlides } from "./StaffPdSlides";

afterEach(cleanup);

describe("staff PD slides", () => {
  it("opens with speaker notes hidden and follows the keyboard", () => {
    render(<StaffPdSlides />);
    expect(
      screen.getByRole("heading", {
        name: "MetaPet School — 15-minute staff briefing",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Slide 1 of ${STAFF_PD_SLIDES.length}`)).toBeInTheDocument();
    expect(screen.queryByText(/Speaker note:/i)).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByText(/Speaker note:/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Print handout/i })).toHaveAttribute(
      "href",
      "/schools/field/print/staff-pd",
    );
  });
});
