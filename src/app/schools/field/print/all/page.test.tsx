import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrintAllLessonsPage from "@/app/schools/field/print/all/page";

afterEach(cleanup);

describe("printable pack of all seven lessons", () => {
  it("renders every lesson and the parent note from the existing pack", () => {
    render(<PrintAllLessonsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Print the Years 3–6 classroom pack/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Lesson 1: Meet the System" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Lesson 7: Test, Reflect and Improve",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Parent and carer letter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Exit tickets/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Vocabulary word walls/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Assessment and reflection/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Principal and ICT one-pager/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/No student account/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Teacher in two minutes/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not been verified on school hardware/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /eSafety Commissioner — educators/i })).toHaveAttribute(
      "href",
      "https://www.esafety.gov.au/educators",
    );
    expect(
      screen.getByRole("button", { name: /Print \/ Save as PDF/i }),
    ).toBeInTheDocument();
  });
});
