import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeometryArcadeLauncher } from "./GeometryArcadeLauncher";

const fixture = vi.hoisted(() => ({
  petId: "saved-pet" as string | undefined,
  save: vi.fn(),
}));
vi.mock("@/lib/registry", () => ({
  usePetRegistryStore: (selector: (state: unknown) => unknown) =>
    selector({ activeRecord: fixture.petId ? { petId: fixture.petId } : null }),
}));
vi.mock("@/lib/games/geometryPilot", () => ({
  saveGeometryPilot: fixture.save,
}));
beforeEach(() => {
  fixture.petId = "saved-pet";
  fixture.save.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("geometry arcade handoff", () => {
  it("prepares the selected sprite once before entering the existing game route", async () => {
    let finish: () => void = () => {};
    fixture.save.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const navigate = vi
      .spyOn(window.location, "assign")
      .mockImplementation(() => {});
    const root = document.createElement("div");
    render(<GeometryArcadeLauncher scene={{ current: root }} />);
    const play = screen.getByRole("button", {
      name: "Play geometry in Monkey Invaders",
    });
    fireEvent.click(play);
    fireEvent.click(play);
    expect(fixture.save).toHaveBeenCalledTimes(1);
    expect(fixture.save).toHaveBeenCalledWith(root, "saved-pet");
    expect(navigate).not.toHaveBeenCalled();
    finish();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/monkey-invaders"),
    );
  });
  it("keeps Battle open and allows retry when preparation fails", async () => {
    fixture.save.mockRejectedValue(new Error("Storage unavailable"));
    const navigate = vi
      .spyOn(window.location, "assign")
      .mockImplementation(() => {});
    render(
      <GeometryArcadeLauncher
        scene={{ current: document.createElement("div") }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Play geometry in Monkey Invaders" }),
    );
    await screen.findByText("Storage unavailable");
    expect(navigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Play geometry in Monkey Invaders" }),
    ).toBeEnabled();
  });
  it("explains why an unregistered fallback cannot be sent as the saved companion", () => {
    fixture.petId = undefined;
    render(
      <GeometryArcadeLauncher
        scene={{ current: document.createElement("div") }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Play geometry in Monkey Invaders" }),
    ).toBeDisabled();
    expect(screen.getByText(/Load a registered companion/)).toBeInTheDocument();
  });
});
