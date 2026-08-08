import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HomePage from "./page";

afterEach(cleanup);

describe("Blue Snake Studios home", () => {
  it("makes pricing discoverable from the hero and full product map", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /Plans from A\$0/i })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: /^Pricing$/i })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByText(/A\$4\.99\/month/i)).toBeInTheDocument();
  });

  it("deep-links the evolution product area to the open evolution panel", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /See evolution/i })).toHaveAttribute(
      "href",
      "/pet?panel=evolution",
    );
  });
});
