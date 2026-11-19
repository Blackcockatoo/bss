import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrintAllLessonsPage from "@/app/schools/field/print/all/page";

afterEach(cleanup);

describe("printable pack of all seven lessons", () => {
  it("renders every lesson and the parent note from the existing pack", () => {
    render(<PrintAllLessonsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Print all seven lessons/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lesson 1: Meet the System" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Lesson 7: Test, Reflect and Improve",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Parent\/Carer Note/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/No student account/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Print \/ Save as PDF/i }),
    ).toBeInTheDocument();
  });
});
