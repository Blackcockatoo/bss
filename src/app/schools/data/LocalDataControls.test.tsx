import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
  touchSchoolsLocalState,
} from "@/lib/schools/storage";

import { LocalDataControls } from "./LocalDataControls";

function seedClassroomData() {
  touchSchoolsLocalState(window.localStorage, Date.now());
  window.localStorage.setItem(
    SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
    JSON.stringify(["Pip", "Ash"]),
  );
  window.localStorage.setItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY, "{}");
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("local data controls", () => {
  it("says plainly when nothing is stored", async () => {
    render(<LocalDataControls />);

    expect(await screen.findByText(/Nothing is stored yet/i)).toBeInTheDocument();
  });

  it("lists held categories without revealing any stored value", async () => {
    seedClassroomData();
    render(<LocalDataControls />);

    const aliases = await screen.findByRole("heading", {
      name: /Classroom aliases/i,
    });
    expect(
      within(aliases.closest("li") as HTMLElement).getByText("Held"),
    ).toBeInTheDocument();

    // The alias values themselves must never be rendered.
    expect(screen.queryByText(/Pip/)).toBeNull();
    expect(screen.queryByText(/Ash/)).toBeNull();
  });

  it("requires an explicit confirmation before deleting anything", async () => {
    seedClassroomData();
    render(<LocalDataControls />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Delete all MetaPet School data/i }),
    );

    // Still there: opening the prompt must not delete anything.
    expect(
      window.localStorage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY),
    ).not.toBeNull();

    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/It cannot be undone/i),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Keep it/i }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(
      window.localStorage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY),
    ).not.toBeNull();
  });

  it("deletes everything once the adult confirms", async () => {
    seedClassroomData();
    render(<LocalDataControls />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Delete all MetaPet School data/i }),
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /Yes, delete it/i,
      }),
    );

    expect(
      window.localStorage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY),
    ).toBeNull();
    expect(
      window.localStorage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY),
    ).toBeNull();
    expect(
      screen.getByText(/All MetaPet School data on this device has been deleted/i),
    ).toBeInTheDocument();
  });

  it("keeps teacher setup when only the class session is deleted", async () => {
    seedClassroomData();
    render(<LocalDataControls />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Delete the class session/i }),
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /Yes, delete it/i,
      }),
    );

    expect(
      window.localStorage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY),
    ).toBeNull();
    expect(
      window.localStorage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY),
    ).toBe("{}");
  });

  it("exports a summary containing counts and dates but no alias", async () => {
    seedClassroomData();
    render(<LocalDataControls />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Show the summary/i }),
    );

    const summary = screen.getByText(/"categoriesHeld"/);
    expect(summary.textContent).toContain('"retentionDays": 35');
    expect(summary.textContent).not.toContain("Pip");
    expect(summary.textContent).not.toContain("Ash");
  });
});
