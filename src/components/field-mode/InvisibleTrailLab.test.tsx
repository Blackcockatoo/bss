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
    expect(screen.getByText("Privacy-first design!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Require a real name to play" }));
    expect(screen.getByText("Keep investigating")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
