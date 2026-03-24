import { act, cleanup, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ClassroomManager } from "@/components/ClassroomManager";
import { useEducationStore } from "@/lib/education";

describe("ClassroomManager", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.clear();
    useEducationStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
    window.localStorage.clear();
    useEducationStore.getState().reset();
  });

  it("keeps the school runtime local and does not render upgrade prompts", async () => {
    await act(async () => {
      render(<ClassroomManager />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      await screen.findByText(/Local classroom data only/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete local school data/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
  });
});
