import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

async function loadLoadingScreen(isSchoolsProfile: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/env/features", () => ({
    IS_SCHOOLS_PROFILE: isSchoolsProfile,
  }));

  return (await import("./MetaPetLoadingScreen")).MetaPetLoadingScreen;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env/features");
});

describe("MetaPetLoadingScreen", () => {
  it("uses school-safe copy in the schools profile", async () => {
    const MetaPetLoadingScreen = await loadLoadingScreen(true);

    render(<MetaPetLoadingScreen />);

    expect(
      screen.getByRole("heading", {
        name: /Preparing the classroom review path/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/MetaPet Schools/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Local classroom state stays on this device unless a teacher deliberately exports pilot evidence/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Blue Snake Studios/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/The Celestial Flight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/astral circuits/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/prime tails/i)).not.toBeInTheDocument();
  });
});
