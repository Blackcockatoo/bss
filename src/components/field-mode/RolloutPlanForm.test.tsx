import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY } from "@/lib/schools/storage";

import { RolloutPlanForm } from "./RolloutPlanForm";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("rollout plan form", () => {
  it("saves edits locally and can clear them", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    window.confirm = () => true;
    render(<RolloutPlanForm />);

    expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(
      /Term rollout plan/i,
    );
    fireEvent.change(screen.getByLabelText(/Year levels/i), {
      target: { value: "Years 4 and 5" },
    });
    expect(window.localStorage.getItem(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY)).toContain(
      "Years 4 and 5",
    );
    fireEvent.click(screen.getByRole("button", { name: /Clear this plan from this device/i }));
    expect(window.localStorage.getItem(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
