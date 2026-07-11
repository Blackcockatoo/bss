import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppWellnessPage from "@/app/app/wellness/page";

vi.mock("@/components/WellnessDashboard", () => ({
  WellnessDashboard: () => <div data-testid="wellness-dashboard" />,
}));

describe("AppWellnessPage", () => {
  it("renders the wellness header and dashboard", () => {
    render(<AppWellnessPage />);

    expect(
      screen.getByRole("heading", { name: /Wellness/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Everything here stays on this device/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wellness-dashboard")).toBeInTheDocument();
  });
});
