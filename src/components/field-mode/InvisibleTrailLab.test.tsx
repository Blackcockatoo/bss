import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvisibleTrailLab } from "./InvisibleTrailLab";

describe("The Invisible Trail", () => {
  it("starts with fictional data and a teacher-guided purpose", () => {
    render(<InvisibleTrailLab />);
    expect(screen.getByRole("heading", { name: "THE INVISIBLE TRAIL" })).toBeInTheDocument();
    expect(screen.getByText("Pretend data only")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Teacher guide · Take it offline" })).toBeInTheDocument();
  });

  it("reveals only selected imaginary footprints", () => {
    render(<InvisibleTrailLab />);
    fireEvent.click(screen.getByRole("button", { name: "Play the shape puzzle" }));
    fireEvent.click(screen.getByRole("button", { name: "Put on Privacy Goggles" }));
    expect(screen.getByText("Shape puzzle opened")).toBeInTheDocument();
    expect(screen.queryByText("Star map explored")).not.toBeInTheDocument();
  });

  it("can complete the designer challenge without any identity input", () => {
    render(<InvisibleTrailLab />);
    fireEvent.click(screen.getByRole("button", { name: "Open chapter 5: Data Defender" }));
    expect(screen.getByText(/without saving a local play history/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep play history on this device" }));
    fireEvent.click(screen.getByRole("button", { name: "Let players erase saved progress" }));
    expect(screen.getByText(/The player can erase it/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Require a real name to play" }));
    expect(screen.getByText(/Players must give a real name/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("combines clues and clears choices from every mission on reset", () => {
    render(<InvisibleTrailLab />);
    fireEvent.click(screen.getByRole("button", { name: "Play the shape puzzle" }));
    fireEvent.click(screen.getByRole("button", { name: "Open chapter 4: Shadow Profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Frequently chooses rhythm levels" }));
    expect(screen.queryByText(/evening music challenge/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usually plays at 6 pm" }));
    expect(screen.getByText(/evening music challenge/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset activity" }));
    expect(screen.getByRole("heading", { name: "Footprint Forest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play the shape puzzle" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Open chapter 4: Shadow Profile" }));
    expect(screen.queryByText(/evening music challenge/)).not.toBeInTheDocument();
  });
});
