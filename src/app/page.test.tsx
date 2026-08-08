import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HomePage from "./page";

afterEach(cleanup);

describe("Blue Snake Studios home", () => {
  it("makes the school contribution model explicit without creating tiers", () => {
    render(<HomePage />);
    expect(screen.getByText(/No school is too poor to use it/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No school is too wealthy to help sustain it/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/A\$250, A\$750, A\$1,500\+, Custom/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voluntary contribution model/i }),
    ).toHaveAttribute("href", "/schools/contribute");
    expect(screen.queryByText(/A\$4\.99\/month/i)).toBeNull();
  });

  it("deep-links the evolution product area to the open evolution panel", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /See evolution/i })).toHaveAttribute(
      "href",
      "/pet?panel=evolution",
    );
  });
});
